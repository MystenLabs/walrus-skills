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

[misleading: network + signing env come from `sites-config.yaml` (`default_context` + per-context
`wallet_env`), NOT from `sui client active-env`. Every shipped config sets `wallet_env` (testnet/
mainnet), so the Sui active-env is never consulted — it's only a fallback when `wallet_env` is unset
everywhere (util.rs:229-234). What's actually needed: a `client.yaml` with an env aliased to match
`wallet_env` (e.g. `testnet`) and a funded address, else it errors "Env 'testnet' not found".]: #
1. **Sui CLI** installed and configured for the target network (`sui client active-env`).
2. **`site-builder`** installed via `suiup install site-builder`.
3. **`walrus`** CLI installed via `suiup install walrus`, with a config context for the target network.
4. **SUI tokens** for gas on the target network (`sui client balance`).
[wrong: there is no WAL faucet. Get Testnet SUI from the Sui faucet, then exchange it for WAL via
`walrus get-wal` (1:1, default 0.5 SUI→0.5 WAL, `--amount` in MIST/FROST). Testnet-only; needs an
exchange object (getting-started/index.mdx:132, available-networks.mdx:109).]: #
5. **WAL tokens** for Walrus blob storage (testnet: faucet available).
6. A **built static site** — run `npm run build` (or equivalent) to produce a `dist/` directory.

Check the site-builder config exists:

```bash
cat ~/.config/walrus/sites-config.yaml
```

[claim-check: site-builder DOES search `~/.config/walrus/sites-config.yaml` (also `./sites-config.yaml`
and `$XDG_CONFIG_HOME/walrus/`) — lib.rs:257-263. But "created automatically by suiup" is FALSE:
suiup installs only the binary; the docs have you download the config manually
(`curl .../sites-config.yaml -o ~/.config/walrus/sites-config.yaml`, installing-the-site-builder.mdx:166).]: #
This file specifies the Walrus Sites framework package, staking object, and Walrus context per network. It's created automatically by `suiup install site-builder`.

[this whole file teaches the legacy `publish`/`update` commands, but the parent SKILL.md's own rule
says "use `site-builder deploy` instead" (it's the unified create-or-update command). Prefer `deploy`
throughout; at minimum, wherever `publish` or `update` is shown, mention `deploy` as the recommended
equivalent. Note: `publish`/`update`/`deploy` all write ws-resources.json via the same code path
(persist_site_identifier, publish.rs:325) — it is NOT deploy-only.]: #
## Publishing a new site

```bash
site-builder publish --epochs 30 dist/
```

[`--permanent` misuse again: it does NOT make a site "never expire" — it only makes the blob
non-deletable; the site still expires after `--epochs` (capped at 53). For max longevity use
`--epochs max`, not `--permanent`.]: #
- `--epochs 30` — store blobs for 30 Walrus epochs. Use higher values for longer-lived sites. Use `--permanent` for sites that should never expire (cannot be reclaimed).
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

| Use case | Recommended |
|----------|-------------|
[above the limit: max is 53 epochs. `--epochs 100`, `200+`, and `--end-epoch 200` below are all
rejected by site-builder ("blobs can only be stored for up to 53 epochs ahead", args.rs). Use
`--epochs max` for the ceiling. `--permanent` here is the same misuse — it doesn't extend duration.]: #
| Quick testnet demo | `--epochs 30` |
| Testnet staging | `--epochs 100` |
| Mainnet production | `--epochs 200+` or `--permanent` |
| Throwaway test | `--epochs 10` (minimum practical) |

**Do not use `--epochs 5` or lower.** Blobs expire quickly and the site silently breaks with a 404.

Other duration options:
- `--earliest-expiry-time "2026-12-31T00:00:00Z"` — expire no earlier than a specific date.
- `--end-epoch 200` — expire at a specific Walrus epoch number.

[recommend `deploy` here too: `site-builder deploy dist/` updates the existing site in place when
ws-resources.json has the object_id (same as `update`), so this section should present `deploy` as
the primary command and `update` as the legacy equivalent.]: #
## Updating an existing site

After the first publish, `ws-resources.json` records the site object ID. Subsequent publishes detect this and offer to update:

```bash
# Rebuild, then update
npm run build
site-builder update --epochs 30 dist/
```

`site-builder update` replaces changed resources, adds new ones, and removes deleted ones. Unchanged resources are not re-uploaded.

To add or update specific resources without replacing the whole site:

```bash
site-builder update-resources --epochs 30 dist/new-file.html
```

## `ws-resources.json`

Auto-generated in the site directory on first publish. Example:

```json
{
  "site_name": "My Walrus Site",
  "object_id": "0x95926fb4cd28705823af105900d704d1c56c17d55d994a0715479c175590f80a"
}
```

**Keep this file in version control.** The site-builder reads it to determine whether to create a new site or update the existing one. Without it, every publish creates a new site object.

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

[specificity: an expired blob returns a *distinct* 404, not a generic page-not-found. Its body reads
"This content is no longer available / It may have expired" and names the Blob ID with restore
instructions (http_error_responses.ts:66-81), and unlike a missing resource it's a terminal error
that bypasses redirects/route-matching/404.html fallback (url_fetcher.ts:141). The page contents are
the tell — the status code is the same 404 either way.]: #
**If the expiration date is in the past, the site will 404.** Re-publish with a higher `--epochs` value.

## Destroying a site

```bash
site-builder destroy 0x<site-object-id>
```

Removes the site object from Sui. Blob storage may still persist until expiry but the site will no longer be resolvable.

## Extending blob storage

If blobs are approaching expiry, extend them during an update:

```bash
site-builder update --epochs 50 dist/
```

The `update` command extends blob storage to the new epoch count if it's longer than the current duration.

## Portal access: mainnet vs testnet

The public portal at `wal.app` only serves **mainnet** sites. If you are deploying to testnet, you must run a self-hosted local portal to view your site. See the `walrus-sites/portal` skill for setup instructions.

## End-to-end publish workflow

```bash
# 1. Build the frontend
cd my-app/ui
npm run build

# 2. First-time publish (creates site object + ws-resources.json)
site-builder publish --epochs 30 dist/

# 3. Note the site object ID and portal URL from the output

# 4. For testnet: start the local portal (see walrus-sites/portal skill)

# 5. To update after code changes:
npm run build
site-builder update --epochs 30 dist/
```

## Rules

1. **Always build before publishing.** `site-builder publish dist/` publishes whatever is in `dist/`. If you didn't `npm run build` first, you're publishing stale or source files.
2. **Use `--epochs 30` or higher for testnet.** Low values cause silent 404s within days.
3. **Keep `ws-resources.json` in version control.** Without it, every publish creates a new site instead of updating.
4. **Use `update` for subsequent deploys, not `publish`.** `publish` creates a new site object with a new URL. `update` modifies the existing one in place.

## Common mistakes

- **Publishing with `--epochs 5` and wondering why the site breaks.** Blobs expired. Re-publish with `--epochs 30+`.
- **Forgetting to build the frontend before publishing.** Publishing the `src/` directory instead of `dist/`.
- **Running `publish` again instead of `update` and getting a new URL.** The old site still exists but the new one has a different object ID and base36 subdomain.
- **Deploying an SPA without fallback routing.** Direct navigation to `/dashboard` returns 404. Add `"routes": { "/*": "/index.html" }` to `ws-resources.json`.
- **Deleting `ws-resources.json` from the build directory.** The site-builder can't find the existing site and creates a new one.
