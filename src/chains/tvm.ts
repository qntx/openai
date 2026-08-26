import type { KeyPair } from "@ton/crypto";
import type { x402Client } from "@x402/fetch";
import type { TvmConfig } from "./types.ts";
import { isUnresolvedImport, missingPeerError } from "./unresolved-import.ts";

/**
 * Decode a TVM private key (hex/base64 32-byte seed or 64-byte secret) to a key pair.
 */
export function parseTvmKeyPair(
  privateKey: string,
  keyPairFromSeed: (seed: Buffer) => KeyPair,
): KeyPair {
  const value = privateKey.trim().replace(/^0x/, "");
  let bytes: Buffer;
  if (/^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0) {
    bytes = Buffer.from(value, "hex");
  } else {
    bytes = Buffer.from(value, "base64");
  }
  if (bytes.length !== 32 && bytes.length !== 64) {
    throw new Error("TVM private key must be a 32-byte seed or 64-byte secret key");
  }
  return keyPairFromSeed(bytes.subarray(0, 32));
}

export async function registerTvm(
  client: x402Client,
  config: TvmConfig,
): Promise<{ tvmScheme: { close(): void } }> {
  try {
    const { keyPairFromSeed } = await import("@ton/crypto");
    const { toClientTvmSigner } = await import("@x402/tvm");
    const { ExactTvmScheme } = await import("@x402/tvm/exact/client");
    const network = config.network ?? "tvm:-239";
    const signer = toClientTvmSigner(parseTvmKeyPair(config.privateKey, keyPairFromSeed), {
      network,
      provider: config.provider,
      apiKey: config.apiKey,
      providerBaseUrl: config.providerBaseUrl,
    });
    // signer.network must equal requirements.network — a wildcard would accept the other net and then throw.
    const scheme = new ExactTvmScheme(signer);
    client.register(network, scheme);
    return { tvmScheme: scheme };
  } catch (error) {
    if (isUnresolvedImport(error)) {
      throw missingPeerError("TVM", "@x402/tvm", "@ton/crypto");
    }
    throw error;
  }
}
