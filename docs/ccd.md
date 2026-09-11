# Concordium

Concordium (`ccd:*`) registers **exact** only. Config is `{ privateKey, address, grpcUrl?, useTls? }`. No string overload (`address` is required). Official `useTls` default is `true`. The 402 **must** set `extra.feePayer`. Default asset is USDR; native CCD is not allowed unless you opt in:

```ts
new X402OpenAI({
  concordium: { privateKey, address },
  spendControls: {
    allowedAssets: [{ network: "ccd:*", asset: "CCD" }],
  },
});
```
