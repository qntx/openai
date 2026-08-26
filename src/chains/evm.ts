import type { x402Client } from "@x402/fetch";
import type { EvmConfig } from "./types.ts";

export async function registerEvm(client: x402Client, config: EvmConfig): Promise<void> {
  try {
    const { ExactEvmScheme } = await import("@x402/evm/exact/client");
    const { privateKeyToAccount } = await import("viem/accounts");
    const account = privateKeyToAccount(config.privateKey);
    const opts = config.rpcUrl ? { rpcUrl: config.rpcUrl } : undefined;
    client.register("eip155:*", new ExactEvmScheme(account, opts));
  } catch (error) {
    if (isUnresolvedImport(error)) {
      throw new Error("EVM key provided but @x402/evm is not installed. bun add @x402/evm viem");
    }
    throw error;
  }
}

function isUnresolvedImport(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const code = "code" in error ? error.code : undefined;
  if (code === "ERR_MODULE_NOT_FOUND" || code === "MODULE_NOT_FOUND") {
    return true;
  }
  return error instanceof Error && /cannot find (?:package|module)/i.test(error.message);
}
