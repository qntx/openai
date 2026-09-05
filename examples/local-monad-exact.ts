/**
 * Local o402 exact settlement on Monad (mainnet or testnet).
 *
 * Hits POST /v1/images/generations (o402 bills that path exact) against the
 * local echo upstream (`exact-echo`).
 *
 * Usage:
 *   bun --env-file=.env examples/local-monad-exact.ts
 *   NETWORK=eip155:10143 bun --env-file=.env examples/local-monad-exact.ts
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
  policies: [preferNetwork(network), preferScheme("exact")],
});

const image = await client.images.generate({
  model: "exact-echo",
  prompt: `exact ${network}`,
  n: 1,
  size: "256x256",
});

console.log(JSON.stringify({
  network,
  model: "exact-echo",
  scheme: "exact",
  created: image.created,
  url: image.data?.[0]?.url,
}, null, 2));
