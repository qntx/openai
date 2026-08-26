import type { x402Client } from "@x402/fetch";
import { registerAptos } from "./aptos.ts";
import { registerAvm } from "./avm.ts";
import { registerEvm } from "./evm.ts";
import { registerHedera } from "./hedera.ts";
import { registerNear } from "./near.ts";
import { registerStellar } from "./stellar.ts";
import { registerSvm } from "./svm.ts";
import { registerXrpl } from "./xrpl.ts";
import type {
  AptosConfig,
  AvmConfig,
  EvmConfig,
  HederaConfig,
  NearConfig,
  StellarConfig,
  SvmConfig,
  XrplConfig,
} from "./types.ts";

export async function registerChains(
  client: x402Client,
  options: {
    evm?: `0x${string}` | EvmConfig;
    svm?: string | SvmConfig;
    aptos?: string | AptosConfig;
    avm?: string | AvmConfig;
    stellar?: string | StellarConfig;
    hedera?: HederaConfig;
    near?: NearConfig;
    xrpl?: string | XrplConfig;
  },
): Promise<void> {
  if (options.evm !== undefined) {
    await registerEvm(client, normalizeEvm(options.evm));
  }
  if (options.svm !== undefined) {
    await registerSvm(client, normalizeSvm(options.svm));
  }
  if (options.aptos !== undefined) {
    await registerAptos(client, normalizeAptos(options.aptos));
  }
  if (options.avm !== undefined) {
    await registerAvm(client, normalizeAvm(options.avm));
  }
  if (options.stellar !== undefined) {
    await registerStellar(client, normalizeStellar(options.stellar));
  }
  if (options.hedera !== undefined) {
    await registerHedera(client, normalizeHedera(options.hedera));
  }
  if (options.near !== undefined) {
    await registerNear(client, normalizeNear(options.near));
  }
  if (options.xrpl !== undefined) {
    await registerXrpl(client, normalizeXrpl(options.xrpl));
  }
}

function normalizeEvm(evm: `0x${string}` | EvmConfig): EvmConfig {
  const config = typeof evm === "string" ? { privateKey: evm } : evm;
  if (!config.privateKey) {
    throw new Error("'evm' private key must be a non-empty string.");
  }
  return config;
}

function normalizeSvm(svm: string | SvmConfig): SvmConfig {
  const config = typeof svm === "string" ? { privateKey: svm } : svm;
  if (!config.privateKey) {
    throw new Error("'svm' private key must be a non-empty string.");
  }
  return config;
}

function normalizeAptos(aptos: string | AptosConfig): AptosConfig {
  const config = typeof aptos === "string" ? { privateKey: aptos } : aptos;
  if (!config.privateKey) {
    throw new Error("'aptos' private key must be a non-empty string.");
  }
  return config;
}

function normalizeAvm(avm: string | AvmConfig): AvmConfig {
  const config = typeof avm === "string" ? { privateKey: avm } : avm;
  if (!config.privateKey) {
    throw new Error("'avm' private key must be a non-empty string.");
  }
  return config;
}

function normalizeStellar(stellar: string | StellarConfig): StellarConfig {
  const config = typeof stellar === "string" ? { privateKey: stellar } : stellar;
  if (!config.privateKey) {
    throw new Error("'stellar' private key must be a non-empty string.");
  }
  return config;
}

function normalizeHedera(config: HederaConfig): HederaConfig {
  if (!config.accountId) {
    throw new Error("'hedera' accountId must be a non-empty string.");
  }
  if (!config.privateKey) {
    throw new Error("'hedera' private key must be a non-empty string.");
  }
  return config;
}

function normalizeNear(config: NearConfig): NearConfig {
  if (!config.accountId) {
    throw new Error("'near' accountId must be a non-empty string.");
  }
  if (!config.secretKey) {
    throw new Error("'near' secretKey must be a non-empty string.");
  }
  return config;
}

function normalizeXrpl(xrpl: string | XrplConfig): XrplConfig {
  const config = typeof xrpl === "string" ? { seed: xrpl } : xrpl;
  if (!config.seed) {
    throw new Error("'xrpl' seed must be a non-empty string.");
  }
  return config;
}
