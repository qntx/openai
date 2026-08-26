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
