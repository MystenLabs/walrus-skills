---
name: walrus-storage-costs
description: >
  Walrus storage pricing, cost estimation, and the dual-token (WAL + SUI) cost model.
  Use when the user asks how much storage costs, how to estimate costs for a dataset,
  what the per-blob metadata overhead is, how epochs relate to pricing, how to use the
  cost calculator or walrus info, or why small blobs are expensive. Also use when the
  user asks about WAL vs SUI fees, write fees, storage fund deposits, dry-run cost
  checks, or cost optimization strategies (quilts, storage reuse).
---

# Walrus Storage Costs

> **Source constraint:** All information in this skill is sourced from the
> [Walrus storage costs documentation](https://docs.wal.app/docs/system-overview/storage-costs)
> and the [Walrus cost calculator](https://costcalculator.wal.app/).
> When extending this skill, only pull from these sources.

Storage pricing is the most frequently asked question about Walrus. The cost model has two token components (WAL and SUI), a per-blob metadata overhead that dominates for small files, and epoch-based duration pricing. This skill explains how costs work and how to estimate them.

All patterns in this skill are derived from:
- https://docs.wal.app/docs/system-overview/storage-costs
- https://docs.wal.app/docs/walrus-client/storing-blobs
- https://docs.wal.app/docs/large-uploads

If unsure about current pricing, run `walrus info` or check the cost calculator.

---

## Related skills

| Topic | Skill | Load when |
|-------|-------|-----------|
| Storing blobs | `walrus-cli` | CLI store commands |
| HTTP API | `walrus-http-api` | Store via REST |
| TypeScript SDK | `walrus-ts-sdk` | Programmatic cost estimation |
| Quilts | `walrus-quilts` | Cost optimization for many small blobs |
| Blob lifecycle | `walrus-blob-lifecycle` | Extending storage, reclaiming via delete |
| Overview | `walrus-overview` | General Walrus architecture |

---

## Skill Content

### The dual-token cost model

Every blob store operation has two cost components:

| Token | What it pays for | When charged |
|-------|-----------------|--------------|
| **WAL** | Walrus storage: reserving space on storage nodes for the encoded blob | Per store and extend operation |
| **SUI** | Sui blockchain gas: registering, certifying, and managing the blob object on-chain | Per transaction (up to 3 txs per store) |

You need both WAL and SUI in your wallet to store blobs. On testnet, get SUI from `sui client faucet` and WAL from the Walrus testnet faucet.

### WAL cost breakdown

The WAL cost for storing a blob has two parts:

1. **Storage cost** = `encoded_size × price_per_unit × epochs`
   - `encoded_size` = raw blob size after erasure coding (~5x expansion) plus per-blob metadata
   - `price_per_unit` = price per encoded storage unit per epoch (check `walrus info`)
   - `epochs` = number of storage epochs

2. **Write fee** = a one-time flat fee per upload, independent of blob size or epoch count

Run `walrus info` to see current values:
```sh
walrus info
# Shows: price per encoded storage unit, write fee, current epoch, epoch duration
```

### The per-blob metadata overhead

Every blob incurs approximately **64 MB of metadata overhead** regardless of its actual size. This metadata is part of the encoded storage and is included in the cost calculation.

| Blob size | Encoded size (approx) | Metadata % of cost |
|-----------|----------------------|-------------------|
| 1 KB | ~64 MB | ~99.99% |
| 1 MB | ~69 MB | ~93% |
| 10 MB | ~114 MB | ~56% |
| 100 MB | ~564 MB | ~11% |
| 1 GB | ~5.1 GB | ~1% |

**This is why small blobs are expensive individually.** A 1 KB JSON document costs roughly the same as a 64 MB file. For many small files, use **quilts** to batch them into a single storage unit, amortizing the metadata overhead across all files.

### SUI gas costs

Each store operation involves up to 3 on-chain Sui transactions:
1. `reserve_space` — acquire a storage resource
2. Register the blob
3. Certify the blob (submit availability certificate)

Each transaction incurs SUI gas fees. Additionally, the blob's Sui object deposits SUI into the Sui storage fund. Most of this deposit is **refunded** when you delete the blob object (via `walrus delete` or `walrus burn-blobs`).

### Epoch duration

| Network | Epoch duration |
|---------|---------------|
| **Mainnet** | 14 days |
| **Testnet** | Varies (shorter than mainnet) |

Maximum storage duration is **53 epochs** (~2 years on mainnet). Convert epochs to months: `months = epochs × 14 / 30` (mainnet). Always calculate in months, not epochs, when planning storage budgets.

### Estimating costs

#### Cost calculator (web)

Use the [Walrus Cost Calculator](https://costcalculator.wal.app/) for interactive estimates. Input file size and duration to see WAL cost.

#### CLI dry run

```sh
# Estimate cost without actually uploading
walrus store --dry-run myfile.dat --epochs 10
```

Returns the encoded size and estimated cost without submitting a transaction or spending tokens.

#### CLI info

```sh
# Show current pricing parameters
walrus info --json
```

Returns the price per encoded storage unit, write fee, current epoch, and maximum epochs ahead.

#### TypeScript SDK

```typescript
// Estimate storage cost programmatically
const cost = await client.walrus.storageCost(fileSizeInBytes, epochs);
```

### Cost optimization strategies

| Strategy | Savings | When to use |
|----------|---------|-------------|
| **Use quilts for small files** | Up to 99% for many small blobs | Storing many files <10 MB each |
| **Reuse storage resources** | Avoids buying new storage | The CLI does this automatically when your wallet has suitable resources |
| **Delete expired blob objects** | Reclaims SUI storage fund deposit | After blobs expire, burn them with `walrus burn-blobs --all-expired` |
| **Extend instead of re-upload** | Avoids write fee + encoding cost | When a blob needs to live longer |
| **Use permanent blobs only when needed** | Deletable blobs can reclaim storage | Default is deletable, which lets you recover storage resources |

### Rules

1. **Always check `walrus info` before large uploads.** Pricing can change between epochs.
2. **Use quilts for batches of small files.** The 64 MB per-blob overhead makes individual small blob storage very inefficient.
3. **Budget for both WAL and SUI.** WAL pays for storage, SUI pays for gas. Running out of either blocks operations.
4. **Estimate in months, not epochs.** Epoch duration can vary. Use `walrus info` to check current duration.
5. **Reclaim SUI with `burn-blobs --all-expired`.** Expired blob objects still hold SUI in the storage fund. Burning them recovers those deposits.
6. **`--dry-run` before production uploads.** Verify costs before committing tokens, especially for large datasets.

### Common mistakes

- **Wondering why a tiny JSON blob costs as much as a 64 MB file.** The ~64 MB per-blob metadata overhead dominates for small blobs. Use quilts instead.
- **Forgetting the write fee.** The write fee is charged on every upload regardless of size or epochs. It is separate from the per-unit storage cost.
- **Confusing WAL and SUI costs.** WAL = storage on Walrus nodes. SUI = gas for Sui transactions. They are different tokens with different purposes.
- **Not accounting for erasure coding overhead.** The encoded size is approximately 5x the raw blob size (before adding metadata). Cost is based on the encoded size, not the raw size.
- **Assuming storage is indefinite.** Maximum is 53 epochs (~2 years). Plan for renewals via `walrus extend` if data must persist longer.
- **Not using `--dry-run` for cost estimation.** This flag shows the cost without spending any tokens. Always use it before large uploads.
- **Paying to store the same content twice.** If a permanent blob with identical content and sufficient lifetime already exists, the CLI skips re-upload automatically (returning `alreadyCertified`). This is expected and saves money.
