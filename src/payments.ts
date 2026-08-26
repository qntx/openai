import { x402Client } from "@x402/fetch";
import { registerChains } from "./chains/register.ts";
import type { X402OpenAIOptions } from "./client.ts";

export type PaymentSourceOptions = Pick<
  X402OpenAIOptions,
  | "evm"
  | "svm"
  | "aptos"
  | "avm"
  | "stellar"
  | "hedera"
  | "near"
  | "xrpl"
  | "spendControls"
  | "policies"
  | "paymentRequirementsSelector"
  | "x402Client"
>;

const PREBUILT_EXCLUSIVE =
  "Cannot combine 'x402Client' with 'evm', 'svm', 'aptos', 'avm', 'stellar', 'hedera', 'near', 'xrpl', 'policies', 'spendControls', or 'paymentRequirementsSelector'. Configure the pre-built client directly.";

export function assertPaymentOptions(options: PaymentSourceOptions): void {
  const {
    evm,
    svm,
    aptos,
    avm,
    stellar,
    hedera,
    near,
    xrpl,
    spendControls,
    policies,
    paymentRequirementsSelector,
    x402Client: prebuilt,
  } = options;

  if (prebuilt != null) {
    if (
      evm !== undefined ||
      svm !== undefined ||
      aptos !== undefined ||
      avm !== undefined ||
      stellar !== undefined ||
      hedera !== undefined ||
      near !== undefined ||
      xrpl !== undefined ||
      spendControls !== undefined ||
      policies !== undefined ||
      paymentRequirementsSelector !== undefined
    ) {
      throw new Error(PREBUILT_EXCLUSIVE);
    }
    return;
  }

  if (
    evm === undefined &&
    svm === undefined &&
    aptos === undefined &&
    avm === undefined &&
    stellar === undefined &&
    hedera === undefined &&
    near === undefined &&
    xrpl === undefined
  ) {
    throw new Error(
      "Provide at least one of 'evm', 'svm', 'aptos', 'avm', 'stellar', 'hedera', 'near', 'xrpl', or 'x402Client'.",
    );
  }

  assertNonEmptyPrivateKey("evm", evm);
  assertNonEmptyPrivateKey("svm", svm);
  assertNonEmptyPrivateKey("aptos", aptos);
  assertNonEmptyPrivateKey("avm", avm);
  assertNonEmptyPrivateKey("stellar", stellar);
  assertNonEmptyHedera(hedera);
  assertNonEmptyNear(near);
  assertNonEmptySeed("xrpl", xrpl);
}

function assertNonEmptyPrivateKey(
  field: string,
  value: string | { privateKey: string } | undefined,
): void {
  if (value === undefined) {
    return;
  }
  const key = typeof value === "string" ? value : value.privateKey;
  if (!key) {
    throw new Error(`'${field}' private key must be a non-empty string.`);
  }
}

function assertNonEmptyHedera(value: PaymentSourceOptions["hedera"]): void {
  if (value === undefined) {
    return;
  }
  if (!value.accountId) {
    throw new Error("'hedera' accountId must be a non-empty string.");
  }
  if (!value.privateKey) {
    throw new Error("'hedera' private key must be a non-empty string.");
  }
}

function assertNonEmptyNear(value: PaymentSourceOptions["near"]): void {
  if (value === undefined) {
    return;
  }
  if (!value.accountId) {
    throw new Error("'near' accountId must be a non-empty string.");
  }
  if (!value.secretKey) {
    throw new Error("'near' secretKey must be a non-empty string.");
  }
}

function assertNonEmptySeed(field: string, value: string | { seed: string } | undefined): void {
  if (value === undefined) {
    return;
  }
  const seed = typeof value === "string" ? value : value.seed;
  if (!seed) {
    throw new Error(`'${field}' seed must be a non-empty string.`);
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
