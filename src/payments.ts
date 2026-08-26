import { x402Client } from "@x402/fetch";
import { looksLikeBip39 } from "./chains/keeta.ts";
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
  | "tvm"
  | "keeta"
  | "concordium"
  | "spendControls"
  | "policies"
  | "paymentRequirementsSelector"
  | "x402Client"
>;

export type BuiltClient = {
  client: x402Client;
  dispose: () => Promise<void>;
};

const PREBUILT_EXCLUSIVE =
  "Cannot combine 'x402Client' with 'evm', 'svm', 'aptos', 'avm', 'stellar', 'hedera', 'near', 'xrpl', 'tvm', 'keeta', 'concordium', 'policies', 'spendControls', or 'paymentRequirementsSelector'. Configure the pre-built client directly.";

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
    tvm,
    keeta,
    concordium,
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
      tvm !== undefined ||
      keeta !== undefined ||
      concordium !== undefined ||
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
    xrpl === undefined &&
    tvm === undefined &&
    keeta === undefined &&
    concordium === undefined
  ) {
    throw new Error(
      "Provide at least one of 'evm', 'svm', 'aptos', 'avm', 'stellar', 'hedera', 'near', 'xrpl', 'tvm', 'keeta', 'concordium', or 'x402Client'.",
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
  assertNonEmptyPrivateKey("tvm", tvm);
  assertNonEmptyKeeta(keeta);
  assertNonEmptyConcordium(concordium);
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

function assertNonEmptyKeeta(value: PaymentSourceOptions["keeta"]): void {
  if (value === undefined) {
    return;
  }
  const seed = typeof value === "string" ? value : value.seed;
  if (!seed) {
    throw new Error("'keeta' seed must be a non-empty string.");
  }
  if (looksLikeBip39(seed)) {
    throw new Error("Keeta seed must be Account.fromSeed material, not a BIP-39 mnemonic");
  }
}

function assertNonEmptyConcordium(value: PaymentSourceOptions["concordium"]): void {
  if (value === undefined) {
    return;
  }
  if (!value.address) {
    throw new Error("'concordium' address must be a non-empty string.");
  }
  if (!value.privateKey) {
    throw new Error("'concordium' private key must be a non-empty string.");
  }
}

export async function buildX402Client(options: PaymentSourceOptions): Promise<BuiltClient> {
  assertPaymentOptions(options);

  if (options.x402Client != null) {
    return { client: options.x402Client, dispose: async () => {} };
  }

  const client = new x402Client(options.paymentRequirementsSelector);
  if (options.spendControls !== undefined) client.setSpendControls(options.spendControls);
  const handles = await registerChains(client, options);
  for (const policy of options.policies ?? []) {
    client.registerPolicy(policy);
  }
  return {
    client,
    dispose: async () => {
      await handles.keetaSigner?.destroy();
      handles.tvmScheme?.close();
    },
  };
}
