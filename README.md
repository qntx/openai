# @qntx/openai

Drop-in [`openai.OpenAI`](https://github.com/openai/openai-node) client that pays [x402](https://www.x402.org/) 402s with per-chain private keys.

[![npm](https://img.shields.io/npm/v/@qntx/openai)](https://www.npmjs.com/package/@qntx/openai)
[![CI](https://github.com/qntx/openai/actions/workflows/ci.yml/badge.svg)](https://github.com/qntx/openai/actions)
[![TypeScript](https://img.shields.io/badge/typescript-7-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Pass a key. On HTTP 402 the client signs and retries. Chat, streaming, and the rest of the OpenAI SDK are unchanged.

Default `baseURL` is `https://llm.qntx.org/v1`. Default spend cap is **$1** on recognized USD-pegged assets (`new x402Client()`).

## Install

```bash
bun add @qntx/openai
```

Then add the peers for each chain you use:

| Chain      | Constructor field | Peers                                         |
| ---------- | ----------------- | --------------------------------------------- |
| EVM        | `evm`             | `@x402/evm` `viem`                            |
| Solana     | `svm`             | `@x402/svm` `@solana/kit` `@scure/base`       |
| Aptos      | `aptos`           | `@x402/aptos`                                 |
| Algorand   | `avm`             | `@x402/avm`                                   |
| Stellar    | `stellar`         | `@x402/stellar`                               |
| Hedera     | `hedera`          | `@x402/hedera`                                |
| NEAR       | `near`            | `@x402/near`                                  |
| XRPL       | `xrpl`            | `@x402/xrpl` `xrpl`                           |
| TON        | `tvm`             | `@x402/tvm` `@ton/crypto`                     |
| Keeta      | `keeta`           | `@x402/keeta` `@keetanetwork/keetanet-client` |
| Concordium | `concordium`      | `@x402/concordium` `@concordium/web-sdk`      |

## Quick start

```ts
import { X402OpenAI } from "@qntx/openai";

const client = new X402OpenAI({
  evm: process.env.EVM_PRIVATE_KEY as `0x${string}`,
});

const res = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello" }],
});
```

Streaming is the OpenAI SDK:

```ts
const stream = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Explain x402" }],
  stream: true,
});

for await (const chunk of stream) {
  const text = chunk.choices[0]?.delta?.content;
  if (text) process.stdout.write(text);
}
```

Supply every chain you can pay with. The 402 picks the match.

```ts
const client = new X402OpenAI({
  evm: "0x…",
  svm: "base58…",
  stellar: "S…",
});
```

## Chains

EVM and Solana register **exact** and **upto**. Every other family registers **exact** only.

| Field        | Key                                       | Network          | Notes                                                            |
| ------------ | ----------------------------------------- | ---------------- | ---------------------------------------------------------------- |
| `evm`        | `0x` secp256k1                            | `eip155:*`       | Optional `{ rpcUrl }` for EIP-2612 / ERC-20 sponsoring           |
| `svm`        | base58 64-byte secret                     | `solana:*`       | Optional `{ rpcUrl }`                                            |
| `aptos`      | hex or AIP-80 Ed25519                     | `aptos:*`        | Optional `{ rpcUrl }`                                            |
| `avm`        | base64 64-byte secret                     | `algorand:*`     | Optional `{ algodUrl, algodToken }`                              |
| `stellar`    | `S…` secret                               | `stellar:*`      | Default signer net `stellar:pubnet`. `rpcUrl` required on pubnet |
| `hedera`     | `{ accountId, privateKey }`               | `hedera:mainnet` | Or `hedera:testnet`. No string overload                          |
| `near`       | `{ accountId, secretKey }`                | `near:mainnet`   | Or `near:testnet`. `rpcUrl` → `{ [network]: rpcUrl }`            |
| `xrpl`       | family seed                               | `xrpl:0`         | Or `xrpl:1`. `wsUrl` → `{ [network]: wsUrl }`                    |
| `tvm`        | hex/base64 32-byte seed or 64-byte secret | `tvm:-239`       | Or `tvm:-3`. Not `tvm:*`                                         |
| `keeta`      | `generateRandomSeed({ asString: true })`  | `keeta:*`        | Not BIP-39                                                       |
| `concordium` | `{ privateKey, address }`                 | `ccd:*`          | No string overload. `useTls` defaults to `true`                  |

Bare strings become `{ privateKey }` except `xrpl` / `keeta`, which become `{ seed }`. Empty strings throw. Keeta 12/24-word mnemonics throw.

### 402 extras the server must send

The client does not invent these. Missing values make the official scheme throw.

| Field         | Required `extra`                 |
| ------------- | -------------------------------- |
| `evm` `upto`  | `facilitatorAddress`             |
| `svm` `exact` | `feePayer`                       |
| `svm` `upto`  | `feePayer`, `receiverAuthorizer` |
| `stellar`     | `areFeesSponsored === true`      |
| `hedera`      | `feePayer`                       |
| `xrpl`        | `areFeesSponsored === false`     |
| `tvm`         | `areFeesSponsored === true`      |
| `concordium`  | `feePayer`                       |

Optional `extra.feePayer` on Aptos (sponsored tx) and AVM (gasless group).

### Native assets

Default spend controls allow USD-pegged stables only. XRP, CCD, and HBAR (`0.0.0`) need an explicit allowlist.

```ts
new X402OpenAI({
  xrpl: { seed, network: "xrpl:0" },
  spendControls: {
    allowedAssets: [{ network: "xrpl:*", asset: "XRP" }],
  },
});

new X402OpenAI({
  concordium: { privateKey, address },
  spendControls: {
    allowedAssets: [{ network: "ccd:*", asset: "CCD" }],
  },
});
```

## Spend controls

Omit `spendControls` to keep the official **$1** cap and default-asset allowlist.

```ts
new X402OpenAI({
  evm: "0x…",
  spendControls: { maxAmountPerPayment: "$5" },
});
```

`spendControls: false` turns caps and allowlists off. A 402 above the cap throws; the client does not sign a smaller amount.

## exact and upto

No extra flag. If `evm` or `svm` is set, both schemes are registered.

| Scheme       | What the 402 `amount` is | Behavior                                                           |
| ------------ | ------------------------ | ------------------------------------------------------------------ |
| `exact`      | The charge               | One-shot transfer of that amount                                   |
| `upto` (EVM) | Authorized ceiling       | Permit2 via `x402UptoPermit2Proxy`. Server settles `<=` ceiling    |
| `upto` (SVM) | Authorized ceiling       | Payment-channel `open` escrows the full ceiling until settle/close |

Prefer a scheme when both remain after spend controls:

```ts
import { preferScheme, X402OpenAI } from "@qntx/openai";

new X402OpenAI({
  evm: "0x…",
  policies: [preferScheme("upto")],
});
```

## Policies

`preferNetwork` / `preferScheme` reorder remaining requirements. They are not a money cap. If nothing matches, the list is unchanged.

```ts
import { preferNetwork, preferScheme, X402OpenAI } from "@qntx/openai";

new X402OpenAI({
  evm: "0x…",
  svm: "base58…",
  policies: [preferNetwork("eip155:8453"), preferScheme("upto")],
});
```

## Lifecycle

TVM and Keeta hold long-lived HTTP / UserClient handles.

```ts
await using client = new X402OpenAI({ tvm: process.env.TVM_KEY });
// or: await client.close();
```

`close()` before the first request is a no-op. Fetch after close throws `X402OpenAI is closed` and does not rebuild.

## API

`X402OpenAI` subclasses `OpenAI`. Standard OpenAI options (`baseURL`, `timeout`, `maxRetries`, …) pass through. `fetch` is owned by this package.

```ts
new X402OpenAI({
  evm?, svm?, aptos?, avm?, stellar?,
  hedera?, near?, xrpl?, tvm?, keeta?, concordium?,
  spendControls?,          // SpendControls | false
  policies?,               // PaymentPolicy[]
  paymentRequirementsSelector?,
  x402Client?,             // exclusive with keys / spendControls / policies / selector
  ...openaiOptions,
});
```

At least one chain field or `x402Client` is required.

```ts
interface EvmConfig {
  privateKey: `0x${string}`;
  rpcUrl?: string;
}
interface SvmConfig {
  privateKey: string;
  rpcUrl?: string;
}
interface AptosConfig {
  privateKey: string;
  rpcUrl?: string;
}
interface AvmConfig {
  privateKey: string;
  algodUrl?: string;
  algodToken?: string;
}
interface StellarConfig {
  privateKey: string;
  network?: "stellar:pubnet" | "stellar:testnet";
  rpcUrl?: string;
}
interface HederaConfig {
  accountId: string;
  privateKey: string;
  network?: "hedera:mainnet" | "hedera:testnet";
  nodeUrl?: string;
}
interface NearConfig {
  accountId: string;
  secretKey: string;
  network?: "near:mainnet" | "near:testnet";
  rpcUrl?: string;
}
interface XrplConfig {
  seed: string;
  network?: "xrpl:0" | "xrpl:1";
  wsUrl?: string;
}
interface TvmConfig {
  privateKey: string;
  network?: "tvm:-239" | "tvm:-3";
  provider?: string;
  apiKey?: string;
  providerBaseUrl?: string;
}
interface KeetaConfig {
  seed: string;
}
interface ConcordiumConfig {
  privateKey: string;
  address: string;
  grpcUrl?: string;
  useTls?: boolean;
}
```

Exports: `X402OpenAI`, `preferNetwork`, `preferScheme`, plus the config / `SpendControls` / `PaymentPolicy` / `x402Client` types.

## Examples

Scripts in [`examples/`](examples/) are self-contained.

```bash
EVM_PRIVATE_KEY=0x…            bun examples/chat-evm.ts
SOLANA_PRIVATE_KEY=base58…     bun examples/chat-svm.ts
EVM_PRIVATE_KEY=0x…            bun examples/streaming-evm.ts
EVM_PRIVATE_KEY=0x…            bun examples/chat-upto.ts
EVM_PRIVATE_KEY=0x…            bun examples/chat-policy.ts
EVM_PRIVATE_KEY=0x…            bun examples/chat-evm-policy.ts
EVM_PRIVATE_KEY=0x… SOLANA_PRIVATE_KEY=base58… bun examples/multichain.ts
```

## License

[MIT](LICENSE)

---

A [QuantX](https://qntx.org) project.

<a href="https://qntx.org"><img alt="QuantX" width="240" src="https://raw.githubusercontent.com/qntx/.github/main/profile/qntx.svg" /></a>
