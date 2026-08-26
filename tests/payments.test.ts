import { ExactEvmScheme } from "@x402/evm/exact/client";
import { x402Client } from "@x402/fetch";
import { describe, expect, it } from "vite-plus/test";
import { registerEvm } from "../src/chains/evm.ts";
import { buildX402Client } from "../src/payments.ts";

const EVM_KEY = "0xac0974dac38f24671676c33098b7abf185c4d7b8d04844c06a56a24126c6dcbd" as const;

describe("buildX402Client", () => {
  it("throws when no credentials provided", async () => {
    await expect(buildX402Client({})).rejects.toThrow("at least one");
  });

  it("throws on empty evm string", async () => {
    await expect(buildX402Client({ evm: "" as `0x${string}` })).rejects.toThrow("non-empty");
  });

  it("throws on empty svm string", async () => {
    await expect(buildX402Client({ svm: "" })).rejects.toThrow("non-empty");
  });

  it("throws on empty evm privateKey object", async () => {
    await expect(buildX402Client({ evm: { privateKey: "" as `0x${string}` } })).rejects.toThrow(
      "non-empty",
    );
  });

  it("throws when x402Client is combined with keys", async () => {
    const prebuilt = new x402Client();
    await expect(buildX402Client({ x402Client: prebuilt, evm: EVM_KEY })).rejects.toThrow(
      "Cannot combine",
    );
  });

  it("throws when x402Client is combined with policies", async () => {
    const prebuilt = new x402Client();
    await expect(
      buildX402Client({ x402Client: prebuilt, policies: [(_v, reqs) => reqs] }),
    ).rejects.toThrow("Cannot combine");
  });

  it("returns a pre-built client as-is", async () => {
    const prebuilt = new x402Client();
    const result = await buildX402Client({ x402Client: prebuilt });
    expect(result).toBe(prebuilt);
  });

  it("registers ExactEvmScheme on eip155:* for a single evm key", async () => {
    const client = await buildX402Client({ evm: EVM_KEY });
    expect(client).toBeInstanceOf(x402Client);
    const exact = registeredScheme(client, "eip155:*", "exact");
    expect(exact).toBeInstanceOf(ExactEvmScheme);
  });

  it("normalizes an evm config object", async () => {
    const client = await buildX402Client({ evm: { privateKey: EVM_KEY } });
    expect(registeredScheme(client, "eip155:*", "exact")).toBeInstanceOf(ExactEvmScheme);
  });
});

describe("registerEvm", () => {
  it("registers exact on eip155:*", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerEvm(client, { privateKey: EVM_KEY });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.network).toBe("eip155:*");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactEvmScheme);
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
