/**
 * Local o402 upto chat on Monad (mainnet or testnet).
 *
 * Usage:
 *   bun --env-file=.env examples/local-monad-upto.ts
 *   NETWORK=eip155:10143 bun --env-file=.env examples/local-monad-upto.ts
 */

import { preferNetwork, preferScheme, X402OpenAI } from "../src/index.ts";

const network = (process.env.NETWORK ?? "eip155:143") as
  | "eip155:143"
  | "eip155:10143";
const key = process.env.EVM_PRIVATE_KEY as `0x${string}` | undefined;
if (!key) throw new Error("EVM_PRIVATE_KEY is required");

const rpcUrl =
  network === "eip155:10143"
    ? "https://testnet-rpc.monad.xyz"
    : "https://rpc.monad.xyz";

const client = new X402OpenAI({
  evm: { privateKey: key, rpcUrl },
  baseURL: process.env.O402_BASE_URL ?? "http://127.0.0.1:8080/v1",
  apiKey: "x402",
  maxRetries: 0,
  spendControls: {
    maxAmountPerPayment: "$1",
    allowedAssets: [
      {
        network: "eip155:10143",
        asset: "0x534b2f3A21130d7a60830c2Df862319e593943A3",
      },
    ],
  },
  policies: [preferNetwork(network), preferScheme("upto")],
});

const model = process.env.MODEL ?? "openrouter/meta-llama/llama-3.1-8b-instruct";
const response = await client.chat.completions.create({
  model,
  messages: [{ role: "user", content: `Reply with one word: ${network}` }],
  max_tokens: 16,
  stream: false,
});

console.log(JSON.stringify({
  network,
  model,
  scheme: "upto",
  content: response.choices[0]?.message.content,
  usage: response.usage,
}, null, 2));
