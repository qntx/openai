/**
 * List available models from the x402 gateway.
 *
 * Usage: EVM_PRIVATE_KEY="0x..." bun examples/models.ts
 */

import { X402OpenAI } from "../src/index.ts";

const client = new X402OpenAI({
  evm: process.env.EVM_PRIVATE_KEY as `0x${string}`,
});

const models = await client.models.list();

for await (const model of models) {
  console.log(model.id);
}
