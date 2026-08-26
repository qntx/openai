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

## Installation

```bash
bun add x402-openai @x402/evm viem                       # EVM (Ethereum / Base / …)
bun add x402-openai @x402/svm @solana/kit @scure/base    # Solana
bun add x402-openai @x402/evm @x402/svm viem @solana/kit @scure/base  # all chains
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

Pass `svm: "base58…"` instead of `evm` to pay on Solana — the rest of the API is identical.

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
});
```

The protocol selects the right chain automatically based on the server's payment requirements.

### Payment Policies

Use policies to control which chain or scheme is preferred when multiple payment options are available:

```ts
import { X402OpenAI, preferNetwork, preferScheme, maxAmount } from "x402-openai";

const client = new X402OpenAI({
  evm: "0x…",
  svm: "base58…",
  policies: [
    preferNetwork("eip155:8453"), // Prefer Base mainnet
    preferScheme("exact"), // Prefer exact payment scheme
    maxAmount(1_000_000n), // Cap at 1 USDC (6 decimals)
  ],
});
```

## API Reference

### `X402OpenAI`

Drop-in replacement for `openai.OpenAI`. Provide **at least one** of `evm`, `svm`, or `x402Client`:

| Parameter    | Type                               | Description                                               |
| :----------- | :--------------------------------- | :-------------------------------------------------------- |
| `evm`        | `` `0x${string}` `` or `EvmConfig` | EVM secp256k1 private key (`0x` hex)                      |
| `svm`        | `string` or `SvmConfig`            | Solana base58 secret key                                  |
| `policies`   | `PaymentPolicy[]`                  | Payment policies (chain/scheme preference, amount cap)    |
| `x402Client` | `x402Client`                       | Pre-configured x402 client (exclusive with keys/policies) |

`EvmConfig` / `SvmConfig`: `{ privateKey, rpcUrl? }`. Empty keys throw.

All standard OpenAI options (`baseURL`, `timeout`, `maxRetries`, …) are forwarded.
Default `baseURL`: `https://llm.qntx.org/v1`

Install extras:

| Option | Chain  | Install extras                      |
| :----- | :----- | :---------------------------------- |
| `evm`  | EVM    | `@x402/evm viem`                    |
| `svm`  | Solana | `@x402/svm @solana/kit @scure/base` |

## Examples

See the [`examples/`](examples/) directory. Each script is self-contained:

```bash
EVM_PRIVATE_KEY="0x…"           bun examples/chat-evm.ts
SOLANA_PRIVATE_KEY="base58…"    bun examples/chat-svm.ts
EVM_PRIVATE_KEY="0x…"           bun examples/streaming-evm.ts
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
