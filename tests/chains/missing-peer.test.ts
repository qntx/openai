import { describe, expect, it } from "vite-plus/test";
import { isUnresolvedImport, missingPeerError } from "../../src/chains/unresolved-import.ts";

describe("missing peer import rewrite", () => {
  it("detects ERR_MODULE_NOT_FOUND and Cannot find package", () => {
    expect(
      isUnresolvedImport(
        Object.assign(new Error("Cannot find package '@x402/aptos'"), {
          code: "ERR_MODULE_NOT_FOUND",
        }),
      ),
    ).toBe(true);
    expect(isUnresolvedImport(new Error("Cannot find module '@x402/avm'"))).toBe(true);
    expect(isUnresolvedImport(new Error("invalid private key"))).toBe(false);
    expect(isUnresolvedImport("not-an-error")).toBe(false);
  });

  it("formats Aptos, AVM, Stellar, Hedera, NEAR, and XRPL install hints", () => {
    expect(missingPeerError("Aptos", "@x402/aptos").message).toBe(
      "Aptos key provided but @x402/aptos is not installed. bun add @x402/aptos",
    );
    expect(missingPeerError("AVM", "@x402/avm").message).toBe(
      "AVM key provided but @x402/avm is not installed. bun add @x402/avm",
    );
    expect(missingPeerError("Stellar", "@x402/stellar").message).toBe(
      "Stellar key provided but @x402/stellar is not installed. bun add @x402/stellar",
    );
    expect(missingPeerError("Hedera", "@x402/hedera").message).toBe(
      "Hedera key provided but @x402/hedera is not installed. bun add @x402/hedera",
    );
    expect(missingPeerError("NEAR", "@x402/near").message).toBe(
      "NEAR key provided but @x402/near is not installed. bun add @x402/near",
    );
    expect(missingPeerError("XRPL", "@x402/xrpl", "xrpl").message).toBe(
      "XRPL key provided but @x402/xrpl is not installed. bun add @x402/xrpl xrpl",
    );
  });
});
