import type { x402Client } from "@x402/fetch";
import type { XrplConfig } from "./types.ts";
import { isUnresolvedImport, missingPeerError } from "./unresolved-import.ts";

export async function registerXrpl(client: x402Client, config: XrplConfig): Promise<void> {
  try {
    const { Wallet } = await import("xrpl");
    const { createXrplWalletSigner } = await import("@x402/xrpl");
    const { ExactXrplScheme } = await import("@x402/xrpl/exact/client");
    const network = config.network ?? "xrpl:0";
    const signer = createXrplWalletSigner(Wallet.fromSeed(config.seed));
    const opts = config.wsUrl ? { wsUrlByNetwork: { [network]: config.wsUrl } } : {};
    client.register(network, new ExactXrplScheme(signer, opts));
  } catch (error) {
    if (isUnresolvedImport(error)) {
      throw missingPeerError("XRPL", "@x402/xrpl", "xrpl");
    }
    throw error;
  }
}
