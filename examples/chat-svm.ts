/**
 * SVM (Solana) chat completion with private key.
 *
 * Usage: SOLANA_PRIVATE_KEY="base58..." bun examples/chat-svm.ts
 */

import { X402OpenAI } from "../src/index.ts";

const client = new X402OpenAI({
  svm: process.env.SOLANA_PRIVATE_KEY ?? "",
});

const response = await client.chat.completions.create({
  model: process.env.MODEL ?? "gpt-4o-mini",
  messages: [{ role: "user", content: "What is the x402 payment protocol?" }],
});

console.log(response.choices[0]?.message.content);
