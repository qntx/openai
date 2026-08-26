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
