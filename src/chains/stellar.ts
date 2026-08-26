import type { x402Client } from "@x402/fetch";
import type { StellarConfig } from "./types.ts";
import { isUnresolvedImport, missingPeerError } from "./unresolved-import.ts";

export async function registerStellar(client: x402Client, config: StellarConfig): Promise<void> {
  try {
    const { createEd25519Signer } = await import("@x402/stellar");
    const { ExactStellarScheme } = await import("@x402/stellar/exact/client");
    const network = config.network ?? "stellar:pubnet";
    const signer = createEd25519Signer(config.privateKey, network);
    const rpc = config.rpcUrl ? { url: config.rpcUrl } : undefined;
    client.register("stellar:*", new ExactStellarScheme(signer, rpc));
  } catch (error) {
    if (isUnresolvedImport(error)) {
      throw missingPeerError("Stellar", "@x402/stellar");
    }
    throw error;
  }
}
