---
name: walrus-troubleshooting
description: >
  Common Walrus error messages, their causes, and fixes. Use when the user encounters
  an error while using Walrus CLI, TypeScript SDK, HTTP API, or Move integration.
  Covers VMVerificationOrDeserializationError, ChainNotSupportedError, tip exceeded,
  RetryableWalrusClientError, file.bytes is not a function, 413 Payload Too Large,
  BlobNotCertifiedError, spawn walrus ENOENT, Cannot find gas coin, EWrongVersion,
  and other recurring errors from support threads.
---

# Walrus Troubleshooting

> **Source constraint:** Errors and fixes in this skill are sourced from the
> [Walrus documentation](https://docs.wal.app), the
> [Walrus GitHub repository](https://github.com/MystenLabs/walrus), and
> confirmed community support patterns. When extending, verify errors are
> reproducible before adding.

This skill collects the most common errors users encounter when working with Walrus, organized by tool. Each entry includes the error message, cause, and fix.

---

## Related skills

| Topic | Skill | Load when |
|-------|-------|-----------|
| CLI | `walrus-cli` | CLI usage and configuration |
| TypeScript SDK | `walrus-ts-sdk` | SDK initialization and usage |
| HTTP API | `walrus-http-api` | REST endpoint usage |
| Move integration | `walrus-move-integration` | Move dependency and contract issues |
| Storage costs | `walrus-storage-costs` | Cost-related questions |
| Overview | `walrus-overview` | Terminology confusion (blob ID vs object ID, etc.) |

---

## Skill Content

### CLI errors

#### `spawn walrus ENOENT` or `command not found: walrus`

**Cause:** The `walrus` binary is not installed or not in your PATH.

**Fix:**
```sh
curl -sSfL https://raw.githubusercontent.com/Mystenlabs/suiup/main/install.sh | sh
suiup install walrus
```
If already installed, add `~/.suiup/bin` to your PATH. Restart your shell after installation.

---

#### `Cannot find gas coin for signer address`

**Cause:** The wallet has no SUI tokens. Walrus operations require SUI for gas fees.

**Fix:**
- **Testnet:** Run `sui client faucet` to get test SUI.
- **Mainnet:** Acquire SUI through an exchange and transfer to the wallet address.

Check your balance with `sui client gas`.

---

#### `Error: missing configuration` or `No configuration file found`

**Cause:** The CLI cannot find `client_config.yaml`.

**Fix:**
```sh
curl --create-dirs https://docs.wal.app/setup/client_config.yaml \
  -o ~/.config/walrus/client_config.yaml
```
Or specify the path explicitly: `walrus --config /path/to/client_config.yaml store ...`

---

#### Testnet blobs disappearing quickly

**Cause:** Testnet epochs are shorter than mainnet epochs. Storing with low epoch counts means blobs expire sooner than expected.

**Fix:** Use `walrus info` to check the current epoch duration. Use generous epoch values on testnet (30+). On mainnet, 1 epoch = 14 days.

---

#### `suiup switch walrus 1.48.1` fails

**Cause:** Wrong syntax. `suiup` uses network-based versioning, not version numbers.

**Fix:**
```sh
suiup install walrus@mainnet
# or
suiup install walrus@testnet
```

---

### TypeScript SDK errors

#### `ChainNotSupportedError: The account does not support the chain "sui:undefined"`

**Cause:** The dApp Kit wallet adapter does not have the correct network configured. The SDK cannot determine which Sui chain to use.

**Fix:** Ensure the dApp Kit provider specifies the chain:
```typescript
<SuiClientProvider networks={{ testnet: { url: getFullnodeUrl('testnet') } }} defaultNetwork="testnet">
```
And that the wallet is connected to the same network.

---

#### `file.bytes is not a function`

**Cause:** Passing a raw string or JavaScript object to `storeBlob` instead of binary data.

**Fix:** Convert to `Uint8Array` first:
```typescript
// WRONG
await client.walrus.storeBlob({ blob: myJsonString, epochs: 5 });

// CORRECT
await client.walrus.storeBlob({
  blob: new TextEncoder().encode(myJsonString),
  epochs: 5,
});
```

The `blob` parameter expects `Uint8Array`, `File`, `Blob`, or `ReadableStream`.

---

#### `Tip amount (N) exceeds the maximum allowed tip (M)`

**Cause:** The upload relay requires a tip higher than your configured maximum. The default `sendTip.max` is too low for the relay you are using.

**Fix:** Increase the `sendTip.max` value in your upload relay configuration:
```typescript
uploadRelay: {
  host: 'https://upload-relay.mainnet.walrus.space',
  sendTip: { max: 5_000_000 },  // increase as needed
},
```

Check the relay's required tip: `curl <relay-url>/v1/tip-config`

---

#### `RetryableWalrusClientError: Too many failures while writing blob`

**Cause:** The SDK failed to distribute slivers to enough storage nodes. Common causes:
- No upload relay configured for a browser environment
- Network connectivity issues to storage nodes
- Storage nodes temporarily unavailable

**Fix:**
1. In a browser, configure an upload relay (see `walrus-ts-sdk` skill).
2. Check network connectivity.
3. Retry with exponential backoff.
4. If persistent, try a different upload relay or wait for storage node recovery.

---

#### `BlobNotCertifiedError`

**Cause:** The blob was registered on-chain but has not yet received enough confirmations from storage nodes. The availability certificate has not been submitted.

**Fix:** The blob is not yet at its Point of Availability (PoA). Wait for certification to complete. If it never completes, the upload may have failed partway through. Retry the store operation.

---

#### Vite build errors with `@mysten/walrus`

**Cause:** Vite's dependency pre-bundling breaks the SDK's gRPC and WASM imports.

**Fix:** Exclude the package from optimization:
```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['@mysten/walrus'],
  },
});
```

---

### HTTP API errors

#### `413 Payload Too Large`

**Cause:** The publisher has a maximum request body size. Public testnet publishers limit uploads to approximately 10 MiB.

**Fix:**
- For files larger than the publisher limit, use the CLI, TypeScript SDK, or run your own publisher.
- On mainnet, there are no public publishers. Use the upload relay or SDK directly.

---

#### `404 Not Found` immediately after uploading

**Cause:** CDN caching on the aggregator. The aggregator's CDN cached a 404 from before the blob propagated.

**Fix:** Retry with exponential backoff. The blob should become available within seconds to minutes after certification. If using a CDN-fronted aggregator, the cache TTL determines the delay.

---

### Move integration errors

#### `VMVerificationOrDeserializationError in command 0`

**Cause:** The published Move package does not match the on-chain Walrus contracts. This is almost always a `Move.toml` dependency issue.

**Fix:** Check these in order:

1. **Wrong `subdir` for the network.** Testnet uses `testnet-contracts/walrus`, mainnet uses `contracts/walrus`.
   ```toml
   # Testnet
   Walrus = { git = "https://github.com/MystenLabs/walrus.git", rev = "testnet", subdir = "testnet-contracts/walrus" }

   # Mainnet
   Walrus = { git = "https://github.com/MystenLabs/walrus.git", rev = "main", subdir = "contracts/walrus" }
   ```

2. **Wrong `rev`.** The commit must match what is deployed on-chain. Use the `testnet` branch for testnet, `main` for mainnet, or pin to a specific commit.

3. **Stale `Move.lock`.** Delete `Move.lock` and rebuild: `rm Move.lock && sui move build`.

4. **Wrong `edition`.** Use `edition = "2024"`, not `"2024.beta"`.

---

#### `EWrongVersion` (abort code 1) from `system::inner_mut`

**Cause:** Calling a Walrus system function using an old package ID after a Walrus upgrade. Walrus uses versioned shared objects.

**Fix:**
- **If using the CLI or SDK:** Update to the latest version. The client automatically refreshes package IDs.
- **If calling contracts directly:** Query the `system_object` to find the current package ID. Do not hardcode package IDs.
- The Walrus client code has built-in retry logic: on `EWrongVersion`, it calls `refresh_package_id()` and retries.

---

### Seal errors

#### `Transaction was not signed by the correct sender`

**Cause:** The PTB passed to Seal does not have `tx.setSender(address)` set, or the sender does not match the decrypting address.

**Fix:**
```typescript
tx.setSender(address);  // Must match the decrypting wallet address
```

---

#### `Connected wallet does not support Seal session signing`

**Cause:** The connected wallet does not implement the session signing protocol required by Seal for multi-signature decryption flows.

**Fix:** Use a wallet that supports Seal sessions, or implement manual per-signature approval in your decryption flow.

---

### Network / general errors

#### `ERR_CERT_COMMON_NAME_INVALID` on storage node connections

**Cause:** TLS certificate mismatch on a storage node. The node's certificate does not match the expected hostname.

**Fix:** This is typically a storage node operator issue. Try a different aggregator or wait for the operator to fix their TLS configuration. If using the CLI, it should automatically fall back to other nodes.

---

#### `client/server api version mismatch`

**Cause:** The installed `walrus` binary version does not match the network's expected version.

**Fix:**
```sh
suiup update walrus
# or install the version matching your network
suiup install walrus@mainnet
```

---

### Rules

1. **Check `Move.toml` first for Move errors.** `VMVerificationOrDeserializationError` is almost always a dependency issue.
2. **Check token balances for "gas coin" errors.** Both SUI and WAL are required for write operations.
3. **Configure upload relay for browser apps.** SDK write operations in a browser require an upload relay.
4. **Delete `Move.lock` when switching dependency revisions.** Stale lock files cause build failures.
5. **Use `walrus info` to verify network connectivity and configuration.** If `walrus info` works, your config is correct.
6. **Update the CLI when you see version mismatch errors.** Run `suiup update walrus`.
