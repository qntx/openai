import type { x402Client } from "@x402/fetch";
import type { SvmConfig } from "./types.ts";

export async function registerSvm(client: x402Client, config: SvmConfig): Promise<void> {
  try {
    const { ExactSvmScheme } = await import("@x402/svm/exact/client");
    const { createKeyPairSignerFromBytes } = await import("@solana/kit");
    const { base58 } = await import("@scure/base");
    const signer = await createKeyPairSignerFromBytes(base58.decode(config.privateKey));
    const svmOpts = config.rpcUrl ? { rpcUrl: config.rpcUrl } : undefined;
    client.register("solana:*", new ExactSvmScheme(signer, svmOpts));
  } catch (error) {
    if (isUnresolvedImport(error)) {
      throw new Error(
        "SVM key provided but @x402/svm is not installed. bun add @x402/svm @solana/kit @scure/base",
      );
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
