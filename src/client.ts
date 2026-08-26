/**
 * Drop-in OpenAI client with built-in x402 payment support.
 *
 * {@link X402OpenAI} replaces `openai.OpenAI` and transparently handles
 * HTTP 402 Payment Required responses via the x402 protocol.
 *
 * @example
 * ```ts
 * import { X402OpenAI } from "x402-openai";
 *
 * const client = new X402OpenAI({ evm: "0x…" });
 *
 * const client2 = new X402OpenAI({
 *   evm: "0x…",
 *   svm: "base58…",
 * });
 * ```
 */

import { wrapFetchWithPayment, type PaymentPolicy, type x402Client } from "@x402/fetch";
import type { ClientOptions } from "openai";
import OpenAI from "openai";
import type { EvmConfig, SvmConfig } from "./chains/types.ts";
import { assertPaymentOptions, buildX402Client } from "./payments.ts";

/** Default x402 LLM gateway URL. */
const DEFAULT_BASE_URL = "https://llm.qntx.org/v1";

/** x402-specific options on top of the standard OpenAI client options. */
export interface X402OpenAIOptions extends Omit<ClientOptions, "fetch"> {
  /** EVM secp256k1 private key (`0x` hex), or `{ privateKey, rpcUrl? }`. */
  evm?: `0x${string}` | EvmConfig;
  /** Solana base58 secret key, or `{ privateKey, rpcUrl? }`. */
  svm?: string | SvmConfig;
  /**
   * Payment policies to filter or prioritise payment requirements.
   * Forbidden when `x402Client` is provided.
   *
   * @example
   * ```ts
   * import { preferNetwork, preferScheme, maxAmount } from "x402-openai";
   *
   * policies: [
   *   preferNetwork("eip155:8453"),
   *   preferScheme("exact"),
   *   maxAmount(1_000_000n),
   * ]
   * ```
   */
  policies?: PaymentPolicy[];
  /** Pre-configured `x402Client`. Exclusive with `evm`, `svm`, and `policies`. */
  x402Client?: x402Client;
}

/**
 * Drop-in replacement for `openai.OpenAI` with transparent x402 payment.
 *
 * Provide at least one of `evm`, `svm`, or `x402Client`.
 *
 * Default `baseURL` is `https://llm.qntx.org/v1`.
 * All standard OpenAI constructor options (`baseURL`, `timeout`, `maxRetries`, …)
 * are forwarded transparently.
 *
 * @example
 * ```ts
 * import { preferNetwork, X402OpenAI } from "x402-openai";
 *
 * const client = new X402OpenAI({
 *   evm: "0x…",
 *   policies: [preferNetwork("eip155:8453")],
 * });
 *
 * const completion = await client.chat.completions.create({
 *   model: "gpt-4o-mini",
 *   messages: [{ role: "user", content: "Hello!" }],
 * });
 * ```
 */
export class X402OpenAI extends OpenAI {
  constructor(options: X402OpenAIOptions) {
    const { evm, svm, policies, x402Client: prebuilt, ...openaiOptions } = options;
    const payment = { evm, svm, policies, x402Client: prebuilt };
    assertPaymentOptions(payment);

    const x402Fetch = createLazyX402Fetch(payment);

    super({
      apiKey: "x402",
      baseURL: DEFAULT_BASE_URL,
      ...openaiOptions,
      fetch: x402Fetch,
    });
  }
}

type FetchFn = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

function createLazyX402Fetch(options: Parameters<typeof buildX402Client>[0]): FetchFn {
  let clientPromise: Promise<x402Client> | null = null;
  let wrappedFetch: FetchFn | null = null;

  return async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    if (!wrappedFetch) {
      if (!clientPromise) {
        clientPromise = buildX402Client(options);
      }
      const client = await clientPromise;
      wrappedFetch = wrapFetchWithPayment(globalThis.fetch, client) as FetchFn;
    }
    return wrappedFetch(input, init);
  };
}
