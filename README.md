<div align="center">

# x402-openai

**Drop-in OpenAI TypeScript client with transparent [x402](https://www.x402.org/) payment support.**

[![npm](https://img.shields.io/npm/v/x402-openai)](https://www.npmjs.com/package/x402-openai)
[![TypeScript 5.0+](https://img.shields.io/badge/typescript-5.0+-blue)](https://typescriptlang.org)
[![CI](https://github.com/qntx/x402-openai-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/qntx/x402-openai-typescript/actions)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

</div>

---

Wrap the standard `openai.OpenAI` client with a crypto wallet.
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
import { EvmWallet } from "x402-openai/wallets";

const client = new X402OpenAI({
  wallet: new EvmWallet({ privateKey: "0x…" }),
});

const res = await client.chat.completions.create({
  model: "openai/gpt-4o-mini",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(res.choices[0]?.message.content);
```

Swap `EvmWallet` for `SvmWallet` to pay on Solana — the API is identical.

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
import { EvmWallet, SvmWallet } from "x402-openai/wallets";

const client = new X402OpenAI({
  wallets: [new EvmWallet({ privateKey: "0x…" }), new SvmWallet({ privateKey: "base58…" })],
});
```

### BIP-39 Mnemonic (EVM)

```ts
const wallet = new EvmWallet({ mnemonic: "word1 word2 … word12" });
const wallet2 = new EvmWallet({ mnemonic: "…", accountIndex: 2 }); // m/44'/60'/0'/0/2
const wallet3 = new EvmWallet({ mnemonic: "…", derivationPath: "m/44'/60'/2'/0/0" }); // custom path
```

The protocol selects the right chain automatically based on the server's payment requirements.

### Payment Policies

Use policies to control which chain or scheme is preferred when multiple payment options are available:

```ts
import { X402OpenAI, preferNetwork, preferScheme, maxAmount } from "x402-openai";
import { EvmWallet, SvmWallet } from "x402-openai/wallets";

const client = new X402OpenAI({
  wallets: [new EvmWallet({ privateKey: "0x…" }), new SvmWallet({ privateKey: "base58…" })],
  policies: [
    preferNetwork("eip155:8453"), // Prefer Base mainnet
    preferScheme("exact"), // Prefer exact payment scheme
    maxAmount(1_000_000n), // Cap at 1 USDC (6 decimals)
  ],
});
```

## API Reference

### `X402OpenAI`

Drop-in replacement for `openai.OpenAI`. Provide **exactly one** credential source:

| Parameter    | Type              | Description                                            |
| :----------- | :---------------- | :----------------------------------------------------- |
| `wallet`     | `Wallet`          | Single wallet adapter                                  |
| `wallets`    | `Wallet[]`        | Multiple adapters (multi-chain)                        |
| `policies`   | `PaymentPolicy[]` | Payment policies (chain/scheme preference, amount cap) |
| `x402Client` | `x402Client`      | Pre-configured x402 client (bypasses `policies`)       |

All standard OpenAI options (`baseURL`, `timeout`, `maxRetries`, …) are forwarded.
Default `baseURL`: `https://llm.qntx.org/v1`

### Wallet Adapters

| Class                          | Chain        | Install extras                      |
| :----------------------------- | :----------- | :---------------------------------- |
| `EvmWallet({ privateKey: … })` | EVM          | `@x402/evm viem`                    |
| `EvmWallet({ mnemonic: … })`   | EVM (BIP-39) | `@x402/evm viem`                    |
| `SvmWallet({ privateKey: … })` | Solana       | `@x402/svm @solana/kit @scure/base` |

Implement the [`Wallet`](src/wallets/base.ts) interface to add a new chain.

## Examples

See the [`examples/`](examples/) directory. Each script is self-contained:

```bash
EVM_PRIVATE_KEY="0x…"           bun examples/chat-evm.ts
SOLANA_PRIVATE_KEY="base58…"    bun examples/chat-svm.ts
EVM_PRIVATE_KEY="0x…"           bun examples/streaming-evm.ts
MNEMONIC="word1 word2 …"       bun examples/chat-evm-mnemonic.ts
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
