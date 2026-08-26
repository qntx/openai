/**
 * Chat completion with spendControls and preference policies.
 *
 * Caps each payment at $0.50 of a default asset, prefers Base, then `upto`.
 *
 * Usage: EVM_PRIVATE_KEY="0x..." bun examples/chat-policy.ts
 */

import { preferNetwork, preferScheme, X402OpenAI } from "../src/index.ts";

const client = new X402OpenAI({
  evm: process.env.EVM_PRIVATE_KEY as `0x${string}`,
  spendControls: { maxAmountPerPayment: "$0.50" },
  policies: [preferNetwork("eip155:8453"), preferScheme("upto")],
});

const response = await client.chat.completions.create({
  model: process.env.MODEL ?? "openai/gpt-4o-mini",
  messages: [{ role: "user", content: "What is the x402 payment protocol?" }],
});

console.log(response.choices[0]?.message.content);
