import type { x402Client } from "@x402/fetch";
import { registerEvm } from "./evm.ts";
import { registerSvm } from "./svm.ts";
import type { EvmConfig, SvmConfig } from "./types.ts";

export async function registerChains(
  client: x402Client,
  options: { evm?: `0x${string}` | EvmConfig; svm?: string | SvmConfig },
): Promise<void> {
  if (options.evm !== undefined) {
    await registerEvm(client, normalizeEvm(options.evm));
  }
  if (options.svm !== undefined) {
    await registerSvm(client, normalizeSvm(options.svm));
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
