<div align="center">

# x402-openai

**Drop-in OpenAI TypeScript client with transparent [x402](https://www.x402.org/) payment support.**

[![npm](https://img.shields.io/npm/v/x402-openai)](https://www.npmjs.com/package/x402-openai)
[![TypeScript 5.0+](https://img.shields.io/badge/typescript-5.0+-blue)](https://typescriptlang.org)
[![CI](https://github.com/qntx/x402-openai-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/qntx/x402-openai-typescript/actions)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

</div>

---

Wrap the standard `openai.OpenAI` client with per-chain private keys.
When the server responds with **HTTP 402**, the library automatically signs and retries the request — zero code changes needed.

Supplying `evm` or `svm` registers both **`exact` and `upto`**. `aptos`, `avm`, and `stellar` register **`exact` only**. Default spend controls from `@x402/core` cap each payment at **`$1`** of a recognized default asset.

## Installation

```bash
bun add x402-openai @x402/evm viem                       # EVM (Ethereum / Base / …)
bun add x402-openai @x402/svm @solana/kit @scure/base    # Solana
bun add x402-openai @x402/aptos                          # Aptos
bun add x402-openai @x402/avm                            # Algorand (AVM)
bun add x402-openai @x402/stellar                        # Stellar
```

## Quick Start

```ts
import { X402OpenAI } from "x402-openai";

const client = new X402OpenAI({
  evm: "0x…",
});

const res = await client.chat.completions.create({
  model: "openai/gpt-4o-mini",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(res.choices[0]?.message.content);
```

Pass `svm: "base58…"` instead of `evm` to pay on Solana — the rest of the API is identical. The same constructor accepts `aptos`, `avm`, and `stellar` keys.

## Usage

### Streaming

```ts
const stream = await client.chat.completions.create({
  model: "openai/gpt-4o-mini",
  messages: [{ role: "user", content: "Explain x402" }],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) process.stdout.write(content);
}
```

### Multi-chain

```ts
const client = new X402OpenAI({
  evm: "0x…",
  svm: "base58…",
  aptos: "0x…",
  avm: "base64…",
  stellar: "S…",
});
```

The protocol selects the right chain automatically based on the server's payment requirements.

### Key formats

| Option    | Key material                                          |
| :-------- | :---------------------------------------------------- |
| `evm`     | `0x` hex secp256k1                                    |
| `svm`     | base58 64-byte secret                                 |
| `aptos`   | hex or AIP-80 Ed25519 (`ed25519-priv-0x…`)            |
| `avm`     | base64 64-byte secret (32-byte seed + 32-byte pubkey) |
| `stellar` | Stellar `S…` secret seed                              |

Bare strings become `{ privateKey }`. Empty strings throw.

### Aptos, AVM, Stellar

These families register **`exact` only** (`upto` is not implemented in `@x402/*` for them).

- **Aptos** (`aptos:*`): `createClientSigner` from `@x402/aptos`. Optional `rpcUrl`. Optional 402 `extra.feePayer` enables a sponsored tx.
- **AVM** (`algorand:*`): `toClientAvmSigner` from `@x402/avm`. Optional `algodUrl` / `algodToken`. Do not pass a prebuilt Algorand client here — use the `x402Client` hatch. Optional 402 `extra.feePayer` for a gasless group.
- **Stellar** (`stellar:*`): `createEd25519Signer` from `@x402/stellar`. Default `network` is **`stellar:pubnet`** (the official factory defaults to `stellar:testnet`). Pass `network: "stellar:testnet"` for testnet. Optional `rpcUrl` is sent as `{ url }` (`RpcConfig`). Pubnet payments need a Soroban RPC URL. The 402 **must** set `extra.areFeesSponsored === true` or the scheme throws.

### Spend controls

`new x402Client()` already allows only default (USD-pegged) assets and caps each payment at **`$1`**. This package does not change that default.

Pass `spendControls` to raise the cap, allow extra assets, or disable controls:

```ts
const client = new X402OpenAI({
  evm: "0x…",
  spendControls: { maxAmountPerPayment: "$5" },
});
```

- Omit `spendControls` to keep the official `$1` + default-asset allowlist.
- `spendControls: false` disables allowlist and caps.
- Gateway prices above `$1` require the caller to raise `maxAmountPerPayment`.

### `exact` and `upto`

`evm` registers `ExactEvmScheme` and `UptoEvmScheme` on `eip155:*`. `svm` registers `ExactSvmScheme` and `UptoSvmScheme` on `solana:*`. No extra flag; the gateway is not probed.

- **EVM `upto`:** Permit2 (`permitWitnessTransferFrom`). The 402 must include `extra.facilitatorAddress`. Pass `{ rpcUrl }` on `evm` to enable official EIP-2612 / ERC-20 approval sponsoring.
- **SVM `upto`:** payment-channel `open` that **escrows the full authorized ceiling** until settle/close. The 402 must include `extra.feePayer` and `extra.receiverAuthorizer`.
- The 402 `amount` is the **authorized maximum**. The client signs that max; it does not sign a smaller amount. The server chooses the actual charge (`<=` max) at settle. If the ceiling exceeds spend controls, payment creation throws.

```ts
import { preferScheme, X402OpenAI } from "x402-openai";

const client = new X402OpenAI({
  evm: "0x…",
  policies: [preferScheme("upto")],
});
```

### Payment Policies

Use policies to prefer a chain or scheme when multiple options remain after spend controls. Policies do not cap spend.

```ts
import { X402OpenAI, preferNetwork, preferScheme } from "x402-openai";

const client = new X402OpenAI({
  evm: "0x…",
  svm: "base58…",
  policies: [
    preferNetwork("eip155:8453"), // Prefer Base mainnet
    preferScheme("upto"),
  ],
});
```

If nothing matches, all remaining options pass through.

## API Reference

### `X402OpenAI`

Drop-in replacement for `openai.OpenAI`. Provide **at least one** of `evm`, `svm`, `aptos`, `avm`, `stellar`, or `x402Client`:

| Parameter                     | Type                               | Description                                                                                            |
| :---------------------------- | :--------------------------------- | :----------------------------------------------------------------------------------------------------- |
| `evm`                         | `` `0x${string}` `` or `EvmConfig` | EVM secp256k1 private key (`0x` hex). Registers `exact` and `upto`.                                    |
| `svm`                         | `string` or `SvmConfig`            | Solana base58 secret key. Registers `exact` and `upto`.                                                |
| `aptos`                       | `string` or `AptosConfig`          | Aptos hex or AIP-80 Ed25519 key. Registers `exact`.                                                    |
| `avm`                         | `string` or `AvmConfig`            | Algorand base64 64-byte secret. Registers `exact`.                                                     |
| `stellar`                     | `string` or `StellarConfig`        | Stellar `S…` secret. Registers `exact`. Default network `stellar:pubnet`.                              |
| `spendControls`               | `SpendControls` or `false`         | Official spend controls. Omit for `$1` + default assets.                                               |
| `policies`                    | `PaymentPolicy[]`                  | Preference policies (`preferNetwork` / `preferScheme`).                                                |
| `paymentRequirementsSelector` | `SelectPaymentRequirements`        | Picks among remaining requirements after spend controls and policies.                                  |
| `x402Client`                  | `x402Client`                       | Pre-configured x402 client (exclusive with keys, spendControls, policies, paymentRequirementsSelector) |

`EvmConfig` / `SvmConfig` / `AptosConfig`: `{ privateKey, rpcUrl? }`.
`AvmConfig`: `{ privateKey, algodUrl?, algodToken? }`.
`StellarConfig`: `{ privateKey, network?, rpcUrl? }` (`rpcUrl` → `{ url }`). Empty keys throw.

`SpendControls` is `Exclude<NonNullable<x402ClientConfig["spendControls"]>, false>` from `@x402/fetch`.

All standard OpenAI options (`baseURL`, `timeout`, `maxRetries`, …) are forwarded.
Default `baseURL`: `https://llm.qntx.org/v1`

Install extras:

| Option    | Chain    | Install extras                      |
| :-------- | :------- | :---------------------------------- |
| `evm`     | EVM      | `@x402/evm viem`                    |
| `svm`     | Solana   | `@x402/svm @solana/kit @scure/base` |
| `aptos`   | Aptos    | `@x402/aptos`                       |
| `avm`     | Algorand | `@x402/avm`                         |
| `stellar` | Stellar  | `@x402/stellar`                     |

## Examples

See the [`examples/`](examples/) directory. Each script is self-contained:

```bash
EVM_PRIVATE_KEY="0x…"           bun examples/chat-evm.ts
SOLANA_PRIVATE_KEY="base58…"    bun examples/chat-svm.ts
EVM_PRIVATE_KEY="0x…"           bun examples/streaming-evm.ts
EVM_PRIVATE_KEY="0x…"           bun examples/chat-upto.ts
EVM_PRIVATE_KEY="0x…"           bun examples/chat-policy.ts
EVM_PRIVATE_KEY="0x…"           bun examples/chat-evm-policy.ts
EVM_PRIVATE_KEY="0x…" SOLANA_PRIVATE_KEY="base58…" bun examples/chat-multichain-policy.ts
```

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

A **[QuantX](https://qntx.org)** open-source project.

<a href="https://qntx.org"><img alt="QuantX" width="369" src="https://raw.githubusercontent.com/qntx/.github/main/profile/qntx.svg" /></a>

Code is law. We write both.

</div>
