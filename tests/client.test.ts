import { x402Client } from "@x402/fetch";
import { describe, expect, it } from "vite-plus/test";
import type { AvmConfig, EvmConfig, KeetaConfig } from "../src/chains/types.ts";
import type { X402OpenAIOptions } from "../src/client.ts";
import { X402OpenAI } from "../src/client.ts";
import * as api from "../src/index.ts";

type ForbiddenOptions = Extract<keyof X402OpenAIOptions, "wallet" | "wallets" | "mnemonic">;
type ForbiddenEvm = Extract<keyof EvmConfig, "mnemonic" | "accountIndex" | "derivationPath">;
type ForbiddenAvm = Extract<keyof AvmConfig, "algorandClient">;
type ForbiddenHederaBare = Extract<X402OpenAIOptions["hedera"], string>;
type ForbiddenNearBare = Extract<X402OpenAIOptions["near"], string>;
type ForbiddenConcordiumBare = Extract<X402OpenAIOptions["concordium"], string>;
type ForbiddenKeetaPrivateKey = Extract<keyof KeetaConfig, "privateKey">;
type ForbiddenMaxAmount = Extract<keyof typeof api, "maxAmount">;

function expectNever<_T extends never>(): void {}
expectNever<ForbiddenOptions>();
expectNever<ForbiddenEvm>();
expectNever<ForbiddenAvm>();
expectNever<ForbiddenHederaBare>();
expectNever<ForbiddenNearBare>();
expectNever<ForbiddenConcordiumBare>();
expectNever<ForbiddenKeetaPrivateKey>();
expectNever<ForbiddenMaxAmount>();

const EVM_KEY = "0xac0974dac38f24671676c33098b7abf185c4d7b8d04844c06a56a24126c6dcbd" as const;
const BIP39_12 =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const BIP39_24 = `${"abandon ".repeat(23)}about`;

describe("X402OpenAI", () => {
  it("defaults baseURL to https://llm.qntx.org/v1", () => {
    const client = new X402OpenAI({ evm: "0x1" as `0x${string}` });
    expect(client.baseURL).toBe("https://llm.qntx.org/v1");
  });

  it("throws when no credentials provided", () => {
    expect(() => new X402OpenAI({})).toThrow("at least one");
  });

  it("throws on empty keys", () => {
    expect(() => new X402OpenAI({ evm: "" as `0x${string}` })).toThrow("non-empty");
    expect(() => new X402OpenAI({ svm: "" })).toThrow("non-empty");
    expect(() => new X402OpenAI({ aptos: "" })).toThrow("non-empty");
    expect(() => new X402OpenAI({ avm: "" })).toThrow("non-empty");
    expect(() => new X402OpenAI({ stellar: "" })).toThrow("non-empty");
    expect(() => new X402OpenAI({ xrpl: "" })).toThrow("non-empty");
    expect(() => new X402OpenAI({ tvm: "" })).toThrow("non-empty");
    expect(() => new X402OpenAI({ keeta: "" })).toThrow("non-empty");
  });

  it("throws on empty privateKey objects", () => {
    expect(() => new X402OpenAI({ aptos: { privateKey: "" } })).toThrow("non-empty");
    expect(() => new X402OpenAI({ avm: { privateKey: "" } })).toThrow("non-empty");
    expect(() => new X402OpenAI({ stellar: { privateKey: "" } })).toThrow("non-empty");
    expect(() => new X402OpenAI({ xrpl: { seed: "" } })).toThrow("non-empty");
    expect(() => new X402OpenAI({ hedera: { accountId: "", privateKey: "0x1" } })).toThrow(
      "non-empty",
    );
    expect(() => new X402OpenAI({ hedera: { accountId: "0.0.1", privateKey: "" } })).toThrow(
      "non-empty",
    );
    expect(() => new X402OpenAI({ near: { accountId: "", secretKey: "ed25519:x" } })).toThrow(
      "non-empty",
    );
    expect(() => new X402OpenAI({ near: { accountId: "alice.near", secretKey: "" } })).toThrow(
      "non-empty",
    );
    expect(() => new X402OpenAI({ tvm: { privateKey: "" } })).toThrow("non-empty");
    expect(() => new X402OpenAI({ keeta: { seed: "" } })).toThrow("non-empty");
    expect(() => new X402OpenAI({ concordium: { address: "", privateKey: "00" } })).toThrow(
      "non-empty",
    );
    expect(() => new X402OpenAI({ concordium: { address: "addr", privateKey: "" } })).toThrow(
      "non-empty",
    );
  });

  it("accepts aptos, avm, stellar, hedera, near, or xrpl without evm/svm", () => {
    expect(new X402OpenAI({ aptos: "0x1" })).toBeInstanceOf(X402OpenAI);
    expect(new X402OpenAI({ avm: "key" })).toBeInstanceOf(X402OpenAI);
    expect(new X402OpenAI({ stellar: "S…" })).toBeInstanceOf(X402OpenAI);
    expect(new X402OpenAI({ hedera: { accountId: "0.0.1", privateKey: "0x1" } })).toBeInstanceOf(
      X402OpenAI,
    );
    expect(
      new X402OpenAI({ near: { accountId: "alice.near", secretKey: "ed25519:x" } }),
    ).toBeInstanceOf(X402OpenAI);
    expect(new X402OpenAI({ xrpl: "sEd…" })).toBeInstanceOf(X402OpenAI);
    expect(new X402OpenAI({ tvm: "00" })).toBeInstanceOf(X402OpenAI);
    expect(new X402OpenAI({ keeta: "not-bip39-seed" })).toBeInstanceOf(X402OpenAI);
    expect(new X402OpenAI({ concordium: { address: "addr", privateKey: "00" } })).toBeInstanceOf(
      X402OpenAI,
    );
  });

  it("throws when keeta looks like a BIP-39 mnemonic", () => {
    expect(() => new X402OpenAI({ keeta: BIP39_12 })).toThrow("BIP-39");
    expect(() => new X402OpenAI({ keeta: BIP39_24 })).toThrow("BIP-39");
    expect(() => new X402OpenAI({ keeta: { seed: BIP39_12 } })).toThrow("BIP-39");
  });

  it("throws when x402Client is combined with keys", () => {
    expect(
      () =>
        new X402OpenAI({
          x402Client: new x402Client(),
          evm: "0x1" as `0x${string}`,
        }),
    ).toThrow("Cannot combine");
    expect(
      () =>
        new X402OpenAI({
          x402Client: new x402Client(),
          aptos: "0x1",
        }),
    ).toThrow("Cannot combine");
    expect(
      () =>
        new X402OpenAI({
          x402Client: new x402Client(),
          avm: "key",
        }),
    ).toThrow("Cannot combine");
    expect(
      () =>
        new X402OpenAI({
          x402Client: new x402Client(),
          stellar: "S…",
        }),
    ).toThrow("Cannot combine");
    expect(
      () =>
        new X402OpenAI({
          x402Client: new x402Client(),
          hedera: { accountId: "0.0.1", privateKey: "0x1" },
        }),
    ).toThrow("Cannot combine");
    expect(
      () =>
        new X402OpenAI({
          x402Client: new x402Client(),
          near: { accountId: "alice.near", secretKey: "ed25519:x" },
        }),
    ).toThrow("Cannot combine");
    expect(
      () =>
        new X402OpenAI({
          x402Client: new x402Client(),
          xrpl: "sEd…",
        }),
    ).toThrow("Cannot combine");
    expect(
      () =>
        new X402OpenAI({
          x402Client: new x402Client(),
          tvm: "00",
        }),
    ).toThrow("Cannot combine");
    expect(
      () =>
        new X402OpenAI({
          x402Client: new x402Client(),
          keeta: "seed",
        }),
    ).toThrow("Cannot combine");
    expect(
      () =>
        new X402OpenAI({
          x402Client: new x402Client(),
          concordium: { address: "addr", privateKey: "00" },
        }),
    ).toThrow("Cannot combine");
  });

  it("throws when x402Client is combined with policies", () => {
    expect(
      () =>
        new X402OpenAI({
          x402Client: new x402Client(),
          policies: [(_v, reqs) => reqs],
        }),
    ).toThrow("Cannot combine");
  });

  it("throws when x402Client is combined with spendControls", () => {
    expect(
      () =>
        new X402OpenAI({
          x402Client: new x402Client(),
          spendControls: { maxAmountPerPayment: "$5" },
        }),
    ).toThrow("Cannot combine");
  });

  it("throws when x402Client is combined with paymentRequirementsSelector", () => {
    expect(
      () =>
        new X402OpenAI({
          x402Client: new x402Client(),
          paymentRequirementsSelector: (_v, reqs) => reqs[0]!,
        }),
    ).toThrow("Cannot combine");
  });

  it("accepts a pre-built x402Client alone", () => {
    const client = new X402OpenAI({ x402Client: new x402Client() });
    expect(client).toBeInstanceOf(X402OpenAI);
  });

  it("accepts spendControls and paymentRequirementsSelector with keys", () => {
    const client = new X402OpenAI({
      evm: "0x1" as `0x${string}`,
      spendControls: { maxAmountPerPayment: "$5" },
      paymentRequirementsSelector: (_v, reqs) => reqs[0]!,
    });
    expect(client).toBeInstanceOf(X402OpenAI);
  });
});

describe("X402OpenAI close", () => {
  it("close before the first request is a no-op", async () => {
    const client = new X402OpenAI({ evm: EVM_KEY });
    await expect(client.close()).resolves.toBeUndefined();
    await expect(client[Symbol.asyncDispose]()).resolves.toBeUndefined();
  });

  it("fetch after close throws and does not rebuild", async () => {
    const client = new X402OpenAI({ evm: EVM_KEY, baseURL: "http://127.0.0.1:9/v1" });
    await client.close();
    let fetchCalls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
      fetchCalls += 1;
      return originalFetch(...args);
    }) as typeof fetch;
    try {
      await expect(invokeClientFetch(client)).rejects.toThrow("X402OpenAI is closed");
      expect(fetchCalls).toBe(0);
      await expect(invokeClientFetch(client)).rejects.toThrow("X402OpenAI is closed");
      expect(fetchCalls).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

function invokeClientFetch(client: X402OpenAI): Promise<Response> {
  const fetchFn = (client as unknown as { fetch: typeof fetch }).fetch;
  return fetchFn("http://127.0.0.1:9/v1/models");
}

describe("public API", () => {
  it("does not export mnemonic wallet types or maxAmount", () => {
    expect(api).not.toHaveProperty("EvmWallet");
    expect(api).not.toHaveProperty("SvmWallet");
    expect(api).not.toHaveProperty("Wallet");
    expect(api).not.toHaveProperty("maxAmount");
  });
});
