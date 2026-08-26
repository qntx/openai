import { ExactAptosScheme } from "@x402/aptos/exact/client";
import { x402Client } from "@x402/fetch";
import { describe, expect, it } from "vite-plus/test";
import { registerAptos } from "../../src/chains/aptos.ts";
import { buildX402Client } from "../../src/payments.ts";

/** 32-byte Ed25519 seed; hex accepted by createClientSigner. */
const APTOS_KEY = "0x1111111111111111111111111111111111111111111111111111111111111111";

describe("registerAptos", () => {
  it("registers ExactAptosScheme on aptos:*", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerAptos(client, { privateKey: APTOS_KEY });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.network).toBe("aptos:*");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactAptosScheme);
  });

  it("does not rewrite invalid-key errors as a missing-peer hint", async () => {
    const client = { register() {} } as unknown as x402Client;
    await expect(registerAptos(client, { privateKey: "invalid-key" })).rejects.toThrow();
    await expect(registerAptos(client, { privateKey: "invalid-key" })).rejects.not.toThrow(
      /not installed/,
    );
  });
});

describe("buildX402Client aptos", () => {
  it("normalizes a bare string to ExactAptosScheme on aptos:*", async () => {
    const { client } = await buildX402Client({ aptos: APTOS_KEY });
    expect(registeredScheme(client, "aptos:*", "exact")).toBeInstanceOf(ExactAptosScheme);
  });

  it("normalizes an aptos config object", async () => {
    const { client } = await buildX402Client({ aptos: { privateKey: APTOS_KEY } });
    expect(registeredScheme(client, "aptos:*", "exact")).toBeInstanceOf(ExactAptosScheme);
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
