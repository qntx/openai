/**
 * EVM chat completion with payment policy (prefer specific network).
 *
 * Demonstrates how to use policies to control which chain is used for payment
 * when multiple payment options are available.
 *
 * Usage: EVM_PRIVATE_KEY="0x..." bun examples/chat-evm-policy.ts
 */

import { preferNetwork, X402OpenAI } from "../src/index.ts";

const client = new X402OpenAI({
  evm: process.env.EVM_PRIVATE_KEY as `0x${string}`,
  policies: [preferNetwork("eip155:8453")], // Prefer Base mainnet
});

const response = await client.chat.completions.create({
  model: process.env.MODEL ?? "openai/gpt-4o-mini",
  messages: [{ role: "user", content: "What is the x402 payment protocol?" }],
});

console.log(response.choices[0]?.message.content);
