import type { x402Client } from "@x402/fetch";
import type { AvmConfig } from "./types.ts";
import { isUnresolvedImport, missingPeerError } from "./unresolved-import.ts";

export async function registerAvm(client: x402Client, config: AvmConfig): Promise<void> {
  try {
    const { toClientAvmSigner } = await import("@x402/avm");
    const { ExactAvmScheme } = await import("@x402/avm/exact/client");
    const signer = toClientAvmSigner(config.privateKey);
    const opts =
      config.algodUrl || config.algodToken
        ? { algodUrl: config.algodUrl, algodToken: config.algodToken }
        : undefined;
    client.register("algorand:*", new ExactAvmScheme(signer, opts));
  } catch (error) {
    if (isUnresolvedImport(error)) {
      throw missingPeerError("AVM", "@x402/avm");
    }
    throw error;
  }
}
