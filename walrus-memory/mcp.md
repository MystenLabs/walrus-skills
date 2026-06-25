# MCP Server Reference

Source: https://docs.wal.app/walrus-memory/mcp

The Walrus Memory MCP server gives MCP-aware AI clients (Cursor, Claude Desktop, Claude Code, Codex, Antigravity) access to persistent agent memory through eight built-in tools. No custom SDK code needed.

## Quick start

### 1. Login (one-time, from a real terminal)

```bash
npx -y @mysten-incubation/memwal-mcp login --prod
```

Opens a browser to `memory.walrus.xyz/connect/mcp`. Approve with your Sui wallet. Credentials are saved to `~/.memwal/credentials.json`.

For staging/testnet: `--staging`. For local dev: `--local`.

### 2. Add to your MCP client

**Cursor** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "memwal": {
      "command": "npx",
      "args": ["-y", "@mysten-incubation/memwal-mcp"]
    }
  }
}
```

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "memwal": {
      "command": "npx",
      "args": ["-y", "@mysten-incubation/memwal-mcp"]
    }
  }
}
```

**Claude Code**:
```bash
claude mcp add --scope user memwal -- npx -y @mysten-incubation/memwal-mcp
```

**Codex** (`~/.codex/config.toml`):
```toml
[mcp_servers.memwal]
command = "npx"
args = ["-y", "@mysten-incubation/memwal-mcp"]
```

### 3. Restart the client

MCP servers load at startup. Fully quit and reopen (Cmd+Q on macOS). First launch fetches the package (5-10 second delay).

## Eight MCP tools

| Tool | Description |
|------|-------------|
| `memwal_remember` | Store a memory (text, optional namespace) |
| `memwal_remember_bulk` | Store multiple memories in a single call |
| `memwal_recall` | Search memories by natural language query |
| `memwal_analyze` | Extract facts from text and store each separately |
| `memwal_restore` | Rebuild vector index from Walrus for a namespace |
| `memwal_health` | Check server and relayer connectivity status |
| `memwal_login` | Open browser login flow (local-only tool) |
| `memwal_logout` | Delete local credentials (local-only tool) |

## Auth-required mode

If credentials are missing on startup, the MCP server does not crash. It starts in auth-required mode with only `memwal_login` available. Ask the agent to run `memwal_login`, approve in the browser, then retry. This avoids the old UX of "failed to start server" errors.

## Default namespace

Pin a default namespace in your client config to avoid passing it on every call:

```json
{
  "mcpServers": {
    "memwal": {
      "command": "npx",
      "args": ["-y", "@mysten-incubation/memwal-mcp", "--namespace", "work"]
    }
  }
}
```

Or via environment variable:
```json
{
  "mcpServers": {
    "memwal": {
      "command": "npx",
      "args": ["-y", "@mysten-incubation/memwal-mcp"],
      "env": { "MEMWAL_NAMESPACE": "work" }
    }
  }
}
```

Precedence: per-call namespace > flag/env default > relayer default (`"default"`).

## Switching environments

```bash
npx -y @mysten-incubation/memwal-mcp --logout
npx -y @mysten-incubation/memwal-mcp login --staging
```

The client config does not change. The package reads the environment from `~/.memwal/credentials.json`.

| Flag | Relayer | Dashboard |
|------|---------|-----------|
| `--prod` | `https://relayer.memory.walrus.xyz` | `https://memory.walrus.xyz` |
| `--staging` | `https://relayer-staging.memory.walrus.xyz` | `https://staging.memory.walrus.xyz` |
| `--local` | `http://127.0.0.1:8000` | `http://localhost:5173` |

## Streamable HTTP (remote MCP)

If your MCP client supports remote servers with custom headers, connect directly to the relayer:

- URL: `https://relayer.memory.walrus.xyz/api/mcp`
- Header: `Authorization: Bearer <delegatePrivateKey>`
- Header: `x-memwal-account-id: <accountId>`

Values come from `~/.memwal/credentials.json` after login.

## Signing out

```bash
npx -y @mysten-incubation/memwal-mcp --logout
```

Deletes local credentials. The onchain delegate key is NOT revoked. Visit `memory.walrus.xyz` to remove it from your account.

## Troubleshooting

- **No Walrus Memory tools visible:** MCP host did not load the package. Check config file path, restart fully, confirm Node 20+.
- **Only `memwal_login` visible:** Credentials are missing. Run the login command or ask the agent to call `memwal_login`.
- **Login command exits silently:** Run in a real terminal with TTY. Non-interactive shells cannot open the browser.
- **5-10 second delay on first use:** Normal. `npx` fetches the package on first run.
