---
name: walrus-cli
description: >
  Walrus CLI client for storing, reading, and managing blobs from the command line.
  Use when the user needs to run walrus store, walrus read, walrus blob-status,
  walrus extend, walrus delete, walrus share, or any other walrus CLI command.
  Also use for CLI installation, configuration (client_config.yaml), JSON mode for
  scripting, gas budgets, wallet configuration, and logging. For blob lifecycle
  management details, see `walrus-blob-lifecycle`. For quilts, see `walrus-quilts`.
---

# Walrus CLI

> **Source constraint:** All information in this skill is sourced from the
> [Walrus client documentation](https://docs.wal.app/docs/walrus-client/walrus-cli).
> When extending this skill, only pull from these sources.

The `walrus` CLI is the primary command-line tool for interacting with Walrus. It supports storing and reading blobs, checking blob status, managing blob lifecycle (extend, delete, burn, share), and working with quilts. All commands support JSON output for scripting.

All patterns in this skill are derived from:
- https://docs.wal.app/docs/walrus-client/walrus-cli
- https://docs.wal.app/docs/walrus-client/storing-blobs
- https://docs.wal.app/docs/walrus-client/reading-blobs
- https://docs.wal.app/docs/walrus-client/json-mode

If unsure about any CLI command, fetch the relevant page before answering.

---

## Related skills

| Topic | Skill | Load when |
|-------|-------|-----------|
| Blob lifecycle | `walrus-blob-lifecycle` | Extending, deleting, burning, sharing blobs; large uploads |
| Quilts | `walrus-quilts` | Batching small blobs with store-quilt/read-quilt |
| HTTP API | `walrus-http-api` | Using REST endpoints instead of the CLI |
| TypeScript SDK | `walrus-ts-sdk` | Programmatic access from TypeScript |
| Encryption | `walrus-data-security` | Encrypting data before storing |

---

## Skill Content

### Installation

Install with `suiup`:

```sh
curl -sSfL https://raw.githubusercontent.com/Mystenlabs/suiup/main/install.sh | sh
suiup install sui
suiup install walrus
```

Update to the latest version:

```sh
suiup update walrus
```

Switch to a specific network version:

```sh
# Correct syntax: walrus@<network>
suiup install walrus@mainnet
suiup install walrus@testnet
```

Verify with `walrus --help`. Each subcommand also supports `--help`. If you get `spawn walrus ENOENT` or `command not found`, the binary is not in your PATH. Re-run the `suiup` installer or add `~/.suiup/bin` to your PATH.

### Configuration

The CLI reads `client_config.yaml` from the current directory, `$XDG_CONFIG_HOME/walrus/`, `~/.config/walrus/`, or `~/.walrus/`. Download the latest config:

```sh
curl --create-dirs https://docs.wal.app/setup/client_config.yaml \
  -o ~/.config/walrus/client_config.yaml
```

Use `--config <PATH>` to specify a custom config location. Use `--wallet <PATH>` for a non-standard Sui wallet config. Use `--context <NAME>` to switch between multiple contexts in the config.

### Storing blobs

```sh
# Store a file for 5 epochs
walrus store myfile.png --epochs 5

# Store multiple files (glob patterns supported)
walrus store *.png --epochs 10

# Store as permanent (cannot be deleted before expiry)
walrus store myfile.png --epochs 30 --permanent

# Store as deletable (default)
walrus store myfile.png --epochs 10 --deletable

# Store using an upload relay
walrus store myfile.png --epochs 5 --upload-relay https://relay.example.com
```

#### Blob lifetime options

| Option | Description |
|--------|-------------|
| `--epochs <N>` | Number of epochs (max 53 = 2 years). Use `--epochs max` for maximum. |
| `--earliest-expiry-time <TIME>` | RFC 3339 date or relaxed format (for example, `2025-06-20 15:00:00`) |
| `--end-epoch <N>` | Specific end epoch number |

A blob expires at the beginning of its end epoch. Storing with `--epochs 1` right before an epoch change means near-immediate expiration.

#### Blob permanence

| Option | Behavior |
|--------|----------|
| `--deletable` | Owner can delete before expiry (default for new blobs) |
| `--permanent` | Cannot be deleted before expiry, even by the uploader |

#### Automatic optimizations

- If a permanent blob with the same content and sufficient lifetime exists, the client skips re-upload (override with `--force`).
- If a suitable storage resource exists in your wallet, it is reused instead of buying a new one.
- If the blob is already certified but deletable or has insufficient lifetime, the client skips sending encoded data and just collects the certificate.

### Reading blobs

```sh
# Check blob status by blob ID
walrus blob-status --blob-id <BLOB_ID>

# Check blob status by file (re-encodes to derive blob ID)
walrus blob-status --file myfile.png
# Status requests time out after 1s per node by default; raise it on slow links
walrus blob-status --blob-id <BLOB_ID> --timeout 5s

# Read a blob to stdout
walrus read <BLOB_ID>

# Read a blob to a file
walrus read <BLOB_ID> --out output.dat
```

#### Consistency checks

Starting with v1.37, the CLI uses a performant consistency check by default. Use `--strict-consistency-check` for the full check or `--skip-consistency-check` if the writer is known and trusted.

### JSON mode

All commands are available in JSON mode for scripting:

```sh
# Store via JSON mode
walrus json '{
  "config": "path/to/client_config.yaml",
  "command": {
    "store": {
      "files": ["README.md", "LICENSE"],
      "epochs": 100
    }
  }
}'

# Read via JSON mode
walrus json '{
  "command": {
    "read": {
      "blobId": "4BKcDC0Ih5RJ8R0tFMz3MZVNZV8b2goT6_JiEEwNHQo"
    }
  }
}'
```

JSON mode uses camelCase instead of kebab-case for option names (`blob-status` becomes `blobStatus`), with global options such as `config`, `context`, `wallet`, and `gasBudget` at the root beside `command`. Run `walrus json` with no argument to read the JSON from stdin (`echo '{...}' | walrus json`). Output is always JSON-formatted, suitable for piping to `jq`. On failure the CLI prints a human-readable error to stderr and exits non-zero.

Use `--json` with any standard command to get JSON output without full JSON mode:

```sh
walrus store myfile.png --epochs 5 --json
```

### Querying system info

```sh
# Show current epoch, pricing, and network parameters
walrus info

# Show with JSON output
walrus info --json
```

`walrus info` shows the current epoch number, epoch duration, price per storage unit, write fee, and maximum epochs ahead (53). Use this to verify pricing before large uploads. Subcommands narrow the output: `walrus info epoch`, `walrus info committee`, `walrus info bft`, and `walrus info coin` (the StructTag of the WAL coin for the configured context).

### Get WAL on Testnet

Storing costs WAL and every transaction costs SUI. On Testnet, exchange SUI for WAL at 1:1 with the CLI:

```sh
walrus get-wal --context testnet          # exchanges 0.5 SUI (500,000,000 MIST) by default
walrus get-wal --context testnet --amount 1000000000
walrus get-wal --exchange-id <OBJECT_ID>  # use a specific exchange object instead of the config's
```

`get-wal` works on Testnet only. On Mainnet the context declares no exchange objects and the command fails with `The object ID of an exchange object must be specified ... this command is only available on Testnet`. Acquire Mainnet WAL on an exchange that lists it or by transfer from an address that holds it; avoid third-party WAL faucets, which can hand out WAL from a package the client rejects.

### Transfer WAL between addresses

Walrus has no transfer command; Sui holds WAL as a coin type, so `sui client` moves it (when funding a publisher wallet, a shared team wallet, or an agent wallet):

```sh
# 1. Find the WAL coin objects (coinType ends in ::wal::WAL)
sui client balance ADDRESS --coin-type WAL_COIN_TYPE --with-coins --json
# 2. Transfer a whole coin object
sui client transfer --object-id WAL_COIN_ID --to RECIPIENT_ADDRESS --gas-budget 10000000
# Merge small coins first so one coin covers the amount
sui client merge-coin --primary-coin LARGEST_WAL_COIN_ID --coin-to-merge OTHER_WAL_COIN_ID
```

Sui transfers whole coin objects; to send an exact amount, split a coin in a programmable transaction block. The recipient also needs SUI for gas.

### Check network health

Intermittent upload failures usually mean storage nodes are unreachable, not that the client is misconfigured:

```sh
walrus health --committee            # one row per committee node, then a summary
walrus health --committee --sort-by status --json
walrus info bft                      # tolerated faults f, quorum 2f+1, write threshold n-f
walrus info committee                # shard count and committee
```

Faults are counted in shards, not nodes. With `n` shards and `f = (n - 1) / 3`, a write certifies when at least `n - f` shards respond and a read reconstructs with `n - 2f`. On a 1,000-shard network that is 667 shards for a write and 334 for a read. Healthy shards well above `n - f`: upload normally; just above: expect intermittent failures; below: writes cannot certify, wait rather than retry. `--active-set`, `--node-ids`, and `--node-urls` select other node sets; `--detail` adds per-node health.

### Switching between testnet and mainnet

The config file supports multiple contexts. Switch with:

```sh
# Use testnet context for a single command
walrus --context testnet store myfile.png --epochs 5

# Use mainnet context
walrus --context mainnet blob-status --blob-id <BLOB_ID>
```

Contexts are defined in `client_config.yaml` under the `contexts:` key. Each context specifies `system_object`, `staking_object`, `n_shards`, and `rpc_urls`.

### Contract parameters

These are the current Walrus contract parameters for each network:

| Parameter | Mainnet | Testnet |
|-----------|---------|---------|
| `system_object` | `0x2734a3f967c2dcfb4545a04a72e55432c461e78c1afca993ad642380e35429d6` | `0x6c2547cbf202cdf4e19a069a17dbb2fcc407e4ea1049614550ca1e8bd842e0c4` |
| `staking_object` | `0x10b9d30c28448939337279d46fa7e1a2b0e33d5a0e13f1096ee412e1ece41e55` | `0x954e63bc1b3b0523f25e7ba0d2b81fdf8fe08cc2eb53e7b73e87a37e5c4fc601` |
| `n_shards` | 1000 | 1000 |

These values are also available in the default `client_config.yaml` and via `walrus info --json`.

### Logging

```sh
# Enable trace-level logging
RUST_LOG=walrus=trace walrus info

# Default is info level; debug and trace give deeper insight
RUST_LOG=walrus=debug walrus store myfile.png --epochs 5
```

### Gas budget

Use `--gas-budget <MIST>` to set the maximum SUI the command can spend. If omitted, the gas budget is estimated automatically.

### Rules

1. **Always specify blob lifetime.** The `--epochs` argument is mandatory for `walrus store`. There is no default.
2. **All blobs are public.** Encrypt sensitive data before storing. See the `walrus-data-security` skill.
3. **Use JSON mode for automation.** The `walrus json` command and `--json` flag produce machine-parseable output for CI/CD pipelines and scripts.
4. **Blob ID is not object ID.** Blob ID identifies content. Sui object ID identifies the on-chain object. Some commands take one, some take the other. Check `--help` for each command.
5. **Storage pools are not a CLI feature yet.** They are a preview available through the Rust SDK and the Move contracts; `walrus store` has no pool flag. See `walrus-blob-lifecycle`.
6. **Check `walrus health --committee` before blaming the client.** Upload failures that come and go are usually unreachable storage nodes.
7. **Generate shell completions.** Run `walrus completion bash|zsh|fish` and place the output in the appropriate completions directory.

### Common mistakes

- **Storing with `--epochs 1` near an epoch boundary.** The blob expires at the beginning of its end epoch, which could be almost immediately. Use a generous epoch count.
- **Expecting delete to make data unavailable.** Delete only removes slivers from current and future storage nodes. If another copy of the same blob exists (uploaded by someone else), the data remains accessible. All blobs are public.
- **Forgetting `--json` in scripts.** Human-readable output is the default. Use `--json` or `walrus json` for parseable output in automation.
- **Running `walrus` without configuration.** The CLI needs `client_config.yaml`. Download it or specify with `--config`. Without it, you get an error about missing configuration.
- **Not having SUI/WAL tokens.** Write operations require SUI for gas and WAL for storage. On Testnet, request SUI from the Sui faucet (`sui client faucet`) and exchange it for WAL with `walrus get-wal`. On Mainnet, acquire WAL on an exchange or by transfer; `get-wal` does not work there.
- **`Cannot find gas coin for signer address` error.** The wallet has no SUI. Fund the address with SUI for gas fees.
- **Using `suiup switch walrus 1.48.1` (wrong syntax).** The correct syntax is `suiup install walrus@mainnet` or `suiup install walrus@testnet`. Version numbers are not used directly.
- **Confusing blob ID with Sui object ID.** Some commands take `--blob-id` (content hash, URL-safe base64), others take `--blob-obj-id` or `--object-id` (Sui object, `0x...` hex). Check `--help` for the specific command.
- **Testnet blobs disappearing quickly.** Testnet epoch duration is shorter than mainnet (14 days). If you store with low epochs, blobs expire faster than expected. Use `walrus info` to check current epoch duration.
