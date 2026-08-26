import type { x402Client } from "@x402/fetch";
import type { NearConfig } from "./types.ts";
import { isUnresolvedImport, missingPeerError } from "./unresolved-import.ts";

export async function registerNear(client: x402Client, config: NearConfig): Promise<void> {
  try {
    const { createClientNearSigner } = await import("@x402/near");
    const { ExactNearScheme } = await import("@x402/near/exact/client");
    const network = config.network ?? "near:mainnet";
    const signer = createClientNearSigner({
      accountId: config.accountId,
      secretKey: config.secretKey as `ed25519:${string}` | `secp256k1:${string}`,
      rpcUrls: config.rpcUrl ? { [network]: config.rpcUrl } : undefined,
    });
    client.register(network, new ExactNearScheme(signer));
  } catch (error) {
    if (isUnresolvedImport(error)) {
      throw missingPeerError("NEAR", "@x402/near");
    }
    throw error;
  }
}
