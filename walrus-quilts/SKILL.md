---
name: walrus-quilts
description: >
  Walrus quilts for batching many small blobs into a single storage unit. Use when
  the user needs to store multiple files as a quilt, retrieve individual blobs by
  QuiltPatchId or identifier, list patches in a quilt, or use quilt HTTP endpoints.
  Also use when optimizing storage costs for many small blobs. Covers both CLI
  (store-quilt, read-quilt, list-patches-in-quilt) and HTTP API quilt operations.
  For regular single-blob storage, see `walrus-cli` or `walrus-http-api`.
---

# Walrus Quilts

> **Source constraint:** All information in this skill is sourced from the
> [Walrus quilt CLI documentation](https://docs.wal.app/docs/walrus-client/quilts) and
> [quilt HTTP API documentation](https://docs.wal.app/docs/http-api/quilt-http-apis).
> When extending this skill, only pull from these sources.

A quilt batches multiple blobs into a single Walrus storage unit, significantly reducing overhead and cost for storing many small files. Individual blobs within a quilt are retrieved by their `QuiltPatchId` or identifier, not their standard `BlobId`.

All patterns in this skill are derived from:
- https://docs.wal.app/docs/walrus-client/quilts
- https://docs.wal.app/docs/http-api/quilt-http-apis

If unsure about any quilt operation, fetch the relevant page before answering.

---

## Related skills

| Topic | Skill | Load when |
|-------|-------|-----------|
| CLI basics | `walrus-cli` | General CLI installation, configuration, and single-blob operations |
| HTTP API basics | `walrus-http-api` | Single-blob HTTP store/read |
| Blob lifecycle | `walrus-blob-lifecycle` | Extending, deleting, sharing (applies to entire quilts) |

---

## Skill Content

### Key concepts

- **Quilt.** A single Walrus storage unit that contains multiple blobs. On-chain, a quilt is represented as one `Blob` Sui object. Storage cost is based on the total quilt size, not per-blob, which saves overhead for many small files.

- **QuiltPatchId.** A unique ID for each blob within a quilt. It is derived from the quilt contents, so a blob's `QuiltPatchId` changes if the quilt is recreated with different contents. This is not the same as a standard `BlobId`.

- **Identifier.** A human-readable name for a blob within a quilt (for example, the filename). Identifiers must be unique within a quilt and cannot start with `_`. The field name `_metadata` is reserved for Walrus-native metadata.

- **Lifecycle applies to the whole quilt.** You cannot delete, extend, or share individual blobs inside a quilt. Operations like `delete`, `extend`, and `share` apply to the entire quilt.

### CLI: Storing quilts

#### Store from directories with `--paths`

```sh
# Store all files from a directory recursively
walrus store-quilt --epochs 5 --paths ./my-assets/

# Store from multiple directories
walrus store-quilt --epochs 10 --paths ./images/ ./documents/ ./data.json
```

Filenames become identifiers. All identifiers must be unique within the quilt. Glob patterns are supported.

#### Store with custom identifiers and tags using `--blobs`

```sh
walrus store-quilt \
  --blobs '{"path":"photo.jpg","identifier":"walrus","tags":{"color":"grey","size":"medium"}}' \
         '{"path":"icon.png","identifier":"seal","tags":{"color":"grey","size":"small"}}' \
  --epochs 5
```

If `identifier` is omitted or `null`, the filename is used.

#### Lifetime options

Same as regular `walrus store`: `--epochs`, `--earliest-expiry-time`, or `--end-epoch`.

### CLI: Reading from quilts

#### Read by identifiers

```sh
walrus read-quilt --out ./downloads/ \
  --quilt-id <QUILT_BLOB_ID> --identifiers walrus.jpg another-walrus.jpg
```

#### Read by tags

```sh
# Download all blobs tagged with species=cat
walrus read-quilt --out ./downloads/ \
  --quilt-id <QUILT_BLOB_ID> --tag species cat
```

#### Read by QuiltPatchId

```sh
walrus read-quilt --out ./downloads/ \
  --quilt-patch-ids <PATCH_ID_1> <PATCH_ID_2>
```

#### List all patches in a quilt

```sh
walrus list-patches-in-quilt <QUILT_BLOB_ID>
```

Returns all patches with their identifiers and `QuiltPatchId` values.

### HTTP API: Storing quilts

Store quilts via multipart form upload to the publisher:

```sh
# Store 2 files with custom identifiers
curl -X PUT "$PUBLISHER/v1/quilts?epochs=5" \
  -F "contract-v2=@document.pdf" \
  -F "logo-2024=@image.png"
```

The form field name becomes the identifier. All regular blob query parameters (`epochs`, `permanent`, `deletable`, `send_object_to`) also work for quilts.

#### Store with Walrus-native metadata tags

```sh
curl -X PUT "$PUBLISHER/v1/quilts?epochs=5" \
  -F "quilt-manual=@document.pdf" \
  -F "logo-2025=@image.png" \
  -F '_metadata=[
    {"identifier": "quilt-manual", "tags": {"creator": "walrus", "version": "1.0"}},
    {"identifier": "logo-2025", "tags": {"type": "logo", "format": "png"}}
  ]'
```

#### Store response

The response includes the quilt `blobId` and individual `storedQuiltBlobs` with `quiltPatchId` values:

```json
{
  "blobStoreResult": {
    "newlyCreated": {
      "blobObject": {
        "id": "0xe6ac...bc02",
        "blobId": "6XUOE-Q5-nAXHRifN6n9nomVDtHZQbGuAkW3PjlBuKo",
        "size": 1782224,
        "storage": { "startEpoch": 103, "endEpoch": 104, "storageSize": 72040000 },
        "deletable": false
      },
      "cost": 12075000
    }
  },
  "storedQuiltBlobs": [
    { "identifier": "another_walrus.jpg", "quiltPatchId": "6XUOE-...BAQD..." },
    { "identifier": "walrus.jpg", "quiltPatchId": "6XUOE-...B0AB..." }
  ]
}
```

### HTTP API: Reading from quilts

```sh
# Read by QuiltPatchId
curl "$AGGREGATOR/v1/blobs/by-quilt-patch-id/<PATCH_ID>"

# Read by quilt ID + identifier
curl "$AGGREGATOR/v1/blobs/by-quilt-id/<QUILT_BLOB_ID>/walrus.jpg"
```

Only one blob per request is supported currently. Bulk retrieval from a quilt in a single request is not yet available.

#### Response headers

Both methods return raw blob bytes. Metadata is returned as HTTP headers:
- `X-Quilt-Patch-Identifier`: The blob's identifier within the quilt
- `ETag`: The patch ID or quilt ID for caching

### When to use quilts vs individual blobs

| Scenario | Recommendation |
|----------|---------------|
| Many small files (<10 MB each) | **Quilt.** Each individual blob has ~64 MB of per-blob metadata overhead. Quilts amortize this across all files. |
| Lots of small JSON documents | **Quilt.** Individual store calls for tiny blobs are very cost-inefficient. |
| One large file (>10 MB) | **Individual blob.** No benefit from quilting a single file. |
| Files that need independent lifecycle | **Individual blobs.** You cannot delete/extend individual files in a quilt. |
| Static website assets | **Quilt.** Walrus Sites uses quilts internally for this reason. |

The per-blob metadata overhead means storing a 1 KB JSON blob individually costs about the same as storing a 64 MB file. Quilts eliminate this by packing everything into one storage unit.

### Rules

1. **Identifiers must be unique within a quilt.** Duplicate identifiers cause the store operation to fail.
2. **Identifiers cannot start with `_`.** The `_metadata` field name is reserved for Walrus-native metadata.
3. **Lifecycle operations apply to the entire quilt.** You cannot delete, extend, or share individual blobs inside a quilt.
4. **QuiltPatchId is not a BlobId.** A blob's `QuiltPatchId` is specific to the quilt it belongs to. The same file content in a different quilt gets a different `QuiltPatchId`.
5. **Use quilts for many small files.** Quilts reduce per-blob overhead. For a single large file, use regular `walrus store`.
6. **Content-addressing still applies.** The same quilt content always produces the same quilt blob ID.

### Common mistakes

- **Trying to delete a single blob from a quilt.** You must delete the entire quilt. Individual blobs cannot be removed.
- **Using a BlobId to read from a quilt.** Blobs within a quilt are identified by `QuiltPatchId` or `identifier`, not standard `BlobId`.
- **Duplicate filenames across directories.** When using `--paths` with multiple directories, if two files have the same name, the identifiers collide and the store fails.
- **Expecting bulk HTTP reads.** Currently only one blob per HTTP request is supported for quilt reads.
- **Storing many small blobs individually instead of as a quilt.** This is the most common cost mistake. Each individual blob incurs ~64 MB of metadata overhead. A batch of 100 small JSON files stored individually costs roughly 100x more than quilting them together.
