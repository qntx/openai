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

import {
  wrapFetchWithPayment,
  type PaymentPolicy,
  type SelectPaymentRequirements,
  type x402Client,
  type x402ClientConfig,
} from "@x402/fetch";
import type { ClientOptions } from "openai";
import OpenAI from "openai";
import type {
  AptosConfig,
  AvmConfig,
  EvmConfig,
  StellarConfig,
  SvmConfig,
} from "./chains/types.ts";
import { assertPaymentOptions, buildX402Client } from "./payments.ts";

/** Default x402 LLM gateway URL. */
const DEFAULT_BASE_URL = "https://llm.qntx.org/v1";

/** Official spend-control object (`false` is a separate constructor option). */
export type SpendControls = Exclude<NonNullable<x402ClientConfig["spendControls"]>, false>;

/** x402-specific options on top of the standard OpenAI client options. */
export interface X402OpenAIOptions extends Omit<ClientOptions, "fetch"> {
  /** EVM secp256k1 private key (`0x` hex), or `{ privateKey, rpcUrl? }`. Registers `exact` and `upto`. */
  evm?: `0x${string}` | EvmConfig;
  /** Solana base58 secret key, or `{ privateKey, rpcUrl? }`. Registers `exact` and `upto`. */
  svm?: string | SvmConfig;
  /** Aptos Ed25519 private key (hex or AIP-80), or `{ privateKey, rpcUrl? }`. Registers `exact`. */
  aptos?: string | AptosConfig;
  /** Algorand base64 64-byte secret, or `{ privateKey, algodUrl?, algodToken? }`. Registers `exact`. */
  avm?: string | AvmConfig;
  /**
   * Stellar `S…` secret, or `{ privateKey, network?, rpcUrl? }`. Registers `exact`.
   * Default `network` is `stellar:pubnet`. Stellar 402s must set `extra.areFeesSponsored === true`.
   */
  stellar?: string | StellarConfig;
  /**
   * Official spend controls (applied before policies).
   * Omit to keep the `@x402/core` default: default assets only, `$1` per payment.
   * Pass `false` to disable all spend controls.
   * Forbidden when `x402Client` is provided.
   */
  spendControls?: SpendControls | false;
  /**
   * Preference policies (`preferNetwork` / `preferScheme`).
   * Forbidden when `x402Client` is provided.
   *
   * @example
   * ```ts
   * import { preferNetwork, preferScheme } from "x402-openai";
   *
   * policies: [
   *   preferNetwork("eip155:8453"),
   *   preferScheme("upto"),
   * ]
   * ```
   */
  policies?: PaymentPolicy[];
  /**
   * Selects among remaining payment requirements after spend controls and policies.
   * Forbidden when `x402Client` is provided.
   */
  paymentRequirementsSelector?: SelectPaymentRequirements;
  /**
   * Pre-configured `x402Client`. Exclusive with chain keys, `spendControls`,
   * `policies`, and `paymentRequirementsSelector`.
   */
  x402Client?: x402Client;
}

/**
 * Drop-in replacement for `openai.OpenAI` with transparent x402 payment.
 *
 * Provide at least one of `evm`, `svm`, `aptos`, `avm`, `stellar`, or `x402Client`.
 *
 * Default `baseURL` is `https://llm.qntx.org/v1`.
 * All standard OpenAI constructor options (`baseURL`, `timeout`, `maxRetries`, …)
 * are forwarded transparently.
 *
 * @example
 * ```ts
 * import { preferScheme, X402OpenAI } from "x402-openai";
 *
 * const client = new X402OpenAI({
 *   evm: "0x…",
 *   spendControls: { maxAmountPerPayment: "$0.50" },
 *   policies: [preferScheme("upto")],
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
    const {
      evm,
      svm,
      aptos,
      avm,
      stellar,
      spendControls,
      policies,
      paymentRequirementsSelector,
      x402Client: prebuilt,
      ...openaiOptions
    } = options;
    const payment = {
      evm,
      svm,
      aptos,
      avm,
      stellar,
      spendControls,
      policies,
      paymentRequirementsSelector,
      x402Client: prebuilt,
    };
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
