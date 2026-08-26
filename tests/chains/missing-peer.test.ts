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

  it("formats Aptos, AVM, and Stellar install hints", () => {
    expect(missingPeerError("Aptos", "@x402/aptos").message).toBe(
      "Aptos key provided but @x402/aptos is not installed. bun add @x402/aptos",
    );
    expect(missingPeerError("AVM", "@x402/avm").message).toBe(
      "AVM key provided but @x402/avm is not installed. bun add @x402/avm",
    );
    expect(missingPeerError("Stellar", "@x402/stellar").message).toBe(
      "Stellar key provided but @x402/stellar is not installed. bun add @x402/stellar",
    );
  });
});
