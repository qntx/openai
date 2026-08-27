// @ts-nocheck — bun:test is only resolved by `bun test` (CI), not tsc.
import { mock } from "bun:test";

/**
 * `@concordium/web-sdk` publishes a `bun` export that points at TypeScript
 * source. That source re-exports a type-only `Header`, which bun's test
 * runner rejects (`Exported binding name 'Header' is not found`).
 * Mock before tests load so CI `bun test` never evaluates that graph.
 */
class ExactConcordiumScheme {
  config: unknown;
  scheme = "exact";
  constructor(_signer: unknown, config: unknown) {
    this.config = config;
  }
}

mock.module("@concordium/web-sdk", () => ({
  AccountAddress: {
    fromBase58(address: string) {
      if (address === "not-an-address") {
        throw new Error("invalid Concordium address");
      }
      return { address };
    },
  },
  buildBasicAccountSigner(privateKey: string) {
    return { privateKey };
  },
}));

mock.module("@x402/concordium/exact/client", () => ({
  ExactConcordiumScheme,
}));
