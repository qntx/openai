import { x402Client } from "@x402/fetch";
import { ExactXrplScheme } from "@x402/xrpl/exact/client";
import { describe, expect, it } from "vite-plus/test";
import { registerXrpl } from "../../src/chains/xrpl.ts";
import { buildX402Client } from "../../src/payments.ts";

/** Throwaway XRPL seed from @x402/xrpl unit tests. */
const XRPL_SEED = "sEdTM1uX8pu2do5XvTnutH6HsouMaM2";

describe("registerXrpl", () => {
  it("registers ExactXrplScheme on xrpl:0 by default", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerXrpl(client, { seed: XRPL_SEED });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.network).toBe("xrpl:0");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactXrplScheme);
  });

  it("registers the configured CAIP-2, not xrpl:*", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerXrpl(client, {
      seed: XRPL_SEED,
      network: "xrpl:1",
      wsUrl: "wss://s.altnet.rippletest.net:51233",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.network).toBe("xrpl:1");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactXrplScheme);
  });

  it("does not rewrite invalid-key errors as a missing-peer hint", async () => {
    const client = { register() {} } as unknown as x402Client;
    await expect(registerXrpl(client, { seed: "not-a-seed" })).rejects.toThrow();
    await expect(registerXrpl(client, { seed: "not-a-seed" })).rejects.not.toThrow(/not installed/);
  });
});

describe("buildX402Client xrpl", () => {
  it("normalizes a bare string to ExactXrplScheme on xrpl:0, not xrpl:*", async () => {
    const client = await buildX402Client({ xrpl: XRPL_SEED });
    expect(registeredScheme(client, "xrpl:0", "exact")).toBeInstanceOf(ExactXrplScheme);
    expect(registeredScheme(client, "xrpl:*", "exact")).toBeUndefined();
  });

  it("normalizes an xrpl config object", async () => {
    const client = await buildX402Client({ xrpl: { seed: XRPL_SEED } });
    expect(registeredScheme(client, "xrpl:0", "exact")).toBeInstanceOf(ExactXrplScheme);
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
