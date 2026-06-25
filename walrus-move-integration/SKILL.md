---
name: walrus-move-integration
description: >
  Referencing and wrapping Walrus blobs in Sui Move smart contracts. Use when the user
  needs to wrap a Walrus Blob object in a custom Move struct, add Walrus as a Move
  dependency, build a contract that depends on the Walrus package, or integrate on-chain
  logic with Walrus blob storage. Also use when the user asks about wrapped_blob.move,
  the Walrus Move package, or how to reference blobs from Move code.
---

# Walrus Move Integration

> **Source constraint:** All information in this skill is sourced from the
> [Walrus Move example](https://github.com/MystenLabs/walrus/tree/main/docs/examples/move/walrus_dep)
> and the [Walrus documentation](https://docs.wal.app). When extending this skill,
> only pull from these sources.

Walrus blobs are represented on-chain as `walrus::blob::Blob` Sui objects. You can reference, wrap, or compose with these objects in your own Move contracts. This enables patterns like NFTs backed by Walrus-stored media, access-controlled document registries, or any on-chain logic that needs to track off-chain blob data.

All patterns in this skill are derived from:
- https://github.com/MystenLabs/walrus/tree/main/docs/examples/move/walrus_dep
- https://github.com/MystenLabs/walrus/tree/main/contracts/walrus

If unsure about the Walrus Move API, check the source contracts before answering.

---

## Related skills

| Topic | Skill | Load when |
|-------|-------|-----------|
| Move fundamentals | `sui-move` | Writing Move code on Sui (abilities, TxContext, init) |
| Object model | `object-model` | Ownership types, wrapping, dynamic fields |
| Project setup | `sui-move-project` | Move.toml configuration, dependencies |
| Blob lifecycle | `walrus-blob-lifecycle` | Extending, deleting, sharing blobs |
| Encryption | `walrus-data-security` | Encrypting blob content before storage |

---

## Skill Content

### Key concepts

- **`walrus::blob::Blob`.** The core Move type representing a Walrus blob on-chain. It has the `key` ability (it is a Sui object) but not `store`, which means it cannot be placed inside other objects using direct field embedding in all contexts. Check the latest contract source for current abilities.

- **Wrapping pattern.** Create a custom struct with `key` ability that contains a `Blob` field. This "wraps" the blob, giving your contract control over access and transfer. The wrapper struct needs its own `UID`.

- **Wrapping blobs in shared objects.** A `Blob` can be wrapped into any Sui shared object you define, enabling multiple parties to fund and extend it. The Walrus contract provides `shared_blob::SharedBlob` as a reference implementation ([source](https://github.com/MystenLabs/walrus/tree/main/contracts/walrus/sources/system/shared_blob.move)), but you can create your own wrapper with custom access control, metadata, or business logic.

### Move.toml setup

Add the Walrus package as a dependency in your `Move.toml`. The correct `subdir` and `rev` depend on whether you target **testnet** or **mainnet**:

#### Testnet

```toml
[package]
name = "my_walrus_app"
edition = "2024"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "testnet-v1.35.0" }
Walrus = { git = "https://github.com/MystenLabs/walrus.git", rev = "testnet", subdir = "testnet-contracts/walrus" }

[addresses]
sui = "0x2"
my_walrus_app = "0x0"
```

#### Mainnet

```toml
[package]
name = "my_walrus_app"
edition = "2024"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "mainnet-v1.35.0" }
Walrus = { git = "https://github.com/MystenLabs/walrus.git", rev = "main", subdir = "contracts/walrus" }

[addresses]
sui = "0x2"
my_walrus_app = "0x0"
```

**Critical notes:**
- Use `edition = "2024"`, not `"2024.beta"`. The beta edition is outdated.
- For testnet, use `subdir = "testnet-contracts/walrus"` (not `contracts/walrus`). The testnet contracts are published from a different directory.
- If you also need the WAL token type, add: `Wal = { git = "https://github.com/MystenLabs/walrus.git", rev = "testnet", subdir = "testnet-contracts/wal" }`
- Pin `rev` to a specific commit hash for reproducible builds rather than using branch names.
- The Sui framework `rev` must be compatible with the Walrus package's Sui dependency. Check the Walrus repo's `Move.toml` for the expected version.

### Example: WrappedBlob

The canonical example wraps a `Blob` inside a custom object:

```move
module my_app::wrapped_blob {
    use walrus::blob::Blob;

    public struct WrappedBlob has key {
        id: UID,
        blob: Blob,
    }

    public fun wrap(blob: Blob, ctx: &mut TxContext): WrappedBlob {
        WrappedBlob { id: object::new(ctx), blob }
    }
}
```

This gives your module ownership of the blob. You can add access control, metadata, or business logic around it.

### Building and testing

```sh
# Build the project
sui move build

# Run tests
sui move test
```

The Walrus dependency is fetched from Git during build. Ensure network access is available.

### Rules

1. **Pin the Walrus dependency revision.** Use a specific commit hash or tag in `Move.toml` rather than `main` for reproducible builds.
2. **Match the Sui framework version.** The Sui framework `rev` in your `Move.toml` must be compatible with the Walrus package's Sui dependency. Check the Walrus repo's `Move.toml` for the expected Sui version.
3. **Wrapped blobs need their own UID.** A wrapper struct must have `key` ability and its own `id: UID` field, not just the blob's UID.
4. **Lifecycle operations go through the Walrus system contract.** To extend, delete, or certify blobs, interact with the Walrus system contract, not the `Blob` struct directly.
5. **Blob content is off-chain.** The `Blob` Move object contains metadata (blob ID, size, epoch info). The actual data lives on Walrus storage nodes. To read content, use the CLI, SDK, or HTTP API.

### Debugging `VMVerificationOrDeserializationError`

This error occurs when publishing or calling a contract that depends on Walrus. Common causes:

1. **Wrong `subdir` for the network.** Testnet contracts are in `testnet-contracts/walrus`, not `contracts/walrus`. Using the wrong subdir means you build against a different package than what is deployed on-chain.
2. **Wrong `rev`.** The commit must match a revision where the contracts are compatible with the deployed on-chain package. For testnet, use the `testnet` branch or a pinned commit from that branch.
3. **Stale `published-at` or `original-id` in Move.lock.** Delete the `Move.lock` file and rebuild.
4. **Package version mismatch.** Walrus uses versioned shared objects. If you call a function using an old package ID, you get `EWrongVersion` (abort code 1) from `system::inner_mut`. The Walrus SDK/CLI auto-refreshes package IDs, but custom implementations must handle this.

To find the current package IDs:
- Check `walrus info` output or the [available networks page](https://docs.wal.app/docs/system-overview/available-networks)
- The client auto-infers package IDs from `system_object` and `staking_object`

### SharedBlob API (reference implementation)

The `walrus::shared_blob` module is one example of wrapping a `Blob` in a shared object. Developers can freely wrap a `Blob` into their own shared object with custom logic instead.

```move
// Create a shared blob from an owned Blob (must be permanent)
walrus::shared_blob::new(blob: Blob, ctx: &mut TxContext): SharedBlob

// Extend a shared blob's lifetime (anyone can call)
walrus::shared_blob::extend(shared_blob: &mut SharedBlob, ...)
```

The built-in `SharedBlob` is a shared Sui object. Anyone can fund and extend it. It requires a permanent blob.

### Common mistakes

- **Trying to read blob content from Move.** Move contracts only see blob metadata (ID, size, epoch, storage info). Actual blob data is stored off-chain on Walrus storage nodes.
- **Using `main` as the dependency rev in production.** The `main` branch can change at any time. Pin to a specific commit for stable builds.
- **Using `contracts/walrus` subdir for testnet.** Testnet uses `testnet-contracts/walrus`. This is the number one cause of `VMVerificationOrDeserializationError` when publishing to testnet.
- **Using `edition = "2024.beta"`.** Use `edition = "2024"`. The beta edition is outdated and can cause build errors.
- **Mismatched Sui framework versions.** If your Sui framework version does not match what Walrus expects, the build fails with confusing dependency resolution errors. Check the Walrus repo's `Move.toml`.
- **Forgetting to add the `Walrus` dependency address.** The `walrus` address is provided by the Walrus package dependency. You do not need to add it to `[addresses]`.
- **Calling Walrus system functions with a stale package ID.** After a Walrus upgrade, the old package ID no longer works. The SDK/CLI handle this automatically, but direct Move contract calls must use the current package. Query the system object to find the latest package ID.
