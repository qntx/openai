import type { PaymentRequirements } from "@x402/fetch";
import { describe, expect, it } from "vite-plus/test";
import { preferNetwork, preferScheme } from "../src/policies.ts";

const reqs = [
  { network: "eip155:8453", scheme: "exact", amount: "100" },
  { network: "solana:mainnet", scheme: "exact", amount: "100" },
] as unknown as PaymentRequirements[];

describe("policies", () => {
  it("preferNetwork filters matching requirements", () => {
    const result = preferNetwork("eip155:8453")(2, reqs);
    expect(result).toHaveLength(1);
    expect(result[0]?.network).toBe("eip155:8453");
  });

  it("preferNetwork with wildcard matches prefix", () => {
    const all = [
      { network: "eip155:8453", scheme: "exact", amount: "100" },
      { network: "eip155:1", scheme: "exact", amount: "100" },
      { network: "solana:mainnet", scheme: "exact", amount: "100" },
    ] as unknown as PaymentRequirements[];
    const result = preferNetwork("eip155:*")(2, all);
    expect(result).toHaveLength(2);
  });

  it("preferNetwork falls back to all when none match", () => {
    const onlySvm = [
      { network: "solana:mainnet", scheme: "exact", amount: "100" },
    ] as unknown as PaymentRequirements[];
    const result = preferNetwork("eip155:8453")(2, onlySvm);
    expect(result).toHaveLength(1);
  });

  it("preferScheme filters matching requirements", () => {
    const mixed = [
      { network: "eip155:8453", scheme: "exact", amount: "100" },
      { network: "eip155:8453", scheme: "streaming", amount: "100" },
    ] as unknown as PaymentRequirements[];
    const result = preferScheme("exact")(2, mixed);
    expect(result).toHaveLength(1);
    expect(result[0]?.scheme).toBe("exact");
  });

  it("preferScheme prefers upto when mixed with exact", () => {
    const mixed = [
      { network: "eip155:8453", scheme: "exact", amount: "100" },
      { network: "eip155:8453", scheme: "upto", amount: "100" },
    ] as unknown as PaymentRequirements[];
    const result = preferScheme("upto")(2, mixed);
    expect(result).toHaveLength(1);
    expect(result[0]?.scheme).toBe("upto");
  });

  it("preferScheme falls back to all when none match", () => {
    const result = preferScheme("upto")(2, reqs);
    expect(result).toHaveLength(2);
  });
});
