/**
 * Payment policy factory functions for preferring a network or scheme.
 *
 * Policies run after spend controls and before the selector. Each factory
 * returns a {@link PaymentPolicy} compatible with `x402Client.registerPolicy()`.
 *
 * @example
 * ```ts
 * import { preferNetwork, preferScheme } from "x402-openai";
 *
 * const client = new X402OpenAI({
 *   evm: "0x…",
 *   svm: "base58…",
 *   policies: [
 *     preferNetwork("eip155:8453"),
 *     preferScheme("upto"),
 *   ],
 * });
 * ```
 */

import type { PaymentPolicy, PaymentRequirements } from "@x402/fetch";

/**
 * Create a policy that prefers requirements matching a specific network.
 *
 * If any requirements match the pattern, only those are kept.
 * If none match, all requirements are passed through unchanged so that
 * payment can still proceed on an alternative network.
 *
 * Supports exact matches (`"eip155:8453"`) and wildcard prefixes
 * (`"eip155:*"`, `"solana:*"`).
 *
 * @param network - CAIP-2 network identifier or wildcard pattern.
 */
export function preferNetwork(network: string): PaymentPolicy {
  const isWildcard = network.endsWith(":*");
  const prefix = isWildcard ? network.slice(0, -1) : null; // "eip155:"

  return (_version: number, reqs: PaymentRequirements[]): PaymentRequirements[] => {
    const matched = reqs.filter((r) =>
      prefix ? r.network.startsWith(prefix) : r.network === network,
    );
    return matched.length > 0 ? matched : reqs;
  };
}

/**
 * Create a policy that prefers requirements matching a specific scheme.
 *
 * If any requirements match the scheme, only those are kept.
 * If none match, all requirements are passed through unchanged.
 *
 * @param scheme - Payment scheme identifier (`"exact"`, `"upto"`, or another registered scheme).
 */
export function preferScheme(scheme: "exact" | "upto" | (string & {})): PaymentPolicy {
  return (_version: number, reqs: PaymentRequirements[]): PaymentRequirements[] => {
    const matched = reqs.filter((r) => r.scheme === scheme);
    return matched.length > 0 ? matched : reqs;
  };
}
