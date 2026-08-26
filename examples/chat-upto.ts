/**
 * Chat completion preferring the `upto` scheme (EVM Permit2 / SVM channel escrow).
 *
 * Supplying `evm` or `svm` registers both `exact` and `upto`. The 402 `amount`
 * is the authorized maximum — the client signs that ceiling; it does not sign a
 * smaller amount. SVM `upto` escrows the full ceiling until settle/close.
 *
 * Usage: EVM_PRIVATE_KEY="0x..." bun examples/chat-upto.ts
 */

import { preferScheme, X402OpenAI } from "../src/index.ts";

const client = new X402OpenAI({
  evm: process.env.EVM_PRIVATE_KEY as `0x${string}`,
  policies: [preferScheme("upto")],
});

const response = await client.chat.completions.create({
  model: process.env.MODEL ?? "openai/gpt-4o-mini",
  messages: [{ role: "user", content: "What is the x402 upto payment scheme?" }],
});

console.log(response.choices[0]?.message.content);
