import type { x402Client } from "@x402/fetch";
import type { ConcordiumConfig } from "./types.ts";
import { isUnresolvedImport, missingPeerError } from "./unresolved-import.ts";

export async function registerConcordium(
  client: x402Client,
  config: ConcordiumConfig,
): Promise<void> {
  try {
    const { AccountAddress, buildBasicAccountSigner } = await import("@concordium/web-sdk");
    const { ExactConcordiumScheme } = await import("@x402/concordium/exact/client");
    const signer = {
      accountAddress: AccountAddress.fromBase58(config.address),
      signer: buildBasicAccountSigner(config.privateKey),
    };
    const schemeOpts = {
      grpcUrl: config.grpcUrl,
      useTls: config.useTls,
    };
    client.register("ccd:*", new ExactConcordiumScheme(signer, schemeOpts));
  } catch (error) {
    if (isUnresolvedImport(error)) {
      throw missingPeerError("Concordium", "@x402/concordium", "@concordium/web-sdk");
    }
    throw error;
  }
}
