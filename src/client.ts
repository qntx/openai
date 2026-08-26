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
  ConcordiumConfig,
  EvmConfig,
  HederaConfig,
  KeetaConfig,
  NearConfig,
  StellarConfig,
  SvmConfig,
  TvmConfig,
  XrplConfig,
} from "./chains/types.ts";
import { assertPaymentOptions, buildX402Client, type BuiltClient } from "./payments.ts";

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
   * Hedera `0.0.N` account id plus ECDSA private key. Registers `exact` on the configured
   * CAIP-2 (`hedera:mainnet` by default). Hedera 402s must set `extra.feePayer`.
   * Native HBAR (`0.0.0`) is not a default asset — pass `spendControls.allowedAssets` to allow it.
   */
  hedera?: HederaConfig;
  /**
   * NEAR account id plus `ed25519:…` / `secp256k1:…` secret key. Registers `exact` on the
   * configured CAIP-2 (`near:mainnet` by default). Optional `rpcUrl` is mapped per network.
   */
  near?: NearConfig;
  /**
   * XRPL family seed, or `{ seed, network?, wsUrl? }`. Registers `exact` on the configured
   * CAIP-2 (`xrpl:0` by default). XRPL 402s must set `extra.areFeesSponsored === false`.
   * Default asset is RLUSD; native XRP needs `spendControls.allowedAssets`.
   */
  xrpl?: string | XrplConfig;
  /**
   * TON hex/base64 32-byte seed or 64-byte secret, or `{ privateKey, network?, provider?, apiKey?, providerBaseUrl? }`.
   * Registers `exact` on the configured CAIP-2 (`tvm:-239` by default). TVM 402s must set
   * `extra.areFeesSponsored === true`. Call `close()` on long-lived clients.
   */
  tvm?: string | TvmConfig;
  /**
   * Keeta `generateRandomSeed({ asString: true })` output, or `{ seed }`. Not a BIP-39 mnemonic.
   * Registers `exact` on `keeta:*`. Call `close()` on long-lived clients.
   */
  keeta?: string | KeetaConfig;
  /**
   * Concordium hex Ed25519 key plus base58 address. No string overload.
   * Registers `exact` on `ccd:*`. Concordium 402s must set `extra.feePayer`.
   * Native CCD is not a default asset (USDR is) — pass `spendControls.allowedAssets` to allow it.
   */
  concordium?: ConcordiumConfig;
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
 * Provide at least one of `evm`, `svm`, `aptos`, `avm`, `stellar`, `hedera`,
 * `near`, `xrpl`, `tvm`, `keeta`, `concordium`, or `x402Client`.
 *
 * Default `baseURL` is `https://llm.qntx.org/v1`.
 * All standard OpenAI constructor options (`baseURL`, `timeout`, `maxRetries`, …)
 * are forwarded transparently.
 *
 * Call {@link X402OpenAI.close} (or `await using`) to release Keeta/TVM handles.
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
  readonly close: () => Promise<void>;

  constructor(options: X402OpenAIOptions) {
    const {
      evm,
      svm,
      aptos,
      avm,
      stellar,
      hedera,
      near,
      xrpl,
      tvm,
      keeta,
      concordium,
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
      hedera,
      near,
      xrpl,
      tvm,
      keeta,
      concordium,
      spendControls,
      policies,
      paymentRequirementsSelector,
      x402Client: prebuilt,
    };
    assertPaymentOptions(payment);

    const lifecycle = createX402Lifecycle(payment);

    super({
      apiKey: "x402",
      baseURL: DEFAULT_BASE_URL,
      ...openaiOptions,
      fetch: lifecycle.fetch,
    });

    this.close = lifecycle.close;
  }

  [Symbol.asyncDispose](): Promise<void> {
    return this.close();
  }
}

type FetchFn = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

function createX402Lifecycle(options: Parameters<typeof buildX402Client>[0]): {
  fetch: FetchFn;
  close: () => Promise<void>;
} {
  let closed = false;
  let built: Promise<BuiltClient> | undefined;
  let wrappedFetch: FetchFn | undefined;

  return {
    fetch: async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      if (closed) {
        throw new Error("X402OpenAI is closed");
      }
      built ??= buildX402Client(options);
      const { client } = await built;
      if (closed) {
        throw new Error("X402OpenAI is closed");
      }
      wrappedFetch ??= wrapFetchWithPayment(globalThis.fetch, client) as FetchFn;
      return wrappedFetch(input, init);
    },
    close: async () => {
      closed = true;
      if (built !== undefined) {
        const { dispose } = await built;
        await dispose();
      }
    },
  };
}
