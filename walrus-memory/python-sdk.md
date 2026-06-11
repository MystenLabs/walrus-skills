# Python SDK Reference

Source: https://docs.wal.app/walrus-memory/python-sdk

The `memwal` PyPI package mirrors the TypeScript `MemWal` client: same relayer, same Ed25519 auth, same methods. Built for the Python AI/ML ecosystem.

## Entry points

| Entry point | Import | When to use |
|-------------|--------|-------------|
| `MemWal` | `from memwal import MemWal` | **Recommended default.** Async-native. |
| `MemWalSync` | `from memwal import MemWalSync` | Scripts, notebooks, non-async apps. Same API, runs via `asyncio.run()`. |
| `with_memwal_langchain` | `from memwal import with_memwal_langchain` | LangChain middleware. |
| `with_memwal_openai` | `from memwal import with_memwal_openai` | OpenAI SDK middleware. |

## Installation

```bash
pip install memwal                # core
pip install memwal[langchain]     # + LangChain middleware
pip install memwal[openai]        # + OpenAI SDK middleware
pip install memwal[all]           # everything
```

Requires Python 3.9+. Core dependencies: `httpx`, `PyNaCl` (Ed25519 signing).

## Configuration

```python
import os
from memwal import MemWal

memwal = MemWal.create(
    key=os.environ["MEMWAL_PRIVATE_KEY"],
    account_id=os.environ["MEMWAL_ACCOUNT_ID"],
    env="prod",          # or "staging", or pass server_url directly
    namespace="demo",
)
```

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `key` | `str` | Yes | | Ed25519 delegate private key in hex |
| `account_id` | `str` | Yes | | MemWalAccount object ID on Sui |
| `server_url` | `str` | No | `http://localhost:8000` | Explicit relayer URL (wins over `env`) |
| `namespace` | `str` | No | `"default"` | Default namespace |
| `env` | `str` | No | | Preset: `"prod"` or `"staging"` |

### Environment presets

| `env` | Relayer URL |
|-------|-------------|
| `prod` | `https://relayer.memory.walrus.xyz` |
| `staging` | `https://relayer-staging.memory.walrus.xyz` |

## Core methods

### `remember_and_wait(text, namespace?)`

Store a memory and wait for completion.

```python
await memwal.remember_and_wait("I live in Hanoi and prefer dark mode.")
```

### `recall(params)`

Search for memories. Use `RecallParams` for structured queries.

```python
from memwal import RecallParams

result = await memwal.recall(RecallParams(
    query="What do we know about this user?",
    limit=5,
    max_distance=0.5,
))
for memory in result.results:
    print(memory.text, f"(distance: {memory.distance:.3f})")
```

### `analyze(text, namespace?)`

Extract facts from text and store each separately.

```python
analyzed = await memwal.analyze("I live in Hanoi and work as an engineer.")
print(analyzed.facts)
```

### `ask(query, namespace?)`

Recall + LLM reasoning. Query your memories and get an AI-generated answer.

```python
answer = await memwal.ask("What city does the user live in?")
print(answer.answer)
```

### `restore(namespace, limit?)`

Rebuild vector index from Walrus.

```python
result = await memwal.restore("demo", limit=50)
print(f"Restored {result.restored}, skipped {result.skipped}")
```

### `health()`

Check relayer connectivity.

```python
await memwal.health()
```

### Cleanup

Always close the client when done:

```python
await memwal.close()
```

## Sync client

```python
from memwal import MemWalSync

memwal = MemWalSync.create(
    key=os.environ["MEMWAL_PRIVATE_KEY"],
    account_id=os.environ["MEMWAL_ACCOUNT_ID"],
    env="prod",
    namespace="demo",
)

memwal.remember_and_wait("User prefers dark mode.")
result = memwal.recall(RecallParams(query="preferences"))
memwal.close()
```

## AI middleware

### LangChain

```python
from memwal import with_memwal_langchain

model = with_memwal_langchain(
    llm,
    key=os.environ["MEMWAL_PRIVATE_KEY"],
    account_id=os.environ["MEMWAL_ACCOUNT_ID"],
    env="prod",
    namespace="chatbot",
    max_memories=5,
    auto_save=True,
    min_relevance=0.3,
)
```

### OpenAI SDK

```python
from memwal import with_memwal_openai

client = with_memwal_openai(
    openai_client,
    key=os.environ["MEMWAL_PRIVATE_KEY"],
    account_id=os.environ["MEMWAL_ACCOUNT_ID"],
    env="prod",
)
```

Both middleware wrappers patch async and sync paths. They recall before generation and optionally save facts after.

## Colab notebook

A runnable notebook covering installation, configuration, all core methods, middleware, and troubleshooting is available at:
https://colab.research.google.com/drive/1SaKjkSp0DXnM_nktWSiEC-l9qGtVr6ph
