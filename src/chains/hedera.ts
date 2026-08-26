import type { x402Client } from "@x402/fetch";
import type { HederaConfig } from "./types.ts";
import { isUnresolvedImport, missingPeerError } from "./unresolved-import.ts";

export async function registerHedera(client: x402Client, config: HederaConfig): Promise<void> {
  try {
    const { createClientHederaSigner, PrivateKey } = await import("@x402/hedera");
    const { ExactHederaScheme } = await import("@x402/hedera/exact/client");
    const network = config.network ?? "hedera:mainnet";
    const signer = createClientHederaSigner(
      config.accountId,
      PrivateKey.fromStringECDSA(config.privateKey),
      { network, nodeUrl: config.nodeUrl },
    );
    // freezeWith uses configuredNetwork, not requirements.network — register that CAIP-2 only.
    client.register(network, new ExactHederaScheme(signer));
  } catch (error) {
    if (isUnresolvedImport(error)) {
      throw missingPeerError("Hedera", "@x402/hedera");
    }
    throw error;
  }
}
