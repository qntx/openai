/**
 * x402-openai — Drop-in OpenAI TypeScript client with transparent x402 payment.
 *
 * Quick start:
 *
 * ```ts
 * import { preferScheme, X402OpenAI } from "x402-openai";
 *
 * const client = new X402OpenAI({ evm: "0x…" });
 *
 * const multi = new X402OpenAI({
 *   evm: "0x…",
 *   svm: "base58…",
 *   spendControls: { maxAmountPerPayment: "$0.50" },
 *   policies: [preferScheme("upto")],
 * });
 * ```
 *
 * Public API:
 *
 * - {@link X402OpenAI} — recommended client class.
 * - {@link preferNetwork} / {@link preferScheme} — payment preference policies.
 * - {@link SpendControls} — official spend-control object type.
 */

export type { PaymentPolicy, x402Client } from "@x402/fetch";
export type { EvmConfig, SvmConfig } from "./chains/types.ts";
export type { SpendControls, X402OpenAIOptions } from "./client.ts";
export { X402OpenAI } from "./client.ts";
export { preferNetwork, preferScheme } from "./policies.ts";
