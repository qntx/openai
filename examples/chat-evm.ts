/**
 * EVM chat completion with private key.
 *
 * Usage: EVM_PRIVATE_KEY="0x..." bun examples/chat-evm.ts
 */

import { X402OpenAI } from "../src/index.ts";

const client = new X402OpenAI({
  evm: process.env.EVM_PRIVATE_KEY as `0x${string}`,
});

const response = await client.chat.completions.create({
  model: process.env.MODEL ?? "gpt-4o-mini",
  messages: [{ role: "user", content: "What is the x402 payment protocol?" }],
});

console.log(response.choices[0]?.message.content);
