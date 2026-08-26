/**
 * Payment policy factory functions for filtering and prioritising
 * payment requirements.
 *
 * Policies are applied in order before the selector chooses the final
 * payment option. Each factory returns a {@link PaymentPolicy} function
 * compatible with `x402Client.registerPolicy()`.
 *
 * @example
 * ```ts
 * import { preferNetwork, preferScheme, maxAmount } from "x402-openai";
 *
 * const client = new X402OpenAI({
 *   evm: "0x…",
 *   svm: "base58…",
 *   policies: [
 *     preferNetwork("eip155:8453"),
 *     preferScheme("exact"),
 *     maxAmount(1_000_000n),
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
 * @param scheme - Payment scheme identifier (e.g. `"exact"`).
 */
export function preferScheme(scheme: string): PaymentPolicy {
  return (_version: number, reqs: PaymentRequirements[]): PaymentRequirements[] => {
    const matched = reqs.filter((r) => r.scheme === scheme);
    return matched.length > 0 ? matched : reqs;
  };
}

/**
 * Create a policy that filters out requirements exceeding a maximum amount.
 *
 * Compares against the `amount` field (V2) or `maxAmountRequired` field (V1).
 * If all requirements exceed the cap, they are all returned unchanged so that
 * the client can surface a meaningful error instead of silently failing.
 *
 * @param max - Maximum amount as a bigint or number (token base units).
 */
export function maxAmount(max: bigint | number): PaymentPolicy {
  const limit = BigInt(max);

  return (_version: number, reqs: PaymentRequirements[]): PaymentRequirements[] => {
    const matched = reqs.filter((r) => {
      const value = BigInt(
        "amount" in r ? r.amount : ((r as Record<string, string>).maxAmountRequired ?? "0"),
      );
      return value <= limit;
    });
    return matched.length > 0 ? matched : reqs;
  };
}
