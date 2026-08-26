import { x402Client } from "@x402/fetch";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { describe, expect, it } from "vite-plus/test";
import { registerHedera } from "../../src/chains/hedera.ts";
import { buildX402Client } from "../../src/payments.ts";

/** Throwaway ECDSA hex accepted by `PrivateKey.fromStringECDSA`. */
const HEDERA_KEY = "0xac0974dac38f24671676c33098b7abf185c4d7b8d04844c06a56a24126c6dcbd";
const HEDERA_ACCOUNT = "0.0.1001";

describe("registerHedera", () => {
  it("registers ExactHederaScheme on hedera:mainnet by default", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerHedera(client, { accountId: HEDERA_ACCOUNT, privateKey: HEDERA_KEY });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.network).toBe("hedera:mainnet");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactHederaScheme);
  });

  it("registers the configured CAIP-2, not hedera:*", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerHedera(client, {
      accountId: HEDERA_ACCOUNT,
      privateKey: HEDERA_KEY,
      network: "hedera:testnet",
      nodeUrl: "https://testnet.hashio.io:50211",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.network).toBe("hedera:testnet");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactHederaScheme);
  });

  it("does not rewrite invalid-key errors as a missing-peer hint", async () => {
    const client = { register() {} } as unknown as x402Client;
    await expect(
      registerHedera(client, { accountId: HEDERA_ACCOUNT, privateKey: "invalid-key" }),
    ).rejects.toThrow();
    await expect(
      registerHedera(client, { accountId: HEDERA_ACCOUNT, privateKey: "invalid-key" }),
    ).rejects.not.toThrow(/not installed/);
  });
});

describe("buildX402Client hedera", () => {
  it("registers ExactHederaScheme on hedera:mainnet, not hedera:*", async () => {
    const client = await buildX402Client({
      hedera: { accountId: HEDERA_ACCOUNT, privateKey: HEDERA_KEY },
    });
    expect(registeredScheme(client, "hedera:mainnet", "exact")).toBeInstanceOf(ExactHederaScheme);
    expect(registeredScheme(client, "hedera:*", "exact")).toBeUndefined();
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
