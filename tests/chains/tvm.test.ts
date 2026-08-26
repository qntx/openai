import { x402Client } from "@x402/fetch";
import { ExactTvmScheme } from "@x402/tvm/exact/client";
import { keyPairFromSeed } from "@ton/crypto";
import { describe, expect, it } from "vite-plus/test";
import { parseTvmKeyPair, registerTvm } from "../../src/chains/tvm.ts";
import { X402OpenAI } from "../../src/client.ts";
import { buildX402Client } from "../../src/payments.ts";

/** 32-byte hex seed. */
const TVM_KEY = "11".repeat(32);

describe("parseTvmKeyPair", () => {
  it("accepts hex and 0x-prefixed 32-byte seeds", () => {
    const fromHex = parseTvmKeyPair(TVM_KEY, keyPairFromSeed);
    const fromPrefixed = parseTvmKeyPair(`0x${TVM_KEY}`, keyPairFromSeed);
    expect(fromHex.publicKey.equals(fromPrefixed.publicKey)).toBe(true);
  });

  it("accepts base64 32-byte seeds and 64-byte secrets", () => {
    const seed = Buffer.from(TVM_KEY, "hex");
    const fromBase64 = parseTvmKeyPair(seed.toString("base64"), keyPairFromSeed);
    const secret = Buffer.concat([seed, Buffer.alloc(32)]);
    const fromSecret = parseTvmKeyPair(secret.toString("hex"), keyPairFromSeed);
    expect(fromBase64.publicKey.equals(fromSecret.publicKey)).toBe(true);
  });

  it("rejects keys that are not 32 or 64 bytes", () => {
    expect(() => parseTvmKeyPair("00", keyPairFromSeed)).toThrow(/32-byte seed or 64-byte secret/);
    expect(() => parseTvmKeyPair("aa".repeat(16), keyPairFromSeed)).toThrow(
      /32-byte seed or 64-byte secret/,
    );
  });
});

describe("registerTvm", () => {
  it("registers ExactTvmScheme on tvm:-239 by default, not tvm:*", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    const { tvmScheme } = await registerTvm(client, { privateKey: TVM_KEY });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.network).toBe("tvm:-239");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactTvmScheme);
    expect(calls.find((call) => call.network === "tvm:*")).toBeUndefined();
    expect(typeof tvmScheme.close).toBe("function");
    tvmScheme.close();
  });

  it("registers the configured CAIP-2, not tvm:*", async () => {
    const calls: { network: string; scheme: unknown }[] = [];
    const client = {
      register(network: string, scheme: unknown) {
        calls.push({ network, scheme });
      },
    } as unknown as x402Client;

    const { tvmScheme } = await registerTvm(client, {
      privateKey: TVM_KEY,
      network: "tvm:-3",
      provider: "toncenter",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.network).toBe("tvm:-3");
    expect(calls[0]?.scheme).toBeInstanceOf(ExactTvmScheme);
    tvmScheme.close();
  });

  it("does not rewrite invalid-key errors as a missing-peer hint", async () => {
    const client = { register() {} } as unknown as x402Client;
    await expect(registerTvm(client, { privateKey: "00" })).rejects.toThrow();
    await expect(registerTvm(client, { privateKey: "00" })).rejects.not.toThrow(/not installed/);
  });
});

describe("buildX402Client tvm", () => {
  it("normalizes a bare string to ExactTvmScheme on tvm:-239, not tvm:*", async () => {
    const { client, dispose } = await buildX402Client({ tvm: TVM_KEY });
    expect(registeredScheme(client, "tvm:-239", "exact")).toBeInstanceOf(ExactTvmScheme);
    expect(registeredScheme(client, "tvm:*", "exact")).toBeUndefined();
    await dispose();
  });

  it("dispose calls scheme.close()", async () => {
    const { client, dispose } = await buildX402Client({ tvm: TVM_KEY });
    const scheme = registeredScheme(client, "tvm:-239", "exact") as { close: () => void };
    let calls = 0;
    const original = scheme.close.bind(scheme);
    scheme.close = () => {
      calls += 1;
      original();
    };
    await dispose();
    expect(calls).toBe(1);
  });
});

describe("X402OpenAI tvm close", () => {
  it("concurrent first request and close: closed wins and dispose runs", async () => {
    const closeDesc = Object.getOwnPropertyDescriptor(ExactTvmScheme.prototype, "close");
    const originalClose = closeDesc?.value as (this: ExactTvmScheme) => void;
    let closeCalls = 0;
    ExactTvmScheme.prototype.close = function close(this: ExactTvmScheme) {
      closeCalls += 1;
      originalClose.call(this);
    };
    const client = new X402OpenAI({ tvm: TVM_KEY, baseURL: "http://127.0.0.1:9/v1" });
    try {
      const pending = invokeClientFetch(client);
      await client.close();
      await expect(pending).rejects.toThrow("X402OpenAI is closed");
      expect(closeCalls).toBe(1);
      await expect(invokeClientFetch(client)).rejects.toThrow("X402OpenAI is closed");
    } finally {
      ExactTvmScheme.prototype.close = originalClose;
    }
  });
});

function invokeClientFetch(client: X402OpenAI): Promise<Response> {
  const fetchFn = (client as unknown as { fetch: typeof fetch }).fetch;
  return fetchFn("http://127.0.0.1:9/v1/models");
}

function registeredScheme(client: x402Client, network: string, scheme: string): unknown {
  const schemes = (
    client as unknown as {
      registeredClientSchemes: Map<number, Map<string, Map<string, unknown>>>;
    }
  ).registeredClientSchemes;
  return schemes.get(2)?.get(network)?.get(scheme);
}
