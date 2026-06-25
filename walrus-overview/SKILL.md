---
name: walrus-overview
description: >
  High-level overview of Walrus: what it is, how it works, and which tool to use.
  Use when the user is new to Walrus, asks "what is Walrus", "how does Walrus work",
  "what is a blob", or needs to choose between CLI, HTTP API, TypeScript SDK, and
  Move integration. Also use when explaining Walrus architecture, comparing Walrus to
  AWS S3 or IPFS, explaining the publisher/aggregator/upload relay distinction, or
  clarifying blob ID vs Sui object ID. This is the entry-point skill for Walrus
  newcomers.
---

# Walrus Overview

> **Source constraint:** All information in this skill is sourced from the
> [Walrus documentation](https://docs.wal.app) and the
> [Walrus whitepaper](https://docs.wal.app/walrus.pdf).
> When extending this skill, only pull from these sources.

Walrus is a decentralized storage protocol built on the Sui blockchain. It stores arbitrary binary data ("blobs") across a network of independent storage nodes using erasure coding. Sui smart contracts manage blob registration, certification, payments, and metadata.

This skill provides the entry point for understanding Walrus. It covers architecture, core terminology, and how to choose the right tool for your use case. For specific tool usage, load the corresponding skill.

---

## Related skills

| Topic | Skill | Load when |
|-------|-------|-----------|
| CLI | `walrus-cli` | Using the `walrus` binary |
| HTTP API | `walrus-http-api` | Storing/reading via REST |
| TypeScript SDK | `walrus-ts-sdk` | Programmatic access from TypeScript |
| Move integration | `walrus-move-integration` | Wrapping blobs in Move contracts |
| Storage costs | `walrus-storage-costs` | Pricing, estimation, cost optimization |
| Blob lifecycle | `walrus-blob-lifecycle` | Extending, deleting, sharing blobs |
| Sites | `walrus-sites` | Deploying static websites |
| Quilts | `walrus-quilts` | Batching many small blobs |
| Data security | `walrus-data-security` | Encryption with Seal |
| Troubleshooting | `walrus-troubleshooting` | Common errors and fixes |

---

## Routing guide

| Task | Load |
|------|------|
| "What is Walrus?" / "How does it work?" | Skill Content below |
| "Which tool should I use?" | Decision tree below |
| "What is a blob / blob ID / object ID?" | Terminology below |
| Store a file | `walrus-cli` or `walrus-http-api` or `walrus-ts-sdk` |
| Estimate costs | `walrus-storage-costs` |
| Deploy a website | `walrus-sites` |
| Encrypt data | `walrus-data-security` |
| Fix an error | `walrus-troubleshooting` |

---

## Skill Content

### What is Walrus?

Walrus is a **decentralized blob storage protocol**. You upload a file, Walrus encodes it into fragments distributed across independent storage nodes, and the Sui blockchain tracks ownership and availability. The result is storage that survives node failures, has no single point of control, and provides cryptographic proof that data has not been tampered with.

Key properties:
- **Public by default.** All blobs are readable by anyone with the blob ID. Encrypt before uploading if you need privacy (see `walrus-data-security`).
- **Content-addressed.** The same file content always produces the same blob ID.
- **Time-limited.** Storage lasts a fixed number of epochs (max ~2 years). Blobs must be extended or re-uploaded to persist longer.
- **Fault-tolerant.** Data remains available even if up to 2/3 of storage nodes fail.

### Three-layer architecture

1. **Client layer.** Your code (CLI, SDK, or HTTP requests) encodes blobs, distributes fragments to storage nodes, and interacts with Sui for registration and certification.

2. **Storage node layer.** Independent operators run storage nodes that hold erasure-coded fragments ("slivers") of blobs. Each node holds one or more shards. Nodes verify slivers, sign receipts, and participate in epoch transitions. Over 60 operators run nodes on mainnet.

3. **Sui blockchain layer.** Smart contracts on Sui manage payments (WAL token), storage resource allocation, shard-to-node assignments, blob registration/certification, and metadata. The blockchain is the coordination layer, not the data layer.

### How storing works

1. The client encodes the blob using **RedStuff erasure coding**, producing slivers distributed across all shards (~4.5x storage overhead).
2. The client registers the blob on Sui, paying WAL for storage and SUI for gas.
3. Slivers are sent in parallel to storage nodes. Each node verifies and signs a receipt.
4. Once 2/3 of nodes confirm, signatures are aggregated into an **availability certificate** submitted to Sui.
5. The **Point of Availability (PoA)** marks when Walrus guarantees the blob is available for its full storage duration.

### How reading works

1. The client requests slivers from storage nodes.
2. Once it collects slivers from more than 1/3 of nodes, it reconstructs the original blob.
3. Alternatively, an **aggregator** does this on your behalf and serves the blob over HTTP.

### Core terminology

| Term | Definition |
|------|-----------|
| **Blob** | Any binary data stored on Walrus (file, image, JSON, video, etc.). Max ~13.6 GiB. |
| **Blob ID** | URL-safe base64 string identifying blob content. Content-addressed: same content = same ID. Used for reading. |
| **Sui object ID** | `0x...` hex string identifying the on-chain `Blob` Sui object. Different for each upload, even with same content. Used for lifecycle ops (extend, delete, share). |
| **Epoch** | A time period. 14 days on mainnet. Storage duration is measured in epochs. |
| **Sliver** | A fragment of an erasure-coded blob, stored on a single shard. |
| **Shard** | A partition of the storage space, assigned to a storage node for each epoch. |
| **Publisher** | An HTTP service that accepts blob data (PUT) and handles encoding, distribution, and on-chain registration. No public mainnet publisher exists. |
| **Aggregator** | An HTTP service that reads blobs (GET) by fetching slivers from storage nodes. Many public aggregators exist on both networks, free to use. |
| **Upload relay** | A third-party service that handles encoding and sliver distribution on behalf of bandwidth-limited clients (for example, browsers). May charge a tip. |
| **WAL** | The Walrus token, used to pay for storage. |
| **SUI** | The Sui token, used to pay for on-chain gas fees. |
| **Point of Availability (PoA)** | The moment an availability certificate is posted on-chain, after which Walrus guarantees the blob is available. |
| **Deletable blob** | A blob whose owner can remove before expiry (default). |
| **Permanent blob** | A blob that cannot be deleted before expiry, even by the uploader. |
| **Quilt** | A single storage unit containing multiple blobs, reducing per-blob overhead. |
| **Shared blob** | A `Blob` wrapped in a Sui shared object so anyone can fund and extend it. The Walrus contract provides `SharedBlob` as a reference implementation; developers can also create custom shared wrappers. |
| **Storage pool** | A funding pool that blobs draw storage from, simplifying lifecycle management. The recommended way to manage blob storage. |

### Blob ID vs Sui object ID

This is the most common point of confusion for new users:

| | Blob ID | Sui Object ID |
|---|---------|--------------|
| **Format** | URL-safe base64 (for example, `M4hsZGQ1oCk...`) | Hex with `0x` prefix (for example, `0xe91eee8c...`) |
| **Derived from** | Blob content (content-addressed) | Sui transaction (unique per upload) |
| **Same content uploaded twice?** | Same blob ID | Different object IDs |
| **Used for** | Reading blob content | Lifecycle operations (extend, delete, share, burn) |
| **Where you get it** | Store response (`blobId` field) | Store response (`blobObject.id` field) |

### Decision tree: which tool to use

| You want to... | Use | Skill |
|----------------|-----|-------|
| Upload a file from the terminal | `walrus store` CLI | `walrus-cli` |
| Script uploads in a CI/CD pipeline | `walrus json` CLI (JSON mode) | `walrus-cli` |
| Store/read from any language over HTTP | Publisher/aggregator REST API | `walrus-http-api` |
| Build a TypeScript/JavaScript app | `@mysten/walrus` SDK | `walrus-ts-sdk` |
| Upload from a browser | TypeScript SDK + upload relay | `walrus-ts-sdk` |
| Reference blobs in a Move contract | Walrus Move dependency | `walrus-move-integration` |
| Deploy a static website | `site-builder` CLI | `walrus-sites` |
| Store many small files cheaply | Quilts (CLI or HTTP) | `walrus-quilts` |
| Store sensitive/private data | Encrypt with Seal, then store | `walrus-data-security` |

### Walrus vs traditional storage

| | Walrus | AWS S3 / Cloud Storage |
|---|--------|----------------------|
| **Control** | No single operator controls data | Provider controls everything |
| **Trust model** | Cryptographic verification | Platform trust |
| **Fault tolerance** | Survives 2/3 node failures | Provider SLA |
| **Privacy** | All data public by default | Private by default |
| **Cost model** | WAL + SUI tokens, per-epoch | USD, per-month |
| **Duration** | Max ~2 years per purchase, renewable | Indefinite |
| **Structure** | Flat blob storage (no directories) | Directories/buckets |
| **Verifiability** | Cryptographic blob IDs, on-chain certificates | None |

Walrus is strongest for use cases that need **censorship resistance, verifiability, decentralized availability, or programmable access control**. It is not a drop-in replacement for all cloud storage — only the object/blob storage part.

### Rules

1. **All blobs are public.** Encrypt before uploading if you need privacy.
2. **Storage is time-limited.** Plan for renewals. Maximum is 53 epochs (~2 years on mainnet).
3. **You need both WAL and SUI.** WAL pays for storage, SUI pays for gas.
4. **No public mainnet publisher.** Use the upload relay, TypeScript SDK, CLI, or run your own publisher.
5. **Small blobs are expensive individually.** Use quilts for batches of small files.
6. **Blob ID is not object ID.** Content hash (for reading) vs on-chain object (for management). Do not confuse them.
