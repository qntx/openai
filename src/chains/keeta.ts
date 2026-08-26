import type { x402Client } from "@x402/fetch";
import type { KeetaConfig } from "./types.ts";
import { isUnresolvedImport, missingPeerError } from "./unresolved-import.ts";

/** True when `seed` is a 12- or 24-word phrase, which this package never converts. */
export function looksLikeBip39(seed: string): boolean {
  const words = seed.trim().split(/\s+/).filter(Boolean);
  return words.length === 12 || words.length === 24;
}

export async function registerKeeta(
  client: x402Client,
  config: KeetaConfig,
): Promise<{ keetaSigner: { destroy(): Promise<void> } }> {
  if (looksLikeBip39(config.seed)) {
    throw new Error("Keeta seed must be Account.fromSeed material, not a BIP-39 mnemonic");
  }
  try {
    const KeetaNet = await import("@keetanetwork/keetanet-client");
    const { toClientKeetaSigner } = await import("@x402/keeta");
    const { ExactKeetaScheme } = await import("@x402/keeta/exact/client");
    const account = KeetaNet.lib.Account.fromSeed(config.seed, 0);
    const signer = toClientKeetaSigner(account);
    client.register("keeta:*", new ExactKeetaScheme(signer));
    return { keetaSigner: signer };
  } catch (error) {
    if (isUnresolvedImport(error)) {
      throw missingPeerError("Keeta", "@x402/keeta", "@keetanetwork/keetanet-client");
    }
    throw error;
  }
}
