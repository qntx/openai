import * as KeetaNet from "@keetanetwork/keetanet-client";
import { x402Client } from "@x402/fetch";
import { ExactKeetaScheme } from "@x402/keeta/exact/client";
import { describe, expect, it } from "vite-plus/test";
import { looksLikeBip39, registerKeeta } from "../../src/chains/keeta.ts";
import { buildX402Client } from "../../src/payments.ts";

const BIP39_12 =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

function keetaSeed(): string {
  return KeetaNet.lib.Account.generateRandomSeed({ asString: true });
}

describe("looksLikeBip39", () => {
  it("detects 12- and 24-word phrases", () => {
    expect(looksLikeBip39(BIP39_12)).toBe(true);
    expect(looksLikeBip39(`${"abandon ".repeat(23)}about`)).toBe(true);
    expect(looksLikeBip39(keetaSeed())).toBe(false);
    expect(looksLikeBip39("not-a-mnemonic")).toBe(false);
  });
});

describe("registerKeeta", () => {
  it("registers ExactKeetaScheme on keeta:*", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    const { keetaSigner } = await registerKeeta(client, { seed: keetaSeed() });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.network).toBe("keeta:*");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactKeetaScheme);
    await keetaSigner.destroy();
  });

  it("rejects BIP-39 mnemonics", async () => {
    const client = { register() {} } as unknown as x402Client;
    await expect(registerKeeta(client, { seed: BIP39_12 })).rejects.toThrow("BIP-39");
  });

  it("does not rewrite invalid-key errors as a missing-peer hint", async () => {
    const client = { register() {} } as unknown as x402Client;
    await expect(registerKeeta(client, { seed: "%%%not-a-seed%%%" })).rejects.toThrow();
    await expect(registerKeeta(client, { seed: "%%%not-a-seed%%%" })).rejects.not.toThrow(
      /not installed/,
    );
  });
});

describe("buildX402Client keeta", () => {
  it("normalizes a bare string to { seed } and registers ExactKeetaScheme on keeta:*", async () => {
    const seed = keetaSeed();
    const { client, dispose } = await buildX402Client({ keeta: seed });
    expect(registeredScheme(client, "keeta:*", "exact")).toBeInstanceOf(ExactKeetaScheme);
    await dispose();
  });

  it("dispose calls signer.destroy()", async () => {
    const { dispose } = await buildX402Client({ keeta: keetaSeed() });
    await expect(dispose()).resolves.toBeUndefined();
    await expect(dispose()).resolves.toBeUndefined();
  });
});

function registeredScheme(client: x402Client, network: string, scheme: string): unknown {
  const schemes = (
    client as unknown as {
      registeredClientSchemes: Map<number, Map<string, Map<string, unknown>>>;
    }
  ).registeredClientSchemes;
  return schemes.get(2)?.get(network)?.get(scheme);
}
