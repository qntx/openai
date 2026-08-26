/**
 * Multi-chain chat completion with payment policies.
 *
 * Registers both EVM and SVM keys, prefers Base, and raises the official
 * `$1` spend cap. Caps belong on `spendControls`, not policies.
 *
 * Usage:
 *   EVM_PRIVATE_KEY="0x..." SOLANA_PRIVATE_KEY="base58..." \
 *     bun examples/chat-multichain-policy.ts
 */

import { preferNetwork, preferScheme, X402OpenAI } from "../src/index.ts";

const client = new X402OpenAI({
  evm: process.env.EVM_PRIVATE_KEY as `0x${string}`,
  svm: process.env.SOLANA_PRIVATE_KEY ?? "",
  spendControls: { maxAmountPerPayment: "$1" },
  policies: [
    preferNetwork("eip155:8453"), // Prefer Base mainnet
    preferScheme("upto"),
  ],
});

const response = await client.chat.completions.create({
  model: process.env.MODEL ?? "openai/gpt-4o-mini",
  messages: [{ role: "user", content: "What is the x402 payment protocol?" }],
});

console.log(response.choices[0]?.message.content);
