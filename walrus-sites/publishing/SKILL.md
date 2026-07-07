---
name: walrus-sites-publishing
description: >
  Publishing, updating, and managing decentralized websites with the Walrus
  Sites site-builder CLI. Use when the user needs to deploy a static frontend
  to Walrus Sites, update an existing deployment, configure ws-resources.json
  for SPA routing or custom headers, check blob expiration with sitemap, extend
  blob storage, or destroy a site. Also use when the user sees site-builder
  errors or asks about --epochs, blob expiry, or site lifecycle.
  For running a local portal to view testnet sites, see the `walrus-sites/portal` skill.
---

# Publishing and Managing Walrus Sites

> **MCP tool:** When available in your environment, also query the Sui documentation MCP server (`https://sui.mcp.kapa.ai`) for up-to-date answers. Use it for verification and for details not covered by these reference files.

> **Source constraint:** All information sourced from [MystenLabs/walrus-sites](https://github.com/MystenLabs/walrus-sites) and [docs.wal.app/walrus-sites](https://docs.wal.app/docs/sites). Do not use third-party blogs or unofficial tutorials.

## Prerequisites

1. **Sui CLI** installed and configured with a `client.yaml` that has an environment matching the `wallet_env` in `sites-config.yaml` (e.g., `testnet`). The site-builder reads the network from `sites-config.yaml`, not `sui client active-env`. If the env alias is missing, you'll get an error like "Env 'testnet' not found".
2. **`site-builder`** installed via `suiup install site-builder`.
3. **`walrus`** CLI installed via `suiup install walrus`, with a config context for the target network.
4. **SUI tokens** for gas on the target network (`sui client balance`).
5. **WAL tokens** for Walrus blob storage. On testnet, get SUI from the Sui faucet, then exchange it for WAL using `walrus get-wal` (1:1 ratio, default 0.5 SUI → 0.5 WAL; use `--amount` in MIST/FROST for other amounts). There is no separate WAL faucet.
6. A **built static site** — run `npm run build` (or equivalent) to produce a `dist/` directory.

Check the site-builder config exists:

```bash
cat ~/.config/walrus/sites-config.yaml
```

This file specifies the Walrus Sites framework package, staking object, and Walrus context per network. It is **not** created automatically by `suiup install site-builder` — you must download it manually (see the [site-builder installation docs](https://docs.wal.app/docs/sites/installing-the-site-builder)). The site-builder searches `~/.config/walrus/sites-config.yaml`, `./sites-config.yaml`, and `$XDG_CONFIG_HOME/walrus/`.

## Deploying a site

Use `site-builder deploy` — the recommended unified command that creates a new site or updates an existing one (replacing the legacy `publish` and `update` commands):

```bash
site-builder deploy --epochs max dist/
```

- `--epochs max` — store blobs for the maximum duration (53 epochs — ~53 days on testnet, ~2 years on mainnet). Use a lower value for short-lived demos. Note: `--permanent` only makes blobs non-deletable; it does **not** extend storage duration beyond `--epochs`.
- `dist/` — the directory containing your built static site.

Output includes:
- **Site Object ID** — the on-chain Sui object representing your site.
- **Base36 subdomain** — used to construct the portal URL.
- **`ws-resources.json`** — auto-generated in the source directory with the site object ID.

Example output:
```
New site object ID: 0x95926fb4cd28705823af105900d704d1c56c17d55d994a0715479c175590f80a
For local development: http://3q7dwaf5a6eg....localhost:3000
```

### Choosing `--epochs`

The maximum is **53 epochs**. Epoch length differs by network: testnet = 1 day, mainnet = 14 days.

| Use case | Recommended |
|----------|-------------|
| Quick testnet demo | `--epochs 10` |
| Testnet staging | `--epochs 30` |
| Mainnet production | `--epochs max` (~2 years) |
| Throwaway test | `--epochs 5` |

**Very low values cause blobs to expire quickly**, and the site silently breaks with a distinct 404 ("This content is no longer available").

Other duration options:
- `--earliest-expiry-time "2026-12-31T00:00:00Z"` — expire no earlier than a specific date.
- `--end-epoch <N>` — expire at a specific Walrus epoch number (must be within 53 epochs of current).

## Updating an existing site

After the first deploy, `ws-resources.json` records the site object ID. Running `site-builder deploy` again detects this and updates the existing site:

```bash
# Rebuild, then update
npm run build
site-builder deploy --epochs max dist/
```

`site-builder deploy` (and the legacy `site-builder update`) replaces changed resources, adds new ones, and removes deleted ones. Unchanged resources are not re-uploaded.

To add or update specific resources without replacing the whole site:

```bash
site-builder update-resources --epochs max dist/new-file.html
```

## `ws-resources.json`

Auto-generated in the site directory on first deploy. Example:

```json
{
  "site_name": "My Walrus Site",
  "object_id": "0x95926fb4cd28705823af105900d704d1c56c17d55d994a0715479c175590f80a"
}
```

**Keep this file in version control.** The site-builder reads it to determine whether to create a new site or update the existing one. Without it, every deploy creates a new site object.

### SPA routing configuration

Single-page apps need all routes to serve `index.html`. Add a `routes` section to `ws-resources.json`:

```json
{
  "site_name": "My Library",
  "object_id": "0x...",
  "routes": {
    "/*": "/index.html"
  }
}
```

Without this, direct navigation to `/borrows` or any client-side route returns 404 from the portal.

### Custom headers

```json
{
  "site_name": "My App",
  "object_id": "0x...",
  "headers": {
    "/assets/*": {
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  }
}
```

## Debugging with `site-builder sitemap`

```bash
site-builder sitemap 0x<site-object-id>
```

Shows all published resources with their blob IDs and **expiration dates**:

```
 Resource path               Blob / Quilt Patch ID   Earliest Expiration Date
 /index.html                 MlhytW8o...             2026-06-15
 /assets/index-B9aUffXC.css  MlhytW8o...             2026-06-15
 /assets/index-Do4WTf-k.js   MlhytW8o...             2026-06-15
```

**If the expiration date is in the past, the site will 404.** An expired blob returns a distinct 404 whose body reads "This content is no longer available / It may have expired" and names the Blob ID — unlike a regular page-not-found, this is a terminal error that bypasses redirects, route matching, and 404.html fallback. Re-deploy with a higher `--epochs` value.

## Destroying a site

```bash
site-builder destroy 0x<site-object-id>
```

Removes the site object from Sui. Blob storage may still persist until expiry but the site will no longer be resolvable.

## Extending blob storage

If blobs are approaching expiry, extend them during a deploy:

```bash
site-builder deploy --epochs max dist/
```

The `deploy` command extends blob storage to the new epoch count if it's longer than the current duration.

## Portal access: mainnet vs testnet

The public portal at `wal.app` only serves **mainnet** sites. If you are deploying to testnet, you must run a self-hosted local portal to view your site. See the `walrus-sites/portal` skill for setup instructions.

## End-to-end deploy workflow

```bash
# 1. Build the frontend
cd my-app/ui
npm run build

# 2. First-time deploy (creates site object + ws-resources.json)
site-builder deploy --epochs max dist/

# 3. Note the site object ID and portal URL from the output

# 4. For testnet: start the local portal (see walrus-sites/portal skill)

# 5. To update after code changes:
npm run build
site-builder deploy --epochs max dist/
```

## Rules

1. **Always build before deploying.** `site-builder deploy dist/` deploys whatever is in `dist/`. If you didn't `npm run build` first, you're deploying stale or source files.
2. **Choose an appropriate `--epochs` value.** Max is 53 epochs (~53 days testnet, ~2 years mainnet). Use `--epochs max` for the longest duration.
3. **Keep `ws-resources.json` in version control.** Without it, every deploy creates a new site instead of updating.
4. **Use `site-builder deploy` instead of the legacy `publish`/`update` commands.** `deploy` is the unified command that creates or updates as needed.

## Common mistakes

- **Deploying with very low `--epochs` and wondering why the site breaks.** Blobs expired. Re-deploy with a higher `--epochs` value or `--epochs max`.
- **Forgetting to build the frontend before deploying.** Deploying the `src/` directory instead of `dist/`.
- **Using the legacy `publish` command instead of `deploy`.** `publish` always creates a new site object with a new URL. Use `deploy`, which creates or updates as needed.
- **Deploying an SPA without fallback routing.** Direct navigation to `/dashboard` returns 404. Add `"routes": { "/*": "/index.html" }` to `ws-resources.json`.
- **Deleting `ws-resources.json` from the build directory.** The site-builder can't find the existing site and creates a new one.
