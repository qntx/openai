import type { x402Client } from "@x402/fetch";
import { registerAptos } from "./aptos.ts";
import { registerAvm } from "./avm.ts";
import { registerConcordium } from "./concordium.ts";
import { registerEvm } from "./evm.ts";
import { registerHedera } from "./hedera.ts";
import { registerKeeta } from "./keeta.ts";
import { registerNear } from "./near.ts";
import { registerStellar } from "./stellar.ts";
import { registerSvm } from "./svm.ts";
import { registerTvm } from "./tvm.ts";
import { registerXrpl } from "./xrpl.ts";
import type {
  AptosConfig,
  AvmConfig,
  ConcordiumConfig,
  EvmConfig,
  HederaConfig,
  KeetaConfig,
  NearConfig,
  StellarConfig,
  SvmConfig,
  TvmConfig,
  XrplConfig,
} from "./types.ts";

export type ChainHandles = {
  keetaSigner?: { destroy(): Promise<void> };
  tvmScheme?: { close(): void };
};

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
    tvm?: string | TvmConfig;
    keeta?: string | KeetaConfig;
    concordium?: ConcordiumConfig;
  },
): Promise<ChainHandles> {
  const handles: ChainHandles = {};
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
  if (options.tvm !== undefined) {
    Object.assign(handles, await registerTvm(client, normalizeTvm(options.tvm)));
  }
  if (options.keeta !== undefined) {
    Object.assign(handles, await registerKeeta(client, normalizeKeeta(options.keeta)));
  }
  if (options.concordium !== undefined) {
    await registerConcordium(client, normalizeConcordium(options.concordium));
  }
  return handles;
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

function normalizeTvm(tvm: string | TvmConfig): TvmConfig {
  const config = typeof tvm === "string" ? { privateKey: tvm } : tvm;
  if (!config.privateKey) {
    throw new Error("'tvm' private key must be a non-empty string.");
  }
  return config;
}

function normalizeKeeta(keeta: string | KeetaConfig): KeetaConfig {
  const config = typeof keeta === "string" ? { seed: keeta } : keeta;
  if (!config.seed) {
    throw new Error("'keeta' seed must be a non-empty string.");
  }
  return config;
}

function normalizeConcordium(config: ConcordiumConfig): ConcordiumConfig {
  if (!config.address) {
    throw new Error("'concordium' address must be a non-empty string.");
  }
  if (!config.privateKey) {
    throw new Error("'concordium' private key must be a non-empty string.");
  }
  return config;
}
