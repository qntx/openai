import { ExactEvmScheme } from "@x402/evm/exact/client";
import { x402Client } from "@x402/fetch";
import { ExactSvmScheme } from "@x402/svm/exact/client";
import { describe, expect, it } from "vite-plus/test";
import { registerEvm } from "../src/chains/evm.ts";
import { registerSvm } from "../src/chains/svm.ts";
import { buildX402Client } from "../src/payments.ts";

const EVM_KEY = "0xac0974dac38f24671676c33098b7abf185c4d7b8d04844c06a56a24126c6dcbd" as const;
/** 64-byte Ed25519 secret (seed + pubkey), base58. Seed is 31 zero bytes + 0x01. */
const SVM_KEY = "1111111111111111111111111111111PPm2a2NNZH2EFJ5UkEjkH9Fcxn8cvjTmZDKQQisyLDmA";

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

  it("registers ExactSvmScheme on solana:* for a single svm key", async () => {
    const client = await buildX402Client({ svm: SVM_KEY });
    expect(client).toBeInstanceOf(x402Client);
    expect(registeredScheme(client, "solana:*", "exact")).toBeInstanceOf(ExactSvmScheme);
  });

  it("normalizes an svm config object", async () => {
    const client = await buildX402Client({ svm: { privateKey: SVM_KEY } });
    expect(registeredScheme(client, "solana:*", "exact")).toBeInstanceOf(ExactSvmScheme);
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

describe("registerSvm", () => {
  it("registers exact on solana:*", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerSvm(client, { privateKey: SVM_KEY });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.network).toBe("solana:*");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactSvmScheme);
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
