import { ExactAvmScheme } from "@x402/avm/exact/client";
import { x402Client } from "@x402/fetch";
import { describe, expect, it } from "vite-plus/test";
import { registerAvm } from "../../src/chains/avm.ts";
import { buildX402Client } from "../../src/payments.ts";

/** Throwaway 64-byte (seed+pubkey) base64 key from @x402/avm unit tests. */
const AVM_KEY =
  "mZHHvLfOqJrIxIMTYPFdGWxfZy1MtaT3J6aJny+4yW1jkF6o6oKpKU7m5JfNdghc26oLTvRnEEBkDjY14WU3Cw==";

describe("registerAvm", () => {
  it("registers ExactAvmScheme on algorand:*", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerAvm(client, { privateKey: AVM_KEY });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.network).toBe("algorand:*");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactAvmScheme);
  });

  it("passes algodUrl and algodToken through without requiring algorandClient", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerAvm(client, {
      privateKey: AVM_KEY,
      algodUrl: "https://algod.example",
      algodToken: "token",
    });
    expect(calls[0]?.scheme).toBeInstanceOf(ExactAvmScheme);
  });

  it("does not rewrite invalid-key errors as a missing-peer hint", async () => {
    const client = { register() {} } as unknown as x402Client;
    await expect(registerAvm(client, { privateKey: "dG9vc2hvcnQ=" })).rejects.toThrow();
    await expect(registerAvm(client, { privateKey: "dG9vc2hvcnQ=" })).rejects.not.toThrow(
      /not installed/,
    );
  });
});

describe("buildX402Client avm", () => {
  it("normalizes a bare string to ExactAvmScheme on algorand:*", async () => {
    const client = await buildX402Client({ avm: AVM_KEY });
    expect(registeredScheme(client, "algorand:*", "exact")).toBeInstanceOf(ExactAvmScheme);
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
