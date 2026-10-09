---
name: walrus-ts-sdk
description: >
  Walrus TypeScript SDK (@mysten/walrus) for storing and reading blobs programmatically.
  Use when writing TypeScript/JavaScript code that interacts with Walrus for blob storage,
  reading, or lifecycle management: the WalrusFile API (getFiles, writeFiles), the raw
  readBlob/writeBlob API, the writeFilesFlow/writeBlobFlow step-by-step flows for browser
  wallets and crash-recoverable uploads, upload relays and tips, WASM loading in Vite or
  Next.js, and verifying a blob before depending on it. For CLI usage, see the `walrus-cli`
  skill. For HTTP API, see the `walrus-http-api` skill.
---

# Walrus TypeScript SDK

> **Source constraint:** All information in this skill is sourced from the
> [Walrus TypeScript SDK documentation](https://sdk.mystenlabs.com/walrus),
> the [official examples](https://github.com/MystenLabs/ts-sdks/tree/main/packages/walrus/examples),
> and the [Walrus docs](https://docs.wal.app/docs/typescript-sdk/sdks).
> When extending this skill, only pull from these sources.

The `@mysten/walrus` package is the official TypeScript SDK for Walrus, maintained by Mysten Labs. It works directly with Walrus storage nodes or through an upload relay. Without a relay, writing a blob takes approximately 2,200 requests and reading one approximately 335, so for many applications the SDK docs recommend publishers and aggregators instead; the SDK is for applications that need to interact with Walrus directly, or where users pay for their own storage.

All blobs stored on Walrus are public. Encrypt on the client before storing anything confidential (see `walrus-data-security`).

All patterns in this skill are derived from:
- https://sdk.mystenlabs.com/walrus
- https://github.com/MystenLabs/ts-sdks/tree/main/packages/walrus/examples
- https://docs.wal.app/docs/walrus-client/verifying-availability

If unsure about any SDK API, fetch the relevant page before answering. The complete method list is in the [WalrusClient TypeDocs](https://sdk.mystenlabs.com/typedoc/classes/_mysten_walrus.WalrusClient.html).

---

## Related skills

| Topic | Skill | Load when |
|-------|-------|-----------|
| CLI operations | `walrus-cli` | Using the `walrus` binary instead of the SDK |
| HTTP API | `walrus-http-api` | Using REST endpoints from any language |
| Confidentiality | `walrus-data-security` | Encrypting blobs before upload |
| Blob management | `walrus-blob-lifecycle` | Extending, deleting, or sharing blobs; verifying availability |
| Quilts | `walrus-quilts` | Batching many small blobs into one unit |
| Move integration | `walrus-move-integration` | Wrapping Walrus blobs in Move contracts |

---

## Skill Content

### Key concepts

- **Client setup.** Create a Sui client and extend it with the Walrus extension: `new SuiGrpcClient({ network, baseUrl }).$extend(walrus())`. The extension is reached as `client.walrus`. Do not use the deprecated JSON-RPC `SuiClient` for new code.
- **Two API levels.** The `WalrusFile` API (`getFiles`, `writeFiles`) handles data stored as plain blobs and as quilts, and is the recommended entry point. The raw `readBlob` / `writeBlob` API works on single `Uint8Array` blobs.
- **Flows.** `writeFilesFlow` and `writeBlobFlow` break a write into `encode`, `register`, `upload`, `certify` steps. Use them for browser wallets (each signature in its own user interaction) and for crash-recoverable uploads (`run()` yields a persistable step; pass it back as `resume`).
- **Signer.** Writes need a `Signer` whose address holds SUI for the register and certify transactions and WAL for storage and the write fee. Reads need no signer.
- **Upload relay.** A browser or mobile client cannot open enough connections to reach every shard. The `uploadRelay` option sends the blob to a relay that distributes the slivers; the client still signs and pays on Sui. Relays may require a tip.
- **Blob ID vs object ID.** `blobId` (URL-safe base64, derived from content) is for reading. `blobObject.id` (`0x...`) is the Sui object used for lifecycle operations and for verifying availability.
- **Community SDKs.** For non-TypeScript languages, community SDKs exist for [Go](https://github.com/namihq/walrus-go), [PHP](https://github.com/suicore/walrus-sdk-php), and [Python](https://github.com/standard-crypto/walrus-python). They talk to aggregators and publishers over HTTP.

### Installation and setup

```bash
npm install --save @mysten/walrus @mysten/sui
```

```typescript
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { walrus } from '@mysten/walrus';

const client = new SuiGrpcClient({
  network: 'testnet',
  baseUrl: 'https://fullnode.testnet.sui.io:443',
}).$extend(walrus());
```

The SDK bundles the package and object IDs for each network. To target a different deployment, pass `packageConfig: { systemObjectId, stakingPoolId }` to `walrus({...})`. To customize storage-node requests (timeouts, retries, logging), pass `storageNodeClientOptions: { fetch, timeout, onError }`.

### Reading with the WalrusFile API

`getFiles` accepts blob IDs and quilt IDs and returns `WalrusFile` objects. Read in batches so the client can load several files from one quilt efficiently:

```typescript
const [file1, file2] = await client.walrus.getFiles({ ids: [anyBlobId, orQuiltId] });

const bytes = await file1.bytes();   // Uint8Array
const text = await file1.text();     // utf-8 string
const json = await file2.json();     // parsed JSON

// Files stored in a quilt also carry an identifier and tags
const identifier: string | null = await file1.getIdentifier();
const tags: Record<string, string> = await file1.getTags();
```

With a blob ID you can also get a `WalrusBlob` and, if it is a quilt, list its files by identifier, tag, or quilt ID:

```typescript
const blob = await client.walrus.getBlob({ blobId });
const files = await blob.files();
const [readme] = await blob.files({ identifiers: ['README.md'] });
const textFiles = await blob.files({ tags: [{ 'content-type': 'text/plain' }] });
```

### Writing with the WalrusFile API

Build files from a `Uint8Array`, `Blob`, or string, then write them. All files in one `writeFiles` call go into a single quilt, so write multiple files together when you can; the quilt encoding is less efficient for a single file.

```typescript
import { WalrusFile } from '@mysten/walrus';

const file1 = WalrusFile.from({ contents: new Uint8Array([1, 2, 3]), identifier: 'file1.bin' });
const file2 = WalrusFile.from({
  contents: new TextEncoder().encode('Hello from the TS SDK!!!\n'),
  identifier: 'README.md',
  tags: { 'content-type': 'text/plain' },
});

const results = await client.walrus.writeFiles({
  files: [file1, file2],
  epochs: 3,
  deletable: true,
  signer: keypair,
});
// results: { id, blobId, blobObject }[]
```

### Raw blobs: readBlob and writeBlob

```typescript
const data = await client.walrus.readBlob({ blobId }); // Uint8Array

const { blobId } = await client.walrus.writeBlob({
  blob: new TextEncoder().encode('Hello from the TS SDK!!!\n'),
  deletable: false,
  epochs: 3,
  signer: keypair,
});
```

`writeBlob` and `writeFiles` accept `onStep` and `resume` for crash-recoverable uploads: persist each step from `onStep`, and pass the saved step as `resume` to continue after a crash.

### Flows: browser wallets and resumable uploads

Browser wallets open popups to sign, and a popup not opened in direct response to a user interaction may be blocked. `writeFilesFlow` splits the write so the register and certify transactions can each be signed from their own button:

```typescript
const flow = client.walrus.writeFilesFlow({
  files: [WalrusFile.from({ contents: new Uint8Array(fileData), identifier: 'my-file.txt' })],
});
await flow.encode();

// Button 1
async function handleRegister() {
  const registerTx = flow.register({ epochs: 3, owner: currentAccount.address, deletable: true });
  const result = await signAndExecuteTransaction({ transaction: registerTx });
  if (result.$kind === 'FailedTransaction') {
    throw new Error(`Registration failed: ${result.FailedTransaction.status.error?.message}`);
  }
  await flow.upload({ digest: result.Transaction.digest });
}

// Button 2
async function handleCertify() {
  const certifyTx = flow.certify();
  const result = await signAndExecuteTransaction({ transaction: certifyTx });
  if (result.$kind === 'FailedTransaction') {
    throw new Error(`Certification failed: ${result.FailedTransaction.status.error?.message}`);
  }
  const files = await flow.listFiles();
}
```

Without separate interactions, run the whole pipeline as an async iterator and persist each step:

```typescript
const flow = client.walrus.writeBlobFlow({ blob });
for await (const step of flow.run({ signer, epochs: 3, deletable: true })) {
  await db.save(fileId, step); // a WriteBlobStep, persisted for crash recovery
}

// Resume: completed steps are skipped and only missing slivers are uploaded
const resumed = client.walrus.writeBlobFlow({ blob, resume: await db.load(fileId) });
```

`executeRegister({ signer, epochs, deletable, owner })` and `executeCertify({ signer })` sign for you and return typed step results.

### Upload relay for browser apps

```typescript
const client = new SuiGrpcClient({
  network: 'testnet',
  baseUrl: 'https://fullnode.testnet.sui.io:443',
}).$extend(
  walrus({
    uploadRelay: {
      host: 'https://upload-relay.testnet.walrus.space',
      sendTip: { max: 1_000 }, // maximum tip in MIST; the client reads the required tip itself
    },
  }),
);
```

- `host` is required. Mainnet: `https://upload-relay.mainnet.walrus.space`. Testnet: `https://upload-relay.testnet.walrus.space`.
- The relay publishes its tip at `<host>/v1/tip-config`. The tip is `const` (fixed per blob) or `linear` (`base` plus `perEncodedKib`). With `sendTip: { max }` the client pays up to the maximum; to set the tip manually pass `sendTip: { address, kind: { const: 105 } }` or `kind: { linear: { base: 105, perEncodedKib: 10 } }`.
- If the required tip exceeds `max`, the upload fails with `Tip amount exceeds the maximum allowed tip`. Raise `max`.

### Verify a blob before depending on it

A write result is not proof that the blob is durably stored. Read the `Blob` object back and check it is certified, within its storage period, and not deletable:

```typescript
const blob = await walrusClient.getBlobObject(blobObjectId); // blobObject.id from the write result
const durable =
  blob.certified_epoch != null &&          // null until certified
  currentEpoch < blob.storage.end_epoch && // read the epoch from system state or `walrus info`
  !blob.deletable;
if (!durable) throw new Error('Blob is not durably available yet; do not depend on it');
```

The `blob_id` field on the Sui object is a `u256`, not the base64 blob ID used in aggregator URLs; read by object ID rather than splicing that field into a URL. See `walrus-blob-lifecycle` for the full availability and integrity check.

### Error handling

Errors from stale cached data around an epoch change extend `RetryableWalrusClientError`. Reset the client and retry:

```typescript
import { RetryableWalrusClientError } from '@mysten/walrus';

if (error instanceof RetryableWalrusClientError) {
  client.walrus.reset();
  // retry the operation
}
```

High-level methods such as `readBlob` already retry these cases and tolerate a subset of nodes failing. To see the individual storage-node errors the SDK absorbs, pass `storageNodeClientOptions: { onError: (error) => console.log(error) }`.

### WASM loading: Vite and Next.js

The SDK needs WASM bindings to encode and decode blobs. Node.js, Bun, and some bundlers need no configuration. Where the bundler cannot locate the binary, point the client at it:

```typescript
// Vite
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';

const client = new SuiGrpcClient({ network: 'testnet', baseUrl: 'https://fullnode.testnet.sui.io:443' })
  .$extend(walrus({ wasmUrl: walrusWasmUrl }));

// Or load from a CDN / self-host
walrus({ wasmUrl: 'https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm' });
```

```typescript
// Next.js API routes (webpack and Turbopack alike)
const nextConfig: NextConfig = {
  serverExternalPackages: ['@mysten/walrus', '@mysten/walrus-wasm'],
};
```

Without `serverExternalPackages`, bundling the WASM loader into a server route can break how it locates the binary; Turbopack surfaces this as a virtualized path such as `/ROOT/...`. If you cannot use it, point `wasmUrl` at the web build as in the Vite example.

### Known fetch limitations

- Node.js's default `connectTimeout` is 10 seconds and some nodes respond slowly; raise it with a custom `fetch` (for example `undici`'s `Agent({ connectTimeout })`) in `storageNodeClientOptions`.
- In Bun, an `abort` signal stops requests from responding, but the promises still wait for completion before rejecting.

### Rules

1. **Extend a `SuiGrpcClient`.** `new SuiGrpcClient({ network, baseUrl }).$extend(walrus())`. The JSON-RPC client is deprecated.
2. **Use the method names the SDK has.** `getFiles` / `writeFiles` for files and quilts, `readBlob` / `writeBlob` for raw blobs, `writeFilesFlow` / `writeBlobFlow` for step-by-step writes. There is no `storeBlob`.
3. **Always pass `epochs`, `deletable`, and a `signer` to a write.** The signer needs SUI for gas and WAL for storage plus the write fee.
4. **Use an upload relay in browsers.** Set `uploadRelay.host` and a `sendTip.max` large enough for the relay's `/v1/tip-config`.
5. **Verify before you depend on a blob.** Check `certified_epoch`, `storage.end_epoch`, and `deletable` on the `Blob` object.
6. **Reset on `RetryableWalrusClientError`.** Call `client.walrus.reset()` and retry; it is not guaranteed to succeed, but it clears state that goes stale across epoch changes.
7. **Encrypt before uploading sensitive data.** All Walrus blobs are public.

### Common mistakes

- **Calling `storeBlob`.** It does not exist. Use `writeBlob` (raw bytes) or `writeFiles` (files, stored as a quilt).
- **Passing a raw string or object as the blob.** `writeBlob` takes a `Uint8Array`; `WalrusFile.from` takes a `Uint8Array`, `Blob`, or string. Convert JSON with `new TextEncoder().encode(JSON.stringify(obj))`.
- **Using `optimizeDeps.exclude` for Vite.** The documented fix is the `wasmUrl` option with a `?url` import of `@mysten/walrus-wasm/web/walrus_wasm_bg.wasm`, and `serverExternalPackages` for Next.js routes.
- **Signing register and certify from one click in a browser.** The second popup gets blocked. Use `writeFilesFlow` with one user interaction per transaction.
- **Writing many single files with `writeFiles`.** Each call makes one quilt; batch files into one call.
- **Treating the write result as durability.** A registered blob is not a certified one. Read the `Blob` object back with `getBlobObject` and check `certified_epoch`.
- **`Tip amount exceeds the maximum allowed tip`.** Raise `sendTip.max`; check the relay's `/v1/tip-config`.
- **Retrying without `reset()`.** After an epoch change the client's cached committee is stale; reset before retrying a `RetryableWalrusClientError`.
- **Hardcoding system object IDs.** The SDK bundles them per network; use `packageConfig` only for a custom deployment.
