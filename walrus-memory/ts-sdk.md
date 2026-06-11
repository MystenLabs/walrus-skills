# TypeScript SDK Reference

Source: https://docs.wal.app/walrus-memory/sdk

The `@mysten-incubation/memwal` package provides three entry points for integrating Walrus Memory into TypeScript applications.

## Entry points

| Entry point | Import | When to use |
|-------------|--------|-------------|
| `MemWal` | `@mysten-incubation/memwal` | **Recommended default.** Relayer handles embeddings, Seal, and storage. |
| `MemWalManual` | `@mysten-incubation/memwal/manual` | Client-managed embeddings and local Seal operations. Relayer never sees plaintext. |
| `withMemWal` | `@mysten-incubation/memwal/ai` | Vercel AI SDK middleware. Auto-recall before generation, auto-save after. |

## Installation

```bash
npm install @mysten-incubation/memwal
```

For `MemWalManual`, also install peer dependencies:
```bash
npm install @mysten/sui @mysten/seal @mysten/walrus
```

For `withMemWal`, also install:
```bash
npm install ai zod
```

## MemWal (default client)

### Configuration

```typescript
import { MemWal } from "@mysten-incubation/memwal";

const memwal = MemWal.create({
  key: "<ed25519-private-key-hex>",      // required
  accountId: "<memwal-account-object-id>", // required
  serverUrl: "https://relayer.memory.walrus.xyz", // optional, defaults to managed relayer
  namespace: "my-app",                    // optional, defaults to "default"
});
```

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `key` | `string` | Yes | | Ed25519 delegate private key in hex |
| `accountId` | `string` | Yes | | MemWalAccount object ID on Sui |
| `serverUrl` | `string` | No | `https://relayer.memory.walrus.xyz` | Relayer URL |
| `namespace` | `string` | No | `"default"` | Default namespace for memory isolation |

### Core methods

#### `remember(text, namespace?)`

Store a memory. Returns immediately with a job ID (async processing).

```typescript
const job = await memwal.remember("User prefers dark mode.");
// job = { job_id: "...", status: "running" }
```

#### `rememberAndWait(text, namespace?, opts?)`

Store and wait until the job completes.

```typescript
const result = await memwal.rememberAndWait("User prefers dark mode.");
// result = { id, job_id, blob_id, owner, namespace }
```

#### `waitForRememberJob(jobId, opts?)`

Poll a previously accepted job until `done` or `failed`.

```typescript
const result = await memwal.waitForRememberJob(job.job_id);
```

#### `rememberBulk(items)`

Submit up to 20 memories in one request. Returns accepted job IDs.

```typescript
const bulk = await memwal.rememberBulk([
  { text: "Fact 1", namespace: "demo" },
  { text: "Fact 2" },
]);
// bulk = { job_ids: [...], total: 2, status: "running" }
```

#### `rememberBulkAndWait(items, opts?)`

Submit bulk and wait for all jobs to complete.

#### `recall(params)`

Search for memories by natural language query.

```typescript
const result = await memwal.recall({
  query: "What does this user prefer?",
  limit: 5,           // default: 10, alias: topK
  namespace: "my-app", // optional, uses default
  maxDistance: 0.5,    // optional, filters weak matches
});

for (const memory of result.results) {
  console.log(memory.text, memory.distance);
  // distance is cosine distance: lower = more similar
}
```

**RecallParams:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `query` | `string` | required | Natural language search query |
| `limit` | `number` | `10` | Max results to return |
| `topK` | `number` | | Alias for limit (wins when both set) |
| `namespace` | `string` | client default | Memory space to search |
| `maxDistance` | `number` | | Drop results with distance >= this value |

#### `analyze(text, namespace?)`

Extract memorable facts from text using an LLM, then store each as a separate memory.

```typescript
const analyzed = await memwal.analyze(
  "I live in Hanoi, prefer dark mode, and usually work late at night."
);
// analyzed = { job_ids: [...], facts: [...], fact_count: 3, status: "pending" }
```

Use `analyzeAndWait()` to wait for all fact jobs to complete.

#### `restore(namespace, limit?)`

Rebuild missing vector entries from Walrus for a namespace. Incremental and idempotent.

```typescript
const result = await memwal.restore("my-app", 50);
// result = { restored: 12, skipped: 38, total: 50, namespace, owner }
```

#### `health()`

Check relayer connectivity. Does not require authentication.

```typescript
await memwal.health();
```

#### `compatibility()`

Fetch and validate relayer version metadata from `/version`. Raises `MemWalCompatibilityError` if the SDK/relayer pair is unsupported.

### Lower-level methods

| Method | Description |
|--------|-------------|
| `rememberManual({ blobId, vector, namespace? })` | Register a pre-uploaded blob with a pre-computed vector |
| `recallManual({ vector, limit?, namespace? })` | Search with a pre-computed vector (returns blob IDs, no decryption) |
| `embed(text)` | Generate an embedding vector without storing |
| `getPublicKeyHex()` | Get hex-encoded public key for the delegate key |

## MemWalManual

Client-side encryption and embedding. The relayer never sees plaintext.

```typescript
import { MemWalManual } from "@mysten-incubation/memwal/manual";
```

- `rememberManual(text, namespace?)` — embed locally, Seal encrypt locally, send encrypted payload to relayer
- `recallManual(query, limit?, namespace?)` — embed locally, search via relayer, download from Walrus, decrypt locally
- `restore(namespace, limit?)` — same as MemWal.restore()

Requires `@mysten/sui`, `@mysten/seal`, and `@mysten/walrus` as peer dependencies.

## withMemWal (Vercel AI SDK middleware)

Wraps a Vercel AI SDK model with automatic memory recall and save.

```typescript
import { generateText } from "ai";
import { withMemWal } from "@mysten-incubation/memwal/ai";
import { openai } from "@ai-sdk/openai";

const model = withMemWal(openai("gpt-4o"), {
  key: process.env.MEMWAL_PRIVATE_KEY!,
  accountId: process.env.MEMWAL_ACCOUNT_ID!,
  serverUrl: process.env.MEMWAL_SERVER_URL,
  namespace: "chatbot-prod",
  maxMemories: 5,    // max memories injected per request (default: 5)
  autoSave: true,    // auto-save facts from conversation (default: true)
  minRelevance: 0.3, // minimum similarity to include (default: 0.3)
});

const result = await generateText({
  model,
  messages: [{ role: "user", content: "What do you know about me?" }],
});
```

**Before generation:** reads last user message, runs `recall()`, filters by `minRelevance`, injects as system message.

**After generation:** optionally runs `analyze()` on user message, saves facts asynchronously.

## Account management

```typescript
import {
  createAccount,
  addDelegateKey,
  removeDelegateKey,
  generateDelegateKey,
} from "@mysten-incubation/memwal/account";
```

| Function | Description |
|----------|-------------|
| `generateDelegateKey()` | Generate new Ed25519 keypair (returns `privateKey`, `publicKey`, `suiAddress`) |
| `createAccount(opts)` | Create a MemWalAccount onchain (one per Sui address) |
| `addDelegateKey(opts)` | Add a delegate key to an account (owner only, max 20) |
| `removeDelegateKey(opts)` | Remove a delegate key from an account (owner only) |

## Utility functions

```typescript
import { delegateKeyToSuiAddress, delegateKeyToPublicKey } from "@mysten-incubation/memwal";
```

| Function | Description |
|----------|-------------|
| `delegateKeyToSuiAddress(privateKeyHex)` | Derive Sui address from a delegate private key |
| `delegateKeyToPublicKey(privateKeyHex)` | Get 32-byte public key from a delegate private key |
