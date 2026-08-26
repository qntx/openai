/**
 * SVM (Solana) streaming chat completion with private key.
 *
 * Usage: SOLANA_PRIVATE_KEY="base58..." bun examples/streaming-svm.ts
 */

import { X402OpenAI } from "../src/index.ts";

const client = new X402OpenAI({
  svm: process.env.SOLANA_PRIVATE_KEY ?? "",
});

const stream = await client.chat.completions.create({
  model: process.env.MODEL ?? "gpt-4o-mini",
  messages: [{ role: "user", content: "Explain the x402 payment protocol." }],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
console.log();
