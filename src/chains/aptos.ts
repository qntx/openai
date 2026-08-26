import type { x402Client } from "@x402/fetch";
import type { AptosConfig } from "./types.ts";
import { isUnresolvedImport, missingPeerError } from "./unresolved-import.ts";

export async function registerAptos(client: x402Client, config: AptosConfig): Promise<void> {
  try {
    const { createClientSigner } = await import("@x402/aptos");
    const { ExactAptosScheme } = await import("@x402/aptos/exact/client");
    const account = await createClientSigner(config.privateKey);
    const opts = config.rpcUrl ? { rpcUrl: config.rpcUrl } : undefined;
    client.register("aptos:*", new ExactAptosScheme(account, opts));
  } catch (error) {
    if (isUnresolvedImport(error)) {
      throw missingPeerError("Aptos", "@x402/aptos");
    }
    throw error;
  }
}
