---
name: walrus-blob-lifecycle
description: >
  Managing Walrus blob lifecycles: epochs, lifetimes, extending blobs, deleting blobs,
  burning blob objects, sharing blobs, setting blob attributes, and handling large uploads.
  Use when the user needs to extend a blob's lifetime, delete or burn blobs, create shared
  blobs, set/get/remove blob attributes, plan large data uploads (>1 GiB), estimate storage
  costs, manage concurrent upload memory, or understand epoch-based expiration. For basic
  store/read, see `walrus-cli`. For quilts, see `walrus-quilts`.
---

# Walrus Blob Lifecycle

> **Source constraint:** All information in this skill is sourced from the
> [Walrus managing blobs documentation](https://docs.wal.app/docs/walrus-client/managing-blobs)
> and the [large uploads guide](https://docs.wal.app/docs/large-uploads).
> When extending this skill, only pull from these sources.

Walrus blobs have finite lifetimes measured in epochs. This skill covers all post-storage operations: extending lifetimes, deleting, burning, sharing, setting attributes, and planning large data uploads.

All patterns in this skill are derived from:
- https://docs.wal.app/docs/walrus-client/managing-blobs
- https://docs.wal.app/docs/walrus-client/storing-blobs (lifetime options)
- https://docs.wal.app/docs/large-uploads

If unsure about any lifecycle operation, fetch the relevant page before answering.

---

## Reference files

### large-uploads — Large Data Upload Patterns
**Path:** `large-uploads.md`
**Load when:** planning uploads larger than 1 GiB, estimating storage costs for large datasets, managing concurrent upload memory, or building ingestion pipelines.
**Covers:** cost estimation, tuning for >1 GiB uploads, upload observability, pipeline state persistence, throughput management, memory overhead (4.5x blob size).

---

## Related skills

| Topic | Skill | Load when |
|-------|-------|-----------|
| Basic store/read | `walrus-cli` | Storing and reading blobs |
| HTTP API | `walrus-http-api` | Store/read via REST |
| TypeScript SDK | `walrus-ts-sdk` | Programmatic blob management |
| Quilts | `walrus-quilts` | Lifecycle operations on quilts (apply to whole quilt) |
| Encryption | `walrus-data-security` | Encrypting before storage |
| Move integration | `walrus-move-integration` | On-chain blob references |

---

## Routing guide

| Task | Load |
|------|------|
| Extend a blob's lifetime | Skill Content |
| Delete a deletable blob | Skill Content |
| Burn a blob's Sui object | Skill Content |
| Create or fund a shared blob | Skill Content |
| Set/get/remove blob attributes | Skill Content |
| Plan a large data upload (>1 GiB) | `large-uploads.md` |
| Estimate storage costs | `large-uploads.md` |
| Build an ingestion pipeline | `large-uploads.md` |
| Manage concurrent upload memory | `large-uploads.md` |

---

## Skill Content

### Key concepts

- **Epochs and lifetimes.** Blob storage duration is measured in epochs. A Mainnet epoch is 14 days. Maximum storage is 53 epochs (approximately 2 years). A blob expires at the beginning of its end epoch. Use `walrus info` or `GET /v1/info` on an aggregator to check the current epoch and duration.

- **Blob ID vs Sui object ID.** A **blob ID** is a URL-safe base64 string derived from the blob content (content-addressed). The same content always produces the same blob ID. A **Sui object ID** is a `0x...` hex string identifying the on-chain `Blob` object. Each upload creates a new object ID even for identical content. Use blob ID for reading content, object ID for lifecycle operations (extend, delete, share).

- **Deletable vs permanent.** Newly stored blobs are deletable by default. Deletable blobs can be removed by the Sui object owner before expiry. Permanent blobs cannot be deleted before expiry, even by the uploader.

- **What happens when a blob expires.** When a blob's end epoch is reached, the data becomes unavailable. There is no grace period. Storage nodes discard slivers. You must re-upload the data to make it available again. Expired blobs cannot be extended.

- **Wrapping blobs in shared objects.** A `Blob` object can be wrapped into any Sui shared object, allowing multiple parties to fund and extend it. The Walrus contract provides `shared_blob::SharedBlob` as one reference implementation of this pattern, but developers are free to create their own shared wrapper with custom logic (access control, metadata, etc.).

- **Storage pools.** A storage pool is the recommended way to manage blob storage going forward. Instead of purchasing storage resources per-blob, you fund a pool and blobs draw from it. This simplifies lifecycle management—blobs in a pool can be extended or renewed without individual storage resource tracking. Use `walrus store --storage-pool <POOL_ID>` to store against a pool.

- **Blob attributes.** Key-value metadata pairs stored on the blob's Sui object. Certain keys (`content-type`, `content-disposition`, and others) are recognized by the aggregator and returned as HTTP headers when reading by object ID.

- **Per-blob storage overhead.** Each blob incurs approximately 64 MB of metadata overhead regardless of size. For blobs smaller than ~10 MB, this metadata cost dominates. Use quilts for batching many small blobs to amortize this overhead.

### Extend blob lifetime

```sh
# Extend by blob Sui object ID
walrus extend --blob-obj-id <BLOB_OBJECT_ID>

# Extend with a specific new end epoch
walrus extend --blob-obj-id <BLOB_OBJECT_ID> --end-epoch <EPOCH>

# Extend a shared blob (requires --shared flag)
walrus extend --blob-obj-id <BLOB_OBJECT_ID> --shared
```

- The blob must not be expired.
- Both owned and shared blobs can be extended.
- Only the owner can extend owned blobs. Anyone can extend shared blobs.
- You need the blob's Sui object ID (not the blob ID).

### Delete blobs

```sh
# Delete by blob ID
walrus delete --blob-id <BLOB_ID>

# Delete by file (derives blob ID)
walrus delete --file <PATH>

# Delete by Sui object ID
walrus delete --object-id <SUI_ID>

# Skip confirmation prompt
walrus delete --blob-id <BLOB_ID> --yes

# Skip post-delete status check
walrus delete --blob-id <BLOB_ID> --yes --no-status-check
```

**Important caveats:**
- Only the owner of the Sui `Blob` object can delete a deletable blob.
- Delete reclaims the storage resource, which is reused automatically.
- Delete only removes slivers from current and future storage nodes. If another copy of the same blob exists (uploaded by someone else), the data remains accessible.
- Delete has limited utility for privacy. All blobs are public. Cached or previously downloaded copies are not affected.

### Burn blobs

Burning removes the blob's Sui object without deleting data from Walrus and without refunding storage:

```sh
# Burn a specific blob by object ID
walrus burn-blobs --object-ids <BLOB_OBJECT_ID>

# Burn all blob objects owned by the current wallet
walrus burn-blobs --all

# Burn all expired blob objects
walrus burn-blobs --all-expired
```

After burning, you cannot extend permanent blobs or extend/delete deletable blobs. You lose all control of the blob.

### Shared blobs

A blob can be wrapped into a Sui shared object so that anyone can fund and extend it. The Walrus contract provides `shared_blob::SharedBlob` as one reference implementation, but you can also wrap a `Blob` into your own custom shared object with whatever logic you need.

Using the built-in `SharedBlob` via the CLI:

```sh
# Share an existing blob using the built-in SharedBlob
walrus share --blob-obj-id <SUI_OBJ_ID>

# Fund an existing shared blob
walrus fund-shared-blob --blob-obj-id <SHARED_OBJ_ID> --amount <WAL_AMOUNT>

# Store and share in one step
walrus store myfile.png --epochs 10 --share
```

Built-in shared blobs:
- Can only contain permanent blobs
- Cannot be deleted before expiry
- Anyone can fund and extend them

For more control, consider wrapping the `Blob` in your own shared object (see `walrus-move-integration`).

### Storage pools

Storage pools are the recommended way to manage blob storage. Instead of purchasing individual storage resources per blob, you fund a pool and blobs draw from it.

```sh
# Store a blob using a storage pool
walrus store myfile.png --epochs 10 --storage-pool <POOL_ID>
```

Benefits:
- Simplifies lifecycle management—no individual storage resource tracking
- Blobs in a pool can be extended or renewed from the pool's funds
- Multiple blobs can share a single funding source

### Blob attributes

```sh
# Set attributes (multiple key-value pairs supported)
walrus set-blob-attribute <BLOB_OBJECT_ID> --attr "content-type" "image/png" --attr "creator" "myapp"

# Get attributes
walrus get-blob-attribute <BLOB_OBJECT_ID>

# Remove all attributes
walrus remove-blob-attribute <BLOB_OBJECT_ID>

# Remove specific keys
walrus remove-blob-attribute-fields <BLOB_OBJECT_ID> --keys "creator"
```

Recognized HTTP header attribute keys: `content-disposition`, `content-encoding`, `content-language`, `content-location`, `content-type`, `link`. These are returned as HTTP headers when reading by object ID.

### Rules

1. **Blobs expire at the beginning of the end epoch.** A blob with end epoch 314 becomes unavailable at the start of epoch 314. Plan accordingly.
2. **You cannot extend expired blobs.** Extend before expiration. Monitor expiration with `walrus blob-status`.
3. **Delete does not guarantee data removal.** Other copies of the same blob might exist. Caches and past storage nodes are not affected.
4. **Shared blobs must be permanent.** You cannot share a deletable blob. Convert to permanent first or store as permanent with `--share`.
5. **Burn is irreversible.** Burning a blob object forfeits all control with no storage refund. Use `--all-expired` to clean up expired blobs safely.
6. **Maximum blob size is approximately 13.6 GiB.** For large uploads, see the `large-uploads.md` reference file.

### Common mistakes

- **Extending with the blob ID instead of the object ID.** The `extend` command requires `--blob-obj-id` (Sui object ID), not the blob ID.
- **Trying to extend an expired blob.** Once expired, a blob cannot be extended. You must re-upload.
- **Expecting delete to make data completely unavailable.** If another user uploaded the same content, it persists. Encryption is the only reliable privacy mechanism.
- **Burning blobs that still have value.** Burning is permanent, forfeits storage, and provides no refund. Use `delete` to reclaim storage instead.
- **Sharing a deletable blob.** Shared blobs require permanent blobs. Store with `--permanent --share` or ensure the blob is permanent before sharing.
- **Storing with `--epochs 1` near an epoch boundary.** The blob expires almost immediately. Use generous epoch counts.
