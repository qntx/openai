/**
 * Exercise exact + upto on Monad mainnet and testnet against local o402.
 *
 * Usage: bun --env-file=.env examples/local-monad-matrix.ts
 */

import { preferNetwork, preferScheme, X402OpenAI } from "../src/index.ts";

const key = process.env.EVM_PRIVATE_KEY as `0x${string}` | undefined;
if (!key) throw new Error("EVM_PRIVATE_KEY is required");

const baseURL = process.env.O402_BASE_URL ?? "http://127.0.0.1:8080/v1";
const chatModel = process.env.MODEL ?? "openrouter/meta-llama/llama-3.1-8b-instruct";
const networks = ["eip155:143", "eip155:10143"] as const;

function rpcUrl(network: (typeof networks)[number]): string {
  return network === "eip155:10143"
    ? "https://testnet-rpc.monad.xyz"
    : "https://rpc.monad.xyz";
}

function client(
  network: (typeof networks)[number],
  scheme: "exact" | "upto",
): X402OpenAI {
  return new X402OpenAI({
    evm: { privateKey: key, rpcUrl: rpcUrl(network) },
    baseURL,
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
    policies: [preferNetwork(network), preferScheme(scheme)],
  });
}

const unpaid = new X402OpenAI({
  evm: key,
  baseURL,
  apiKey: "x402",
  maxRetries: 0,
});
const models = await unpaid.models.list();
const ids: string[] = [];
for await (const model of models) ids.push(model.id);
console.log("models", ids.slice(0, 12));

for (const network of networks) {
  const upto = client(network, "upto");
  try {
    const chat = await upto.chat.completions.create({
      model: chatModel,
      messages: [{ role: "user", content: `One word for ${network}` }],
      max_tokens: 8,
      stream: false,
    });
    console.log("upto ok", {
      network,
      content: chat.choices[0]?.message.content,
      usage: chat.usage,
    });
  } catch (error) {
    console.error("upto fail", network, error);
  }

  const exact = client(network, "exact");
  try {
    const image = await exact.images.generate({
      model: "exact-echo",
      prompt: `exact ${network}`,
      n: 1,
      size: "256x256",
    });
    console.log("exact ok", { network, url: image.data?.[0]?.url });
  } catch (error) {
    console.error("exact fail", network, error);
  }
}
