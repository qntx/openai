import { x402Client } from "@x402/fetch";
import { ExactNearScheme } from "@x402/near/exact/client";
import { describe, expect, it } from "vite-plus/test";
import { registerNear } from "../../src/chains/near.ts";
import { buildX402Client } from "../../src/payments.ts";

/** Throwaway ed25519 secret accepted by `createClientNearSigner`. */
const NEAR_SECRET =
  "ed25519:33N4kMWPhWh9SRrnGyCDpbHBSaQyJK3kHn7ZJihg6x2cnAVppP8f71tNudKMaitJ8ijYo5XSa4QnFDPD1nt3GC5A";
const NEAR_ACCOUNT = "alice.near";

describe("registerNear", () => {
  it("registers ExactNearScheme on near:mainnet by default", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerNear(client, { accountId: NEAR_ACCOUNT, secretKey: NEAR_SECRET });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.network).toBe("near:mainnet");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactNearScheme);
  });

  it("registers the configured CAIP-2, not near:*", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerNear(client, {
      accountId: NEAR_ACCOUNT,
      secretKey: NEAR_SECRET,
      network: "near:testnet",
      rpcUrl: "https://rpc.testnet.example",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.network).toBe("near:testnet");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactNearScheme);
  });

  it("does not rewrite invalid-key errors as a missing-peer hint", async () => {
    const client = { register() {} } as unknown as x402Client;
    await expect(
      registerNear(client, { accountId: NEAR_ACCOUNT, secretKey: "not-a-near-key" }),
    ).rejects.toThrow();
    await expect(
      registerNear(client, { accountId: NEAR_ACCOUNT, secretKey: "not-a-near-key" }),
    ).rejects.not.toThrow(/not installed/);
  });
});

describe("buildX402Client near", () => {
  it("registers ExactNearScheme on near:mainnet, not near:*", async () => {
    const client = await buildX402Client({
      near: { accountId: NEAR_ACCOUNT, secretKey: NEAR_SECRET },
    });
    expect(registeredScheme(client, "near:mainnet", "exact")).toBeInstanceOf(ExactNearScheme);
    expect(registeredScheme(client, "near:*", "exact")).toBeUndefined();
  });
});

function registeredScheme(client: x402Client, network: string, scheme: string): unknown {
  const schemes = (
    client as unknown as {
      registeredClientSchemes: Map<number, Map<string, Map<string, unknown>>>;
    }
  ).registeredClientSchemes;
  return schemes.get(2)?.get(network)?.get(scheme);
}
