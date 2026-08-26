import { ExactEvmScheme } from "@x402/evm/exact/client";
import { UptoEvmScheme } from "@x402/evm/upto/client";
import { x402Client, type PaymentRequired, type SchemeNetworkClient } from "@x402/fetch";
import { ExactSvmScheme } from "@x402/svm/exact/client";
import { UptoSvmScheme } from "@x402/svm/upto/client";
import { describe, expect, it } from "vite-plus/test";
import { registerEvm } from "../src/chains/evm.ts";
import { registerSvm } from "../src/chains/svm.ts";
import { buildX402Client } from "../src/payments.ts";

const EVM_KEY = "0xac0974dac38f24671676c33098b7abf185c4d7b8d04844c06a56a24126c6dcbd" as const;
/** 64-byte Ed25519 secret (seed + pubkey), base58. Seed is 31 zero bytes + 0x01. */
const SVM_KEY = "1111111111111111111111111111111PPm2a2NNZH2EFJ5UkEjkH9Fcxn8cvjTmZDKQQisyLDmA";

/** Base mainnet USDC — 6 decimals; official default cap is `$1` = `1000000`. */
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

describe("buildX402Client", () => {
  it("throws when no credentials provided", async () => {
    await expect(buildX402Client({})).rejects.toThrow("at least one");
  });

  it("throws on empty evm string", async () => {
    await expect(buildX402Client({ evm: "" as `0x${string}` })).rejects.toThrow("non-empty");
  });

  it("throws on empty svm string", async () => {
    await expect(buildX402Client({ svm: "" })).rejects.toThrow("non-empty");
  });

  it("throws on empty aptos, avm, stellar, and xrpl strings", async () => {
    await expect(buildX402Client({ aptos: "" })).rejects.toThrow("non-empty");
    await expect(buildX402Client({ avm: "" })).rejects.toThrow("non-empty");
    await expect(buildX402Client({ stellar: "" })).rejects.toThrow("non-empty");
    await expect(buildX402Client({ xrpl: "" })).rejects.toThrow("non-empty");
  });

  it("throws on empty hedera and near fields", async () => {
    await expect(buildX402Client({ hedera: { accountId: "", privateKey: "0x1" } })).rejects.toThrow(
      "non-empty",
    );
    await expect(
      buildX402Client({ hedera: { accountId: "0.0.1", privateKey: "" } }),
    ).rejects.toThrow("non-empty");
    await expect(
      buildX402Client({ near: { accountId: "", secretKey: "ed25519:x" } }),
    ).rejects.toThrow("non-empty");
    await expect(
      buildX402Client({ near: { accountId: "alice.near", secretKey: "" } }),
    ).rejects.toThrow("non-empty");
  });

  it("throws on empty evm privateKey object", async () => {
    await expect(buildX402Client({ evm: { privateKey: "" as `0x${string}` } })).rejects.toThrow(
      "non-empty",
    );
  });

  it("throws when x402Client is combined with keys", async () => {
    const prebuilt = new x402Client();
    await expect(buildX402Client({ x402Client: prebuilt, evm: EVM_KEY })).rejects.toThrow(
      "Cannot combine",
    );
    await expect(buildX402Client({ x402Client: prebuilt, aptos: "0x1" })).rejects.toThrow(
      "Cannot combine",
    );
    await expect(buildX402Client({ x402Client: prebuilt, avm: "key" })).rejects.toThrow(
      "Cannot combine",
    );
    await expect(buildX402Client({ x402Client: prebuilt, stellar: "S…" })).rejects.toThrow(
      "Cannot combine",
    );
    await expect(
      buildX402Client({
        x402Client: prebuilt,
        hedera: { accountId: "0.0.1", privateKey: "0x1" },
      }),
    ).rejects.toThrow("Cannot combine");
    await expect(
      buildX402Client({
        x402Client: prebuilt,
        near: { accountId: "alice.near", secretKey: "ed25519:x" },
      }),
    ).rejects.toThrow("Cannot combine");
    await expect(buildX402Client({ x402Client: prebuilt, xrpl: "sEd…" })).rejects.toThrow(
      "Cannot combine",
    );
  });

  it("throws when x402Client is combined with policies", async () => {
    const prebuilt = new x402Client();
    await expect(
      buildX402Client({ x402Client: prebuilt, policies: [(_v, reqs) => reqs] }),
    ).rejects.toThrow("Cannot combine");
  });

  it("throws when x402Client is combined with spendControls", async () => {
    const prebuilt = new x402Client();
    await expect(
      buildX402Client({ x402Client: prebuilt, spendControls: { maxAmountPerPayment: "$5" } }),
    ).rejects.toThrow("Cannot combine");
  });

  it("throws when x402Client is combined with spendControls: false", async () => {
    const prebuilt = new x402Client();
    await expect(buildX402Client({ x402Client: prebuilt, spendControls: false })).rejects.toThrow(
      "Cannot combine",
    );
  });

  it("throws when x402Client is combined with paymentRequirementsSelector", async () => {
    const prebuilt = new x402Client();
    await expect(
      buildX402Client({
        x402Client: prebuilt,
        paymentRequirementsSelector: (_v, reqs) => reqs[0]!,
      }),
    ).rejects.toThrow("Cannot combine");
  });

  it("returns a pre-built client as-is", async () => {
    const prebuilt = new x402Client();
    const result = await buildX402Client({ x402Client: prebuilt });
    expect(result).toBe(prebuilt);
  });

  it("registers ExactEvmScheme and UptoEvmScheme on eip155:* for a single evm key", async () => {
    const client = await buildX402Client({ evm: EVM_KEY });
    expect(client).toBeInstanceOf(x402Client);
    expect(registeredScheme(client, "eip155:*", "exact")).toBeInstanceOf(ExactEvmScheme);
    expect(registeredScheme(client, "eip155:*", "upto")).toBeInstanceOf(UptoEvmScheme);
  });

  it("normalizes an evm config object", async () => {
    const client = await buildX402Client({ evm: { privateKey: EVM_KEY } });
    expect(registeredScheme(client, "eip155:*", "exact")).toBeInstanceOf(ExactEvmScheme);
    expect(registeredScheme(client, "eip155:*", "upto")).toBeInstanceOf(UptoEvmScheme);
  });

  it("registers ExactSvmScheme and UptoSvmScheme on solana:* for a single svm key", async () => {
    const client = await buildX402Client({ svm: SVM_KEY });
    expect(client).toBeInstanceOf(x402Client);
    expect(registeredScheme(client, "solana:*", "exact")).toBeInstanceOf(ExactSvmScheme);
    expect(registeredScheme(client, "solana:*", "upto")).toBeInstanceOf(UptoSvmScheme);
  });

  it("normalizes an svm config object", async () => {
    const client = await buildX402Client({ svm: { privateKey: SVM_KEY } });
    expect(registeredScheme(client, "solana:*", "exact")).toBeInstanceOf(ExactSvmScheme);
    expect(registeredScheme(client, "solana:*", "upto")).toBeInstanceOf(UptoSvmScheme);
  });
});

describe("registerEvm", () => {
  it("registers exact and upto on eip155:*", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerEvm(client, { privateKey: EVM_KEY });
    expect(calls).toHaveLength(2);
    expect(calls[0]?.network).toBe("eip155:*");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactEvmScheme);
    expect(calls[1]?.network).toBe("eip155:*");
    expect(calls[1]?.scheme).toBeInstanceOf(UptoEvmScheme);
  });
});

describe("registerSvm", () => {
  it("registers exact and upto on solana:*", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    await registerSvm(client, { privateKey: SVM_KEY });
    expect(calls).toHaveLength(2);
    expect(calls[0]?.network).toBe("solana:*");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactSvmScheme);
    expect(calls[1]?.network).toBe("solana:*");
    expect(calls[1]?.scheme).toBeInstanceOf(UptoSvmScheme);
  });
});

describe("spendControls", () => {
  it("rejects $2 USDC-6 against the omitted official $1 default", async () => {
    const client = await buildX402Client({ evm: EVM_KEY });
    client.register("eip155:8453", stubUsdcScheme("exact"));
    await expect(client.createPaymentPayload(usdcRequired("2000000"))).rejects.toThrow(
      /maxAmountPerPayment/,
    );
  });

  it("rejects $2 USDC-6 against an explicit $1 cap", async () => {
    const client = await buildX402Client({
      evm: EVM_KEY,
      spendControls: { maxAmountPerPayment: "$1" },
    });
    client.register("eip155:8453", stubUsdcScheme("exact"));
    await expect(client.createPaymentPayload(usdcRequired("2000000"))).rejects.toThrow(
      /maxAmountPerPayment/,
    );
  });

  it("allows $2 USDC-6 when maxAmountPerPayment is $5", async () => {
    const client = await buildX402Client({
      evm: EVM_KEY,
      spendControls: { maxAmountPerPayment: "$5" },
    });
    client.register("eip155:8453", stubUsdcScheme("exact"));
    const payload = await client.createPaymentPayload(usdcRequired("2000000"));
    expect(payload.payload).toEqual({ stub: "exact" });
  });

  it("allows $2 USDC-6 when spendControls is false", async () => {
    const client = await buildX402Client({ evm: EVM_KEY, spendControls: false });
    client.register("eip155:8453", stubUsdcScheme("exact"));
    const payload = await client.createPaymentPayload(usdcRequired("2000000"));
    expect(payload.payload).toEqual({ stub: "exact" });
  });

  it("forwards paymentRequirementsSelector after spend controls", async () => {
    const client = await buildX402Client({
      evm: EVM_KEY,
      spendControls: false,
      paymentRequirementsSelector: (_version, reqs) => reqs[1]!,
    });
    client.register("eip155:8453", stubUsdcScheme("exact"));
    const payload = await client.createPaymentPayload({
      x402Version: 2,
      resource: { url: "https://example.com/resource" },
      accepts: [usdcAccept("100000", "exact"), usdcAccept("200000", "exact")],
    });
    expect(payload.accepted.amount).toBe("200000");
  });
});

function stubUsdcScheme(scheme: string): SchemeNetworkClient {
  return {
    scheme,
    findDefaultAsset(asset: string) {
      return asset.toLowerCase() === BASE_USDC.toLowerCase()
        ? { asset: BASE_USDC, decimals: 6, symbol: "USDC" }
        : undefined;
    },
    async createPaymentPayload() {
      return { x402Version: 2, payload: { stub: scheme } };
    },
  };
}

function usdcAccept(amount: string, scheme: string) {
  return {
    scheme,
    network: "eip155:8453" as const,
    asset: BASE_USDC,
    amount,
    payTo: "0x0000000000000000000000000000000000000001",
    maxTimeoutSeconds: 300,
    extra: {},
  };
}

function usdcRequired(amount: string, scheme = "exact"): PaymentRequired {
  return {
    x402Version: 2,
    resource: { url: "https://example.com/resource" },
    accepts: [usdcAccept(amount, scheme)],
  };
}

function registeredScheme(client: x402Client, network: string, scheme: string): unknown {
  const schemes = (
    client as unknown as {
      registeredClientSchemes: Map<number, Map<string, Map<string, unknown>>>;
    }
  ).registeredClientSchemes;
  return schemes.get(2)?.get(network)?.get(scheme);
}
