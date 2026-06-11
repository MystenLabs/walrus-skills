---
name: walrus-memory
description: >
  Walrus Memory (MemWal) — persistent, portable, encrypted memory for AI agents.
  Use when the user needs to give an AI agent persistent memory across sessions
  and apps, integrate the @mysten-incubation/memwal TypeScript SDK or Python
  memwal SDK, set up the Walrus Memory MCP server for Cursor/Claude/Codex,
  configure remember/recall/analyze/restore operations, manage memory spaces
  and namespaces, set up delegate keys and accounts, self-host the relayer,
  or use withMemWal AI middleware (Vercel AI SDK, LangChain, OpenAI SDK).
  Also use when the user asks about MemWal, Walrus Memory, agent memory,
  memory spaces, or the memwal-mcp package.
---

# Walrus Memory

> **Source constraint:** All information in this skill is sourced from the
> [Walrus Memory documentation](https://docs.wal.app/walrus-memory) and the
> [MystenLabs/MemWal repository](https://github.com/MystenLabs/MemWal).
> When extending this skill, only pull from these sources.

Walrus Memory gives AI agents persistent, portable memory built on Walrus (decentralized storage) and Sui (onchain access control). Memories are Seal-encrypted, stored as blobs on Walrus, and searchable via vector embeddings. The owner controls who can read and write, with delegate keys enabling shared agent access.

Common integration mistakes:

1. **Forgetting to generate an account ID and delegate key.** You need both before the SDK works. Generate them at [memory.walrus.xyz](https://memory.walrus.xyz).
2. **Not awaiting async remember jobs.** `remember()` returns immediately with a job ID. The upload runs in the background. Use `waitForRememberJob()` or `rememberAndWait()` to confirm storage.
3. **Omitting the namespace.** Without it, everything goes to `"default"`. Set a namespace per product surface to isolate memories.
4. **Using the wrong relayer URL.** Production (mainnet) is `https://relayer.memory.walrus.xyz`. Staging (testnet) is `https://relayer-staging.memory.walrus.xyz`.

---

## Reference files

### ts-sdk — TypeScript SDK Reference
**Path:** `ts-sdk.md`
**Load when:** writing TypeScript code with `@mysten-incubation/memwal`, using `MemWal`, `MemWalManual`, or `withMemWal`, calling `remember`/`recall`/`analyze`/`restore`, or debugging SDK errors.
**Covers:** Installation, three entry points (MemWal, MemWalManual, withMemWal), configuration, full API (remember, rememberAndWait, rememberBulk, recall with RecallParams, analyze, restore, health), lower-level methods, account management, AI middleware integration with Vercel AI SDK.

### python-sdk — Python SDK Reference
**Path:** `python-sdk.md`
**Load when:** writing Python code with the `memwal` PyPI package, using `MemWal`, `MemWalSync`, or `with_memwal_langchain`/`with_memwal_openai` middleware.
**Covers:** Installation, async vs sync clients, `env` presets (prod/staging), `RecallParams`, `ask` method, LangChain and OpenAI middleware, Colab notebook.

### mcp — MCP Server Reference
**Path:** `mcp.md`
**Load when:** setting up Walrus Memory in Cursor, Claude Desktop, Claude Code, Codex, or another MCP client. Also when configuring the memwal-mcp package, debugging login/auth issues, or using Streamable HTTP transport.
**Covers:** Installation via npx, login flow, client configs (Cursor, Claude Desktop, Claude Code, Codex), six MCP tools, auth-required mode, default namespace, environment switching, Streamable HTTP setup.

---

## Related skills

| Topic | Skill | Load when |
|-------|-------|-----------|
| Walrus blob storage | `walrus-overview` | Understanding Walrus itself |
| Seal encryption | `walrus-data-security` | How Seal encryption works under the hood |
| Sui Move contracts | `sui-move` | Understanding the MemWal Move module |
| Troubleshooting | `walrus-troubleshooting` | General Walrus error messages |

---

## Routing guide

| Task | Load |
|------|------|
| Integrate memory in a TypeScript app | `ts-sdk.md` |
| Integrate memory in a Python app | `python-sdk.md` |
| Set up MCP for Cursor / Claude / Codex | `mcp.md` |
| Understand what Walrus Memory is | Skill Content below |
| Choose an integration path | Skill Content below |
| Manage accounts and delegate keys | `ts-sdk.md` (account management section) |
| Self-host the relayer | Skill Content below + relayer docs |
| Use AI middleware (Vercel AI SDK) | `ts-sdk.md` (withMemWal section) |
| Use AI middleware (LangChain / OpenAI) | `python-sdk.md` |

---

## Skill Content

### Key concepts

- **Memory space.** The isolated unit of storage, uniquely defined by `owner address + namespace + app ID (package ID)`. Memories in one space never mix with another. Use namespaces to separate concerns (for example, `personal`, `work`, `research`).

- **Four core operations.**
  - **Remember** — store a memory with semantic embedding. Async: returns a job ID immediately.
  - **Recall** — search for memories by natural language query. Returns matches ranked by cosine distance.
  - **Analyze** — extract structured facts from text using an LLM. Each fact is stored as a separate memory.
  - **Ask** — recall + LLM reasoning. Query your memories and get an AI-generated answer.

- **Owner and delegates.** The owner is the Sui wallet that created the account. Delegates are Ed25519 keypairs granted access by the owner. Delegates can store, recall, and decrypt, but cannot manage keys or transfer ownership. Access is enforced by a Move smart contract on Sui.

- **Encryption.** All memory content is Seal-encrypted before reaching Walrus. Only the owner and authorized delegates can decrypt. The relayer handles encryption by default, or you can use the manual client flow for full client-side control.

- **Relayer.** A backend service (Rust + TypeScript sidecar) that handles embedding, encryption, Walrus upload, and vector search behind a REST API. The managed relayer is provided by Walrus Foundation. You can also self-host.

- **Restore.** If the vector database is lost, the restore flow rebuilds it from Walrus by rediscovering blobs on-chain, decrypting, re-embedding, and re-indexing. Walrus is the permanent source of truth.

### Architecture

```
Your App → SDK → Relayer → { Seal encrypt, Walrus upload, pgvector index }
                         ← { pgvector search, Walrus download, Seal decrypt }
```

Six components:
1. **SDK** (TypeScript or Python) — signs requests, calls relayer
2. **Relayer** (Rust + TS sidecar) — embedding, encryption, storage, search
3. **Smart contract** (`memwal::account` on Sui) — ownership, delegate keys, Seal access
4. **Indexer** — syncs contract events to PostgreSQL for fast lookups
5. **Walrus** — decentralized storage for encrypted blobs
6. **PostgreSQL + pgvector** — vector embeddings for semantic search

### Choose your integration path

| Path | When to use |
|------|-------------|
| **MemWal (default SDK)** | Most teams. Relayer handles everything. |
| **MemWalManual** | You need client-side encryption. Relayer never sees plaintext. |
| **withMemWal (AI middleware)** | You use Vercel AI SDK and want auto-recall + auto-save. |
| **Python SDK** | Python apps. Same relayer, same auth, mirrors TypeScript API. |
| **MCP server** | Give Cursor/Claude/Codex memory via MCP tools. No custom code. |
| **Self-hosted relayer** | Full control of the trust boundary. Your infra, your credentials. |

### Account setup

1. Go to [memory.walrus.xyz](https://memory.walrus.xyz) (mainnet) or [staging.memory.walrus.xyz](https://staging.memory.walrus.xyz) (testnet)
2. Connect your Sui wallet
3. Create a Walrus Memory account (one per Sui address)
4. Generate a delegate key (Ed25519 keypair)
5. Use the `key` (private key hex) and `accountId` (Sui object ID) in the SDK

### Relayer endpoints

| Network | Relayer URL | Dashboard |
|---------|-------------|-----------|
| **Production** (Mainnet) | `https://relayer.memory.walrus.xyz` | `https://memory.walrus.xyz` |
| **Staging** (Testnet) | `https://relayer-staging.memory.walrus.xyz` | `https://staging.memory.walrus.xyz` |

### Contract IDs

| Network | Package ID | Registry ID |
|---------|-----------|-------------|
| **Mainnet** | `0xcee7a6fd8de52ce645c38332bde23d4a30fd9426bc4681409733dd50958a24c6` | `0x0da982cefa26864ae834a8a0504b904233d49e20fcc17c373c8bed99c75a7edd` |
| **Testnet** | `0xcf6ad755a1cdff7217865c796778fabe5aa399cb0cf2eba986f4b582047229c6` | `0xe80f2feec1c139616a86c9f71210152e2a7ca552b20841f2e192f99f75864437` |

### Rate limits (managed relayer)

| Scope | Limit |
|-------|-------|
| Per account (burst) | 60 points/minute |
| Per account (sustained) | 500 points/hour |
| Per delegate key | 30 points/minute |
| Storage quota | 1 GB per account |

Point costs: `analyze` = 10, `remember` = 5, `restore` / `remember/manual` = 3, `ask` = 2, `recall` = 1.

### Rules

1. **Generate account ID and delegate key first.** The SDK will not work without them. Use the dashboard at `memory.walrus.xyz`.
2. **Set a namespace explicitly.** Without one, all memories go to `"default"`. Separate by product surface, environment, or domain.
3. **`remember()` is async.** It returns a job ID immediately. Use `rememberAndWait()` or poll with `waitForRememberJob()` to confirm storage.
4. **Use the correct relayer URL for your network.** Mainnet: `relayer.memory.walrus.xyz`. Testnet: `relayer-staging.memory.walrus.xyz`.
5. **Delegate keys are not wallets.** They are Ed25519 keypairs authorized by the owner. They can store and recall but cannot manage the account.
6. **All content is encrypted.** The relayer encrypts with Seal by default. Use `MemWalManual` if you need the relayer to never see plaintext.
7. **Walrus is the source of truth.** If the database is lost, `restore()` rebuilds it from Walrus. The database is an operational cache.
8. **Max 20 delegate keys per account.**

### Common mistakes

- **Calling `recall` immediately after `remember` without waiting.** The remember job is async. Wait for it to complete before recalling, or the memory will not appear in results.
- **Using `remember` for many small facts from a paragraph.** Use `analyze` instead. It extracts individual facts and stores each one separately for more precise recall.
- **Hardcoding the relayer URL without matching the network.** Mainnet accounts do not work on the staging relayer and vice versa.
- **Not closing the Python client.** Call `await memwal.close()` when done to clean up the HTTP client.
- **Running MCP login in a non-interactive shell.** The `login` command opens a browser. Run it in a real terminal with TTY, not inside an IDE's embedded terminal.
- **Expecting `restore()` to process all blobs at once.** It has a configurable `limit` (default: 10). Call it multiple times to restore a large memory space.
