import { x402Client } from "@x402/fetch";
import { registerChains } from "./chains/register.ts";
import type { X402OpenAIOptions } from "./client.ts";

export type PaymentSourceOptions = Pick<
  X402OpenAIOptions,
  "evm" | "svm" | "policies" | "x402Client"
>;

export function assertPaymentOptions(options: PaymentSourceOptions): void {
  const { evm, svm, policies, x402Client: prebuilt } = options;

  if (prebuilt != null) {
    if (evm !== undefined || svm !== undefined || policies !== undefined) {
      throw new Error(
        "Cannot combine 'x402Client' with 'evm', 'svm', or 'policies'. Configure the pre-built client directly.",
      );
    }
    return;
  }

  if (evm === undefined && svm === undefined) {
    throw new Error("Provide at least one of 'evm', 'svm', or 'x402Client'.");
  }

  if (evm !== undefined) {
    const key = typeof evm === "string" ? evm : evm.privateKey;
    if (!key) {
      throw new Error("'evm' private key must be a non-empty string.");
    }
  }

  if (svm !== undefined) {
    const key = typeof svm === "string" ? svm : svm.privateKey;
    if (!key) {
      throw new Error("'svm' private key must be a non-empty string.");
    }
  }
}

export async function buildX402Client(options: PaymentSourceOptions): Promise<x402Client> {
  assertPaymentOptions(options);

  if (options.x402Client != null) {
    return options.x402Client;
  }

  const client = new x402Client();
  await registerChains(client, options);
  for (const policy of options.policies ?? []) {
    client.registerPolicy(policy);
  }
  return client;
}
