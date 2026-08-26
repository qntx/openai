import { x402Client } from "@x402/fetch";
import { describe, expect, it } from "vite-plus/test";
import type { AvmConfig, EvmConfig } from "../src/chains/types.ts";
import type { X402OpenAIOptions } from "../src/client.ts";
import { X402OpenAI } from "../src/client.ts";
import * as api from "../src/index.ts";

type ForbiddenOptions = Extract<keyof X402OpenAIOptions, "wallet" | "wallets" | "mnemonic">;
type ForbiddenEvm = Extract<keyof EvmConfig, "mnemonic" | "accountIndex" | "derivationPath">;
type ForbiddenAvm = Extract<keyof AvmConfig, "algorandClient">;
type ForbiddenHederaBare = Extract<X402OpenAIOptions["hedera"], string>;
type ForbiddenNearBare = Extract<X402OpenAIOptions["near"], string>;
type ForbiddenMaxAmount = Extract<keyof typeof api, "maxAmount">;

function expectNever<_T extends never>(): void {}
expectNever<ForbiddenOptions>();
expectNever<ForbiddenEvm>();
expectNever<ForbiddenAvm>();
expectNever<ForbiddenHederaBare>();
expectNever<ForbiddenNearBare>();
expectNever<ForbiddenMaxAmount>();

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

describe("public API", () => {
  it("does not export mnemonic wallet types or maxAmount", () => {
    expect(api).not.toHaveProperty("EvmWallet");
    expect(api).not.toHaveProperty("SvmWallet");
    expect(api).not.toHaveProperty("Wallet");
    expect(api).not.toHaveProperty("maxAmount");
  });
});
