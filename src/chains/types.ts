export interface EvmConfig {
  privateKey: `0x${string}`;
  /** Enables official gas-sponsoring extensions (EIP-2612 / ERC-20 approval). */
  rpcUrl?: string;
}

export interface SvmConfig {
  privateKey: string;
  /** JSON-RPC endpoint for Solana reads (mint metadata, blockhash). */
  rpcUrl?: string;
}

export interface AptosConfig {
  privateKey: string;
  rpcUrl?: string;
}

export interface AvmConfig {
  privateKey: string;
  algodUrl?: string;
  algodToken?: string;
}

export interface StellarConfig {
  privateKey: string;
  /** Defaults to `stellar:pubnet`; official `createEd25519Signer` defaults to testnet. */
  network?: "stellar:pubnet" | "stellar:testnet";
  /** Soroban RPC endpoint. Required for pubnet payments. */
  rpcUrl?: string;
}

export interface HederaConfig {
  accountId: string;
  privateKey: string;
  /** Defaults to `hedera:mainnet`. */
  network?: "hedera:mainnet" | "hedera:testnet";
  nodeUrl?: string;
}

export interface NearConfig {
  accountId: string;
  secretKey: string;
  /** Defaults to `near:mainnet`. */
  network?: "near:mainnet" | "near:testnet";
  /** Mapped to `{ [network]: rpcUrl }` for the official signer. */
  rpcUrl?: string;
}

export interface XrplConfig {
  seed: string;
  /** Defaults to `xrpl:0`. */
  network?: "xrpl:0" | "xrpl:1";
  /** Mapped to `{ [network]: wsUrl }` for the official client. */
  wsUrl?: string;
}

export interface TvmConfig {
  privateKey: string;
  /** Defaults to `tvm:-239`. */
  network?: "tvm:-239" | "tvm:-3";
  provider?: string;
  apiKey?: string;
  providerBaseUrl?: string;
}

export interface KeetaConfig {
  seed: string;
}

export interface ConcordiumConfig {
  privateKey: string;
  address: string;
  grpcUrl?: string;
  /** Official default is `true` when omitted. */
  useTls?: boolean;
}
