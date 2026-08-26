/**
 * x402-openai — Drop-in OpenAI TypeScript client with transparent x402 payment.
 *
 * Quick start:
 *
 * ```ts
 * import { preferNetwork, X402OpenAI } from "x402-openai";
 *
 * const client = new X402OpenAI({ evm: "0x…" });
 *
 * const multi = new X402OpenAI({
 *   evm: "0x…",
 *   svm: "base58…",
 *   policies: [preferNetwork("eip155:8453")],
 * });
 * ```
 *
 * Public API:
 *
 * - {@link X402OpenAI} — recommended client class.
 * - {@link preferNetwork} / {@link preferScheme} / {@link maxAmount} — payment policies.
 */

export type { PaymentPolicy, x402Client } from "@x402/fetch";
export type { EvmConfig, SvmConfig } from "./chains/types.ts";
export type { X402OpenAIOptions } from "./client.ts";
export { X402OpenAI } from "./client.ts";
export { maxAmount, preferNetwork, preferScheme } from "./policies.ts";
