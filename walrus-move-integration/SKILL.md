---
name: walrus-move-integration
description: >
  Referencing and wrapping Walrus blobs in Sui Move smart contracts. Use when the user
  needs to wrap a Walrus Blob object in a custom Move struct, add Walrus as a Move
  dependency, read Blob fields (blob_id, size, end_epoch, certified_epoch) from Move,
  extend or delete blobs through walrus::system, share a blob with walrus::shared_blob,
  build a contract that depends on the Walrus package, or debug
  VMVerificationOrDeserializationError. Also use when the user asks about wrapped_blob.move,
  the Walrus Move package, or how to reference blobs from Move code.
---

# Walrus Move Integration

> **Source constraint:** All information in this skill is sourced from the
> [Walrus Move example page](https://docs.wal.app/docs/examples/move), the
> [Walrus Move example package](https://github.com/MystenLabs/walrus/tree/main/docs/examples/move/walrus_dep),
> and the [Walrus contracts](https://github.com/MystenLabs/walrus/tree/main/contracts/walrus).
> When extending this skill, only pull from these sources.

Every Walrus blob has a corresponding `Blob` object on Sui, defined in the `walrus::blob` module. It has the `key` and `store` abilities, so you can hold it, wrap it in your own objects, and transfer it from your own package. This enables patterns like NFTs backed by Walrus data, marketplaces that escrow blobs, and contracts that gate who can manage a blob.

All patterns in this skill are derived from:
- https://docs.wal.app/docs/examples/move
- https://github.com/MystenLabs/walrus/tree/main/docs/examples/move/walrus_dep
- https://github.com/MystenLabs/walrus/tree/main/contracts/walrus

If unsure about the Walrus Move API, check the source contracts before answering.

---

## Related skills

| Topic | Skill | Load when |
|-------|-------|-----------|
| Move fundamentals | `sui-move` | Writing Move code on Sui (abilities, TxContext, init) |
| Object model | `object-model` | Ownership types, wrapping, dynamic fields |
| Project setup | `sui-move-project` | Move.toml configuration, dependencies, `[environments]` |
| Blob lifecycle | `walrus-blob-lifecycle` | Extending, deleting, sharing blobs from the CLI |
| Confidentiality | `walrus-data-security` | Encrypting blob content before storage |

---

## Skill Content

### Key concepts

- **`walrus::blob::Blob`.** The on-chain representation of a blob: `public struct Blob has key, store`. Because it has `store`, you can embed it in your own object types and transfer it. The object holds metadata only (blob ID, size, encoding, registration and certification epochs, the backing `Storage` resource, deletability). The data itself lives on Walrus storage nodes; Move cannot read blob content.
- **Wrapping pattern.** A struct with `key` and its own `id: UID` that holds a `blob: Blob` field. Once wrapped, only the wrapping module's functions can reach the blob again, which gives your package control over where the blob can be transferred next and who can manage it.
- **Lifecycle through `walrus::system`.** Extending and deleting go through the shared `System` object. `walrus::blob` provides `burn` and the metadata functions.
- **Shared blobs.** `walrus::shared_blob` wraps a `Blob` in a `SharedBlob`, a shared object that works as a tip jar: anyone can add WAL and anyone can spend the stored funds to extend the blob.

### Move.toml setup

Declare the Walrus package as a git dependency. Use the 2024 edition; with it the Sui framework and the Move standard library are resolved automatically, so do not add a `Sui = { git = ... }` dependency or an `[addresses]` section (see `sui-move-project`).

```toml
[package]
name = "my_walrus_app"
edition = "2024"

[dependencies]
Walrus = { git = "https://github.com/MystenLabs/walrus.git", rev = "main", subdir = "contracts/walrus" }
```

Which `subdir` to use:

| Target | `subdir` | Notes |
|---|---|---|
| Development sources | `contracts/walrus` | What `main` is developed against |
| Mainnet-deployed sources | `mainnet-contracts/walrus` | The sources deployed on Sui Mainnet |
| Testnet-deployed sources | `testnet-contracts/walrus` | The sources deployed on Sui Testnet; the latest version is at the bottom of its `Move.lock` |

The [Network Reference](https://docs.wal.app/docs/network-reference#package-ids) lists the deployed package and object IDs. Pin `rev` to a commit for reproducible builds rather than a branch name.

The upstream example package (`docs/examples/move/walrus_dep/Move.toml`) still declares an explicit `Sui` git dependency, `[addresses]`, and `edition = "2024.beta"`; that is the older form. The Walrus contracts themselves pin `std` and `sui` explicitly with `implicit-dependencies = false` only because their simulation tests cannot resolve implicit dependencies, which does not apply to your package.

### Example: WrappedBlob

```move
module my_app::wrapped_blob;

use walrus::blob::Blob;

public struct WrappedBlob has key {
    id: UID,
    blob: Blob,
}

public fun wrap(blob: Blob, ctx: &mut TxContext): WrappedBlob {
    WrappedBlob { id: object::new(ctx), blob }
}
```

After wrapping, only this module's functions can reach the blob again. Add access control, metadata, or business logic around it.

### Read blob properties

The `walrus::blob` module exposes accessors for every `Blob` field:

| Accessor | Returns | Description |
|---|---|---|
| `object_id` | `ID` | The Sui object ID of the `Blob` object |
| `blob_id` | `u256` | The blob ID that identifies the data on Walrus |
| `size` | `u64` | The unencoded blob size in bytes |
| `encoding_type` | `u8` | The blob's erasure encoding |
| `registered_epoch` | `u32` | The Walrus epoch of registration |
| `certified_epoch` | `&Option<u32>` | The epoch of first certification; `none` while uncertified |
| `storage` | `&Storage` | The storage resource backing the blob |
| `end_epoch` | `u32` | The end epoch of the storage resource (exclusive) |
| `is_deletable` | `bool` | Whether the owner can delete the blob before expiry |
| `encoded_size` | `u64` | The encoded size for a given number of shards |

To check whether a blob is still live, read `certified_epoch` (stays `none` until Walrus certifies the blob) and compare `end_epoch` against the current epoch from the shared system object with `system.epoch()`.

### Manage the blob lifecycle

The `walrus::system` module exposes lifecycle functions on the shared `System` object:

- `extend_blob(system, blob, extended_epochs, payment)` extends storage by `extended_epochs` and draws the storage fee from a `Coin<WAL>`.
- `extend_blob_with_resource(system, blob, extension)` extends with a `Storage` resource you already own; it must match the blob's storage size and last longer.
- `delete_blob(system, blob)` consumes a deletable blob and returns its `Storage` resource for reuse.

`walrus::blob` provides `burn(blob)`, which destroys the `Blob` object without deleting the data from Walrus and without refunding storage, and metadata functions such as `insert_or_update_metadata_pair`, `remove_metadata_pair`, `add_metadata`, and `take_metadata`.

### Share a blob

`walrus::shared_blob` wraps a `Blob` in a `SharedBlob`:

- `new(blob, ctx)` shares the blob with zero funds.
- `new_funded(blob, funds, ctx)` shares it with an initial `Coin<WAL>` balance.
- `fund(shared_blob, coin)` adds WAL to the stored funds.
- `extend(shared_blob, system, extended_epochs, ctx)` extends the wrapped blob using the stored funds.

The CLI offers the same through `walrus share --blob-obj-id <SUI_OBJ_ID>` (see `walrus-blob-lifecycle`). You can also wrap a `Blob` in your own shared object with custom rules instead of using `SharedBlob`.

### Storage pools from Move

Storage pools (a preview feature) are exposed as public functions on `walrus::system`: `create_storage_pool`, `register_pooled_blob`, `certify_pooled_blob`, `delete_pooled_blob`, `extend_storage_pool`, `increase_storage_pool_capacity`, and the Move-only `create_storage_pool_with_storage`, `decrease_storage_pool_capacity_by_size`, `burn_expired_pooled_blob`, and `destroy`. `create_storage_pool` returns the pool by value, so your transaction decides whether to keep it owned, wrap it, or share it. See [storage pools](https://docs.wal.app/docs/system-overview/storage-pools) for the cost model.

### Build, test, and publish

```sh
sui move build
sui move test
sui client publish --skip-dependency-verification
```

The Walrus dependency is fetched from Git during the build.

### Rules

1. **`Blob` has `key` and `store`.** Wrap it, store it in your objects, and transfer it from your package.
2. **Use the 2024 edition and no explicit Sui dependency.** The framework is resolved automatically; a `Sui = { git = ... }` line and an `[addresses]` section are the pre-2024 form.
3. **Pick the `subdir` for the network you deploy to.** `contracts/walrus` for development, `mainnet-contracts/walrus` or `testnet-contracts/walrus` for the deployed sources. Pin `rev`.
4. **Wrapped blobs need their own UID.** The wrapper has `key` and `id: UID`; the blob keeps its own.
5. **Lifecycle goes through `walrus::system`.** Extend and delete take the shared `System` object; `burn` is on `walrus::blob`.
6. **Blob content is off-chain.** Move sees metadata only. Read content with the CLI, SDK, or HTTP API.

### Debugging `VMVerificationOrDeserializationError`

This error on publish or call means the package was built against contracts that do not match what is deployed. Check in order:

1. **Wrong `subdir` for the network.** Build against `testnet-contracts/walrus` for Testnet and `mainnet-contracts/walrus` (or `contracts/walrus` at a matching revision) for Mainnet.
2. **Wrong `rev`.** The commit must match a revision compatible with the deployed package.
3. **Stale `Move.lock`.** Delete it and rebuild: `rm Move.lock && sui move build`.
4. **`EWrongVersion` (abort code 1) from `system::inner_mut`.** Walrus uses versioned shared objects; a call through an old package ID aborts after an upgrade. The CLI and SDK refresh package IDs automatically; direct Move callers must use the current package ID from the [Network Reference](https://docs.wal.app/docs/network-reference#package-ids).

### Common mistakes

- **Saying `Blob` lacks `store`.** It has `key, store`; the docs' example embeds it in a `WrappedBlob` and escrows it.
- **Adding `Sui = { git = ..., rev = "testnet-v1.35.0" }` and `[addresses]`.** Not needed with `edition = "2024"`; mismatched framework pins cause confusing dependency resolution errors.
- **Using `edition = "2024.beta"`.** Use `2024`.
- **Trying to read blob content from Move.** Only metadata is on-chain.
- **Using `main` as `rev` in production.** Pin a commit.
- **Calling Walrus system functions with a stale package ID after an upgrade.** Query the current package ID; do not hardcode it.
