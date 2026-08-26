import { x402Client } from "@x402/fetch";
import { registerChains } from "./chains/register.ts";
import type { X402OpenAIOptions } from "./client.ts";

export type PaymentSourceOptions = Pick<
  X402OpenAIOptions,
  "evm" | "svm" | "spendControls" | "policies" | "paymentRequirementsSelector" | "x402Client"
>;

const PREBUILT_EXCLUSIVE =
  "Cannot combine 'x402Client' with 'evm', 'svm', 'policies', 'spendControls', or 'paymentRequirementsSelector'. Configure the pre-built client directly.";

export function assertPaymentOptions(options: PaymentSourceOptions): void {
  const {
    evm,
    svm,
    spendControls,
    policies,
    paymentRequirementsSelector,
    x402Client: prebuilt,
  } = options;

  if (prebuilt != null) {
    if (
      evm !== undefined ||
      svm !== undefined ||
      spendControls !== undefined ||
      policies !== undefined ||
      paymentRequirementsSelector !== undefined
    ) {
      throw new Error(PREBUILT_EXCLUSIVE);
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

  const client = new x402Client(options.paymentRequirementsSelector);
  if (options.spendControls !== undefined) client.setSpendControls(options.spendControls);
  await registerChains(client, options);
  for (const policy of options.policies ?? []) {
    client.registerPolicy(policy);
  }
  return client;
}
