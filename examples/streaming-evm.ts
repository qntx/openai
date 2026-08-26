/**
 * EVM streaming chat completion with private key.
 *
 * Usage: EVM_PRIVATE_KEY="0x..." bun examples/streaming-evm.ts
 */

import { X402OpenAI } from "../src/index.ts";

const client = new X402OpenAI({
  evm: process.env.EVM_PRIVATE_KEY as `0x${string}`,
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
