import { readFileSync } from "node:fs";
import { x402Client } from "@x402/fetch";
import { ExactConcordiumScheme } from "@x402/concordium/exact/client";
import { describe, expect, it } from "vite-plus/test";
import { registerConcordium } from "../../src/chains/concordium.ts";
import { buildX402Client } from "../../src/payments.ts";

/** Throwaway address from @x402/concordium unit tests. */
const CCD_ADDRESS = "3UrcxPQeYywasrPcYUcqhvFu3SB2vBBDjj7TsaRQ431vGiczYp";
const CCD_KEY = "11".repeat(32);

describe("registerConcordium", () => {
  it("registers ExactConcordiumScheme on ccd:*", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerConcordium(client, { address: CCD_ADDRESS, privateKey: CCD_KEY });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.network).toBe("ccd:*");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactConcordiumScheme);
  });

  it("passes useTls through to the scheme", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerConcordium(client, {
      address: CCD_ADDRESS,
      privateKey: CCD_KEY,
      grpcUrl: "localhost:20000",
      useTls: false,
    });
    const scheme = calls[0]?.scheme as { config?: { useTls?: boolean; grpcUrl?: string } };
    expect(scheme.config?.useTls).toBe(false);
    expect(scheme.config?.grpcUrl).toBe("localhost:20000");
  });

  it("does not rewrite invalid-key errors as a missing-peer hint", async () => {
    const client = { register() {} } as unknown as x402Client;
    await expect(
      registerConcordium(client, { address: "not-an-address", privateKey: CCD_KEY }),
    ).rejects.toThrow();
    await expect(
      registerConcordium(client, { address: "not-an-address", privateKey: CCD_KEY }),
    ).rejects.not.toThrow(/not installed/);
  });
});

describe("buildX402Client concordium", () => {
  it("registers ExactConcordiumScheme on ccd:*", async () => {
    const { client } = await buildX402Client({
      concordium: { address: CCD_ADDRESS, privateKey: CCD_KEY },
    });
    expect(registeredScheme(client, "ccd:*", "exact")).toBeInstanceOf(ExactConcordiumScheme);
  });
});

describe("CCD allowedAssets docs", () => {
  it("README documents CCD allowedAssets", () => {
    const readme = readFileSync(new URL("../../README.md", import.meta.url), "utf8");
    expect(readme).toMatch(/network:\s*"ccd:\*"/);
    expect(readme).toMatch(/asset:\s*"CCD"/);
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
