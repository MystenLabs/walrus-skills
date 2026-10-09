---
name: walrus-http-api
description: >
  Walrus publisher and aggregator REST API for storing and reading blobs over HTTP.
  Use when the user needs to store or read Walrus blobs using HTTP PUT/GET requests,
  integrate Walrus from any programming language, configure storage options (epochs,
  deletable, permanent, send_object_to), or parse store/read API responses. Also use
  when troubleshooting HTTP API errors or CDN caching issues after upload. For quilt
  HTTP endpoints, see the `walrus-quilts` skill. For CLI usage, see `walrus-cli`.
---

# Walrus HTTP API

> **Source constraint:** All information in this skill is sourced from the
> [Walrus HTTP API documentation](https://docs.wal.app/docs/http-api/storing-blobs).
> When extending this skill, only pull from these sources.

Walrus exposes a REST API through publisher (write) and aggregator (read) services. This is the simplest integration path for any language: store blobs with HTTP PUT, read them with HTTP GET. No SDK installation required.

All patterns in this skill are derived from:
- https://docs.wal.app/docs/http-api/storing-blobs
- https://docs.wal.app/docs/http-api/reading-blobs

If unsure about any endpoint, fetch the relevant page before answering.

---

## Related skills

| Topic | Skill | Load when |
|-------|-------|-----------|
| Quilt HTTP endpoints | `walrus-quilts` | Storing/reading batched blobs through HTTP |
| CLI | `walrus-cli` | Using the `walrus` binary instead of HTTP |
| TypeScript SDK | `walrus-ts-sdk` | Using the official TS SDK |
| Blob management | `walrus-blob-lifecycle` | Extending, deleting, or sharing blobs |
| Encryption | `walrus-data-security` | Encrypting before storing |

---

## Skill Content

### Key concepts

- **Publisher.** An HTTP service that accepts blob data and handles encoding, sliver distribution, and on-chain registration. You PUT data to a publisher to store it. There is no public unauthenticated publisher on Mainnet. On Mainnet, run your own authenticated publisher, use the upload relay, or use the TypeScript SDK directly. Public publisher endpoints exist only for Testnet.

- **Aggregator.** An HTTP service that reads blobs from Walrus storage nodes and returns them via GET requests. Aggregators are read-only and can be fronted by a CDN.

- **Blob ID vs object ID.** A blob ID identifies the content. A Sui object ID identifies the on-chain `Blob` object. You can read by either. Reading by object ID also supports HTTP header attributes.

- **Consistency checks.** The aggregator verifies blob integrity on read. You can enable strict checks with `?strict_consistency_check=true` or skip them with `?skip_consistency_check=true` if the writer is known and trusted.

### Storing blobs (publisher)

Store data using HTTP PUT to the publisher:

```sh
# Store a string for 1 epoch (default)
curl -X PUT "$PUBLISHER/v1/blobs" -d "some string"

# Store a file for 5 epochs
curl -X PUT "$PUBLISHER/v1/blobs?epochs=5" --upload-file "some/file"
```

#### Query parameters

| Parameter | Effect | Default |
|-----------|--------|---------|
| `epochs` | Number of storage epochs | 1 |
| `deletable=true` | Blob can be deleted by owner before expiry | Default for new blobs |
| `permanent=true` | Blob cannot be deleted before expiry | Must be explicit |
| `send_object_to` | Send the resulting Blob Sui object to another address (how a sponsored upload hands ownership to a walletless user) | Publisher's wallet |
| `reuse_resources=true` | Reuse storage or blob objects the publisher wallet already owns instead of registering fresh ones | `false`; keep it off when concurrent stores share one wallet |

```sh
# Store as permanent for 5 epochs
curl -X PUT "$PUBLISHER/v1/blobs?epochs=5&permanent=true" --upload-file "file.dat"

# Store and send the blob object to another address
curl -X PUT "$PUBLISHER/v1/blobs?send_object_to=$ADDRESS" --upload-file "file.dat"
```

#### Store response: newly created

When a blob is stored for the first time:

```json
{
  "newlyCreated": {
    "blobObject": {
      "id": "0xe91e...c50",
      "registeredEpoch": 34,
      "blobId": "M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk",
      "size": 17,
      "encodingType": "RS2",
      "certifiedEpoch": 34,
      "storage": {
        "id": "0x4748...5faf",
        "startEpoch": 34,
        "endEpoch": 35,
        "storageSize": 66034000
      },
      "deletable": false
    },
    "resourceOperation": {
      "registerFromScratch": {
        "encodedLength": 66034000,
        "epochsAhead": 1
      }
    },
    "cost": 132300
  }
}
```

#### Store response: already certified

When identical content already exists with sufficient lifetime:

```json
{
  "alreadyCertified": {
    "blobId": "M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk",
    "event": {
      "txDigest": "4XQHFa9S324wTzYHF3vsBSwpUZuLpmwTHYMFv9nsttSs",
      "eventSeq": "0"
    },
    "endEpoch": 35
  }
}
```

The `event` field contains the Sui event ID you can use to find the transaction on [Suiscan](https://suiscan.xyz/).

### Reading blobs (aggregator)

Read blobs using HTTP GET from an aggregator:

```sh
# Read by blob ID
curl "$AGGREGATOR/v1/blobs/<BLOB_ID>" -o output.file

# Read by Sui object ID (also returns HTTP header attributes)
curl "$AGGREGATOR/v1/blobs/by-object-id/<OBJECT_ID>" -o output.file
```

Reading by object ID recognizes these attribute keys and returns them as HTTP headers: `content-disposition`, `content-encoding`, `content-language`, `content-location`, `content-type`, and `link`.

### Publisher, aggregator, and upload relay: which to use

| Service | Direction | Mainnet availability | Wallet needed |
|---------|-----------|---------------------|---------------|
| **Publisher** | Write (PUT) | No public publisher. Run your own or use upload relay / SDK. | Yes (WAL + SUI) |
| **Upload relay** | Write (PUT) | `https://upload-relay.mainnet.walrus.space` | Yes (WAL + SUI + optional tip) |
| **Aggregator** | Read (GET) | Many public aggregators, no fees, no wallet needed. | No |

- **Mainnet aggregator (Mysten Labs):** `https://aggregator.walrus-mainnet.walrus.space`
- **Testnet aggregator (Mysten Labs):** `https://aggregator.walrus-testnet.walrus.space`
- **Testnet publisher (Mysten Labs):** `https://publisher.walrus-testnet.walrus.space`

The full list of public aggregators is available at [docs.wal.app/operators.json](https://docs.wal.app/operators.json) (JSON) and the [public services page](https://docs.wal.app/docs/system-overview/public-aggregators-and-publishers). Public aggregators set CORS headers, so browser-based reads work directly.

### Sponsored and walletless uploads

Most users hold neither SUI nor WAL. Walrus has no built-in gas-sponsorship primitive; sponsoring means one of your wallets performs and pays for the store. Three patterns:

| Pattern | Who signs | Who pays | Walletless for the user | Best for |
|---|---|---|---|---|
| **Backend publisher** | Publisher wallet | App | Yes | Backends that accept raw bytes over HTTP and pay for storage |
| **Upload relay** | Client or app signer | Client or app signer, plus a relay tip if configured | Only if the app manages signing | Browser and mobile clients that cannot open many node connections |
| **Direct SDK** | The signer your code configures | App wallet | Yes, if the backend holds the signer | Backends that integrate Walrus directly and control signing in code |

The reference architecture: the client authenticates to your backend with your own credentials; the backend applies policy (quotas, sizes, duration) and forwards the bytes to your publisher; the publisher stores with its funded wallet and, with `send_object_to=<address>`, sends the `Blob` object to the user; the backend returns the blob ID. Every store spends real WAL and SUI (reserve + register in one transaction, certify in a second); there is no free tier.

Operational pitfalls from the docs:
- **Never expose an unauthenticated publisher on Mainnet.** Anyone who reaches it spends your wallet's SUI and WAL. Put the authenticated publisher's JWT flow or your own gateway in front of it.
- **Do not sign many concurrent stores from one wallet.** Concurrent transactions contend for the same owned gas and storage objects. The publisher uses internal sub-wallets for this; replicate it if you build your own uploader.
- **Keep `reuse_resources` off when a wallet is shared.** Reuse lets two in-flight uploads contend for the same objects and can leave a blob registered but never certified.
- **Keep the funding wallets topped up.** Monitor both SUI and WAL on the main wallet; the publisher refills its sub-wallets from it.

### Byte ranges and streaming media

Aggregators support the HTTP `Range` header and return `206 Partial Content`, which is what lets a browser seek inside a video. There is also a query-parameter form:

```sh
curl -H "Range: bytes=0-999" "$AGGREGATOR/v1/blobs/<BLOB_ID>"
curl "$AGGREGATOR/v1/blobs/<BLOB_ID>/byte-range?start=0&length=1024"
```

A `<video>` or `<audio>` element can use an aggregator URL as its `src`. Reading by blob ID returns no content type, and the aggregator deliberately blocks type sniffing, so set the `content-type` attribute on the blob and read it **by object ID** (`/v1/blobs/by-object-id/<OBJECT_ID>`) so the header is returned and the browser plays instead of downloads. A byte-range read verifies only the bytes it fetches, not the whole blob.

### Querying system info### Querying system info

```sh
# Get current epoch, storage cost, and network parameters
curl "$AGGREGATOR/v1/info"
```

Returns epoch number, epoch duration, and system parameters. Useful for calculating costs and checking the current epoch before setting `epochs` on a store request.

### Rules

1. **No public Mainnet publisher.** On Mainnet, run your own authenticated publisher or use the TypeScript SDK/upload relay. Public endpoints are Testnet only.
2. **New blobs are deletable by default.** Explicitly set `permanent=true` if you need guaranteed availability.
3. **Retry reads after immediate upload.** CDN-fronted aggregators might briefly cache a 404 from before the blob propagated. Retry with backoff.
4. **Use blob ID for content reads, object ID for attributed reads.** Reading by object ID returns custom HTTP headers from blob attributes. Reading by blob ID does not.
5. **Check the response type.** A store response is either `newlyCreated` or `alreadyCertified`. Both are success cases.

### Common mistakes

- **Assuming a public publisher exists on Mainnet.** It does not. You must run your own, use an upload relay, or use the TypeScript SDK directly. The upload relay at `https://upload-relay.mainnet.walrus.space` is the easiest mainnet write path.
- **Not checking for `alreadyCertified` in the response.** The publisher returns this when identical content already has sufficient lifetime. This is not an error.
- **Reading immediately after storing and getting 404.** CDN caching can cause brief 404s. Retry with backoff.
- **Omitting `epochs` and getting 1-epoch storage.** The default is 1 epoch. Always set `epochs` explicitly.
- **Confusing publisher and aggregator roles.** Publishers store (PUT). Aggregators read (GET). They are separate services with different URLs.
- **Treating `503 BLOB_UNAVAILABLE` as permanent.** Since v1.47 the aggregator returns a retryable `503` (instead of `500`) when a blob is only temporarily unretrievable. Retry with backoff.
- **Expecting a content type when reading by blob ID.** Only the by-object-id read returns attribute headers such as `content-type`.
- **Getting `413 Payload Too Large` on a publisher.** Some publishers limit upload size (for example, 10 MiB for public testnet publishers). For large files, use the CLI, the TypeScript SDK, or run your own publisher.
- **Wondering why `storageSize` is ~66 MB for a tiny blob.** Walrus adds ~64 MB of fixed per-blob metadata overhead regardless of blob size. For blobs smaller than ~10 MB, metadata cost dominates. Use quilts for many small blobs.
- **Using old aggregator URLs.** `aggregator.walrus.site` and `aggregator.devnet.walrus.space` are outdated. Use `aggregator.walrus-mainnet.walrus.space` for mainnet or `aggregator.walrus-testnet.walrus.space` for testnet.
