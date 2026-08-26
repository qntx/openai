import { x402Client } from "@x402/fetch";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { describe, expect, it } from "vite-plus/test";
import { registerStellar } from "../../src/chains/stellar.ts";
import { buildX402Client } from "../../src/payments.ts";

/** Throwaway Stellar secret from @x402/stellar unit tests. */
const STELLAR_KEY = "SDV3OZOPGIO6GQAVI7T6ZJ7NSNFB26JX6QZYCI64TBC7BAZY6FQVAXXK";

describe("registerStellar", () => {
  it("registers ExactStellarScheme on stellar:*", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerStellar(client, { privateKey: STELLAR_KEY });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.network).toBe("stellar:*");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactStellarScheme);
  });

  it("accepts stellar:testnet and rpcUrl without hitting RPC", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerStellar(client, {
      privateKey: STELLAR_KEY,
      network: "stellar:testnet",
      rpcUrl: "https://soroban.example",
    });
    expect(calls[0]?.network).toBe("stellar:*");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactStellarScheme);
  });

  it("does not rewrite invalid-key errors as a missing-peer hint", async () => {
    const client = { register() {} } as unknown as x402Client;
    await expect(registerStellar(client, { privateKey: "not-a-stellar-secret" })).rejects.toThrow();
    await expect(
      registerStellar(client, { privateKey: "not-a-stellar-secret" }),
    ).rejects.not.toThrow(/not installed/);
  });
});

describe("buildX402Client stellar", () => {
  it("normalizes a bare string to ExactStellarScheme on stellar:*", async () => {
    const { client } = await buildX402Client({ stellar: STELLAR_KEY });
    expect(registeredScheme(client, "stellar:*", "exact")).toBeInstanceOf(ExactStellarScheme);
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
