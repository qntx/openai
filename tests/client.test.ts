import { x402Client } from "@x402/fetch";
import { describe, expect, it } from "vite-plus/test";
import type { EvmConfig } from "../src/chains/types.ts";
import type { X402OpenAIOptions } from "../src/client.ts";
import { X402OpenAI } from "../src/client.ts";
import * as api from "../src/index.ts";

type ForbiddenOptions = Extract<keyof X402OpenAIOptions, "wallet" | "wallets" | "mnemonic">;
type ForbiddenEvm = Extract<keyof EvmConfig, "mnemonic" | "accountIndex" | "derivationPath">;

function expectNever<_T extends never>(): void {}
expectNever<ForbiddenOptions>();
expectNever<ForbiddenEvm>();

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
  });

  it("throws when x402Client is combined with keys", () => {
    expect(
      () =>
        new X402OpenAI({
          x402Client: new x402Client(),
          evm: "0x1" as `0x${string}`,
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

  it("accepts a pre-built x402Client alone", () => {
    const client = new X402OpenAI({ x402Client: new x402Client() });
    expect(client).toBeInstanceOf(X402OpenAI);
  });
});

describe("public API", () => {
  it("does not export mnemonic wallet types", () => {
    expect(api).not.toHaveProperty("EvmWallet");
    expect(api).not.toHaveProperty("SvmWallet");
    expect(api).not.toHaveProperty("Wallet");
  });
});
