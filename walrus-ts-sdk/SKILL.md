---
name: walrus-ts-sdk
description: >
  Walrus TypeScript SDK (@mysten/walrus) for storing and reading blobs programmatically.
  Use when writing TypeScript/JavaScript code that interacts with Walrus for blob storage,
  reading, or lifecycle management. Also use when configuring network settings (Testnet/Mainnet
  package and object IDs), wiring Walrus to a Sui wallet, or integrating Walrus into a web app.
  For CLI usage, see the `walrus-cli` skill. For HTTP API, see the `walrus-http-api` skill.
---

# Walrus TypeScript SDK

> **Source constraint:** All information in this skill is sourced from the
> [Walrus TypeScript SDK documentation](https://sdk.mystenlabs.com/walrus),
> the [official examples](https://github.com/MystenLabs/ts-sdks/tree/main/packages/walrus/examples),
> and the [Walrus docs](https://docs.wal.app/docs/typescript-sdk/sdks).
> When extending this skill, only pull from these sources.

The `@mysten/walrus` package is the official TypeScript SDK for Walrus, maintained by Mysten Labs. It supports storing blobs, reading blobs, checking blob status, and managing blob lifecycle from TypeScript/JavaScript. The SDK handles encoding, sliver distribution, and Sui transaction construction internally.

For data security (encryption before upload), use `@mysten/seal` alongside this SDK. All blobs stored on Walrus are public by default. See the `walrus-data-security` skill.

All patterns in this skill are derived from:
- https://sdk.mystenlabs.com/walrus
- https://github.com/MystenLabs/ts-sdks/tree/main/packages/walrus/examples

If unsure about any SDK API, fetch the relevant page before answering.

---

## Related skills

| Topic | Skill | Load when |
|-------|-------|-----------|
| CLI operations | `walrus-cli` | Using the `walrus` binary instead of the SDK |
| HTTP API | `walrus-http-api` | Using REST endpoints from any language |
| Encryption | `walrus-data-security` | Encrypting blobs with Seal before upload |
| Blob management | `walrus-blob-lifecycle` | Extending, deleting, or sharing blobs |
| Quilts | `walrus-quilts` | Batching many small blobs into one unit |
| Move integration | `walrus-move-integration` | Wrapping Walrus blobs in Move contracts |

---

## Skill Content

### Key concepts

- **WalrusClient.** The main entry point. Create one with network configuration and an optional Sui wallet. The SDK bundles the correct Walrus system object IDs for each network (Testnet, Mainnet) so you do not need to look them up manually.

- **Network configuration.** Pass `network: 'testnet'` or `network: 'mainnet'` when creating the client. The SDK resolves package IDs, system object IDs, and default aggregator/publisher URLs automatically. Do not hardcode system object IDs.

- **Wallet integration.** Write operations (store, extend, delete) require a Sui keypair or wallet for signing transactions. Read operations do not require a wallet. Use `Ed25519Keypair` for server-side or a wallet adapter for browser apps.

- **Aggregator and publisher.** The SDK can interact with Walrus storage nodes directly (full encoding and sliver upload) or through publisher/aggregator HTTP endpoints. For browser environments with limited bandwidth, use an upload relay.

- **Store response types.** When storing a blob, the SDK returns either `newlyCreated` (blob stored for the first time, includes the Sui object details and cost) or `alreadyCertified` (identical content already exists with sufficient lifetime).

- **Community SDKs.** For non-TypeScript languages, community SDKs exist for [Go](https://github.com/namihq/walrus-go), [PHP](https://github.com/suicore/walrus-sdk-php), and [Python](https://github.com/standard-crypto/walrus-python). These interact with the HTTP API rather than storage nodes directly.

### Installation and setup

```bash
npm install @mysten/walrus @mysten/sui
```

### Client initialization

The SDK uses the `$extend` pattern to add Walrus capabilities to a Sui client:

```typescript
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { walrus } from '@mysten/walrus';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// Read-only client (no wallet needed)
const client = new SuiClient({ url: getFullnodeUrl('testnet') })
  .$extend(walrus({ network: 'testnet' }));

// Read a blob
const blob = await client.walrus.readBlob({ blobId: '<BLOB_ID>' });

// Client with wallet for write operations
const keypair = Ed25519Keypair.fromSecretKey('<SECRET_KEY>');
const writeClient = new SuiClient({ url: getFullnodeUrl('testnet') })
  .$extend(walrus({
    network: 'testnet',
    wallet: keypair,
  }));

// Store a blob
const result = await writeClient.walrus.storeBlob({
  blob: new Uint8Array([...]),  // or a File, Blob, string
  epochs: 5,
  deletable: true,
});
```

### Upload relay for browser apps

Browser environments cannot distribute slivers directly to storage nodes. Use an upload relay:

```typescript
const client = new SuiClient({ url: getFullnodeUrl('mainnet') })
  .$extend(walrus({
    network: 'mainnet',
    wallet: keypair,
    uploadRelay: {
      host: 'https://upload-relay.mainnet.walrus.space',
      sendTip: { max: 1_000_000 },  // max tip in MIST to pay the relay
    },
  }));
```

Upload relay URLs:
- **Mainnet:** `https://upload-relay.mainnet.walrus.space`
- **Testnet:** `https://upload-relay.testnet.walrus.space`

The `sendTip.max` field caps the tip your client pays the relay operator. If the relay's required tip exceeds your max, the upload fails with `Tip amount exceeds the maximum allowed tip`. Increase `max` or find a cheaper relay.

### Vite / bundler configuration

The SDK uses gRPC and WASM internally. For Vite-based projects, exclude the package from dependency optimization:

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['@mysten/walrus'],
  },
});
```

Without this, Vite's pre-bundling can break gRPC/WASM imports.

### Querying network info

```typescript
// Get current epoch, storage cost, and system info
const info = await fetch('https://aggregator.walrus-mainnet.walrus.space/v1/info');
const { epoch, storageCostPerUnit } = await info.json();

// Estimate storage cost programmatically
const cost = await client.walrus.storageCost(fileSize, epochs);
```

### Blob ID formats

Walrus blob IDs are URL-safe base64 strings (for example, `M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk`). The same content always produces the same blob ID (content-addressed). Do not confuse with the Sui object ID of the `Blob` object (a `0x...` hex string), which is different for each upload even with identical content.

### Rules

1. **Always specify epochs when storing.** Blobs default to 1 epoch if you omit the duration. Always set an explicit `epochs` value appropriate for your use case.
2. **Encrypt before uploading sensitive data.** All Walrus blobs are public and discoverable. Use `@mysten/seal` for threshold encryption with onchain access control, or any encryption library of your choice.
3. **Do not hardcode system object IDs.** The SDK bundles the correct IDs per network. Use the `network` parameter instead.
4. **Handle `alreadyCertified` responses.** When identical content already exists with sufficient lifetime, the SDK returns `alreadyCertified` instead of re-uploading. This is expected behavior, not an error.
5. **Retry reads after immediate upload.** CDN-fronted aggregators might briefly cache a 404 for a blob that was just certified. Retry with backoff if reading immediately after storing.
6. **No public Mainnet publisher.** On Mainnet, run your own authenticated publisher or use the TypeScript SDK directly. The public publisher endpoints are for Testnet only, where WAL has no monetary value.

### Common mistakes

- **Not providing a wallet for write operations.** Store, extend, and delete operations require a Sui keypair or wallet adapter to sign transactions. Read operations do not.
- **Using the SDK in a browser without an upload relay.** Browser environments cannot distribute slivers to storage nodes. You must configure an `uploadRelay` with a `host` URL and `sendTip.max` value. Without it, store operations fail silently or throw `RetryableWalrusClientError: Too many failures while writing blob`.
- **Confusing blob ID with Sui object ID.** A blob ID is a URL-safe base64 string identifying content. A Sui object ID is a `0x...` hex string identifying the on-chain `Blob` object. Use blob ID for reading content, object ID for on-chain operations (extend, delete, share).
- **Ignoring deletable vs permanent.** Newly stored blobs are deletable by default. If you need guaranteed availability for the full storage period, explicitly set `permanent: true`. Deletable blobs can be removed by the object owner at any time.
- **Hardcoding aggregator/publisher URLs.** The SDK provides default endpoints per network. Only override them if you run your own infrastructure.
- **Passing raw JSON strings instead of `Uint8Array` or `File`.** The `storeBlob` method expects binary data. Convert strings with `new TextEncoder().encode(jsonString)`. Passing a raw string or object can cause `file.bytes is not a function` errors.
- **`Tip amount exceeds the maximum allowed tip` error.** The upload relay requires a tip. Set `sendTip: { max: N }` high enough in the `uploadRelay` config. Check the relay's required tip at `<relay-url>/v1/tip-config`.
- **`ChainNotSupportedError: "sui:undefined"` in dApp Kit.** This occurs when the wallet adapter is not properly configured with the correct Sui network. Ensure the dApp Kit provider specifies the chain (`sui:testnet` or `sui:mainnet`).
- **Missing Vite `optimizeDeps.exclude` for `@mysten/walrus`.** The SDK's gRPC/WASM internals break under Vite's default pre-bundling. Add `exclude: ['@mysten/walrus']` to your Vite config.
