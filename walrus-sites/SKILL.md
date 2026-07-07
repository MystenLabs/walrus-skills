---
name: walrus-sites
description: >
  Deploying, updating, and serving decentralized static websites on Walrus Sites.
  Use when the user needs to deploy a frontend to Walrus Sites, run a local portal
  for testnet or mainnet, use the site-builder CLI, configure ws-resources.json (routing,
  headers, metadata), set up custom domains (SuiNS, DNS), automate deploys with
  GitHub Actions CI/CD, debug site-builder errors, or manage site object lifecycle
  (update, destroy, extend blobs). Also use when the user asks about site-builder,
  walrus-sites, portal setup, or hosting a dApp on Walrus. For blob storage without
  the Sites framework (raw upload/download), see `walrus-cli` or `walrus-http-api`.
---

# Walrus Sites — Decentralized Website Hosting

> **Source constraint:** All information in this skill is sourced from the
> [Walrus Sites documentation](https://docs.wal.app/docs/sites) and the
> [MystenLabs/walrus-sites repository](https://github.com/MystenLabs/walrus-sites).
> When extending this skill, only pull from these sources.

Walrus Sites lets you deploy a static website (HTML/CSS/JS) to Walrus, with an on-chain Sui object tracking the site's resources. A portal server resolves site subdomains, fetches resources from Walrus, and serves them over HTTP. The result is a fully decentralized frontend with no centralized server, CDN, or DNS required.

Common failures:

1. **Blobs expire.** Sites published with too few epochs silently break when blobs expire. Always use a generous `--epochs` value or `--epochs max` (53 epochs maximum — about 53 days on testnet, ~2 years on mainnet). Note: `--permanent` only makes a blob non-deletable; it does not extend its storage duration beyond the `--epochs` value.
2. **Portal misconfiguration.** The portal's `original_package_id` must match the Walrus Sites framework package (`site::Site`), not your app's Move package.
3. **Testnet sites cannot use `wal.app`.** The public `wal.app` portal serves mainnet only. Testnet requires a self-hosted local portal.
4. **SPA routing.** Single-page apps need `ws-resources.json` routing config for client-side routing. Without it, direct navigation to deep links returns 404.

---

## Sub-skills

### publishing — Building and deploying sites
**Path:** `publishing/SKILL.md`
**Load when:** deploying a new site, updating an existing site, choosing epoch duration, configuring `ws-resources.json`, or troubleshooting `site-builder` errors.
**Covers:** `site-builder deploy`, `site-builder publish`, `site-builder update`, `--epochs` flag, blob expiration, `ws-resources.json` configuration, SPA routing, site naming, `site-builder sitemap` for debugging, `site-builder destroy`.

### portal — Running a local portal for testnet
**Path:** `portal/SKILL.md`
**Load when:** the user needs to view a testnet site, set up the local portal, run their own portal as a decentralized fallback, fix portal 404s, or understand how portal resolution works.
**Covers:** cloning the portal, installing dependencies (Bun), `portal-config.yaml`, the `original_package_id` gotcha, starting the server, URL format, port conflicts, mainnet vs testnet differences.

---

## Routing guide

| Task | Load |
|------|------|
| Deploy a frontend to Walrus Sites | `publishing/` |
| Update an existing deployed site | `publishing/` |
| Fix 404 or expired site | `publishing/` + `portal/` |
| View a testnet site locally | `portal/` |
| Set up the local portal | `portal/` |
| Portal shows "Page not found" | `portal/` + `publishing/` (check blob expiry) |
| Configure SPA routing or custom headers | `publishing/` |
| Set up custom domain (SuiNS) | Skill Content below |
| Set up CI/CD with GitHub Actions | Skill Content below |
| Check what resources a site has | `publishing/` (`site-builder sitemap`) |
| Delete a deployed site | `publishing/` |
| Choose between Walrus Sites and traditional hosting | Skill Content below |

---

## Skill Content

### Key concepts

- **Site object.** A Sui object of type `site::Site` from the Walrus Sites framework package. It holds metadata and dynamic fields mapping resource paths to Walrus blob references. Created by `site-builder deploy`, owned by the publisher's address.

- **Resources.** Each file in the deployed directory becomes a resource stored on Walrus. Small files might be batched into a quilt. Each resource has a path (for example, `/index.html`, `/assets/main.js`) and optional HTTP headers.

- **Portal.** A server that maps `<base36-site-id>.localhost:3000` or `<name>.localhost:3000` (self-hosted/testnet) or `<name>.wal.app` (mainnet with SuiNS) URLs to on-chain site objects. It reads the site's dynamic fields to find the requested resource path, fetches the blob from a Walrus aggregator, and returns it as an HTTP response.

- **`ws-resources.json`.** A configuration file in the site's root directory controlling resource headers, routing rules, redirect configuration, metadata, and file ignoring. Auto-generated on first deploy with the site object ID. On subsequent deploys, the site-builder reads it to determine whether to create a new site or update the existing one.

- **Blob expiration.** Walrus blobs have a finite storage duration (maximum 53 epochs). When blobs expire, the portal returns a distinct 404 whose body reads "This content is no longer available / It may have expired" and names the Blob ID — this is different from a regular page-not-found 404. Use `site-builder sitemap <object-id>` to check expiration dates. Re-deploy with a higher `--epochs` value to fix.

- **`site-builder deploy`.** The recommended unified command that creates a new site or updates an existing one (replacing the legacy `publish` and `update` commands).

### Site-builder CLI commands

| Command | Purpose |
|---------|---------|
| `site-builder deploy <DIR>` | Create or update a site (recommended) |
| `site-builder sitemap <OBJECT_ID>` | List resources with expiry dates |
| `site-builder list-directory <DIR>` | Preview what would be uploaded |
| `site-builder update-resources` | Add or update one or more resources |
| `site-builder destroy <OBJECT_ID>` | Remove a site permanently |
| `site-builder convert <HEX>` | Convert hex object ID to Base36 |

### Custom domains

**SuiNS names:** Associate a SuiNS name with your site object using SuiNS tooling (a separate on-chain step). The portal resolves `<name>.wal.app` to your site via the SuiNS name record's `walrusSiteId` field. Note: the `site_name` field in `ws-resources.json` only sets the Site object's on-chain display name — it does not configure SuiNS.

**Custom DNS:** Point your own domain to a Walrus Sites portal using DNS CNAME records. See the [DNS configuration guide](https://docs.wal.app/docs/sites/dns-configuration) for details.

### CI/CD with GitHub Actions

Use the official **Deploy Walrus Site** GitHub Action to automate deployments:

```yaml
- uses: MystenLabs/walrus-sites-github-actions/deploy@v3
  with:
    DIST: ./dist
    SUI_NETWORK: testnet
    EPOCHS: 30
    SUI_ADDRESS: ${{ secrets.SUI_ADDRESS }}
    SUI_KEYSTORE: ${{ secrets.SUI_KEYSTORE }}
```

**Authentication methods** (choose one):
1. `SUI_ADDRESS` + `SUI_KEYSTORE` — address and keystore file contents
2. `SUI_BECH32_PRIVATE_KEY` — a bech32-encoded private key
3. `SUI_SECRET_PHRASE` — a 12/24-word recovery phrase

The action handles building, publishing, and updating `ws-resources.json`. Use `GITHUB_TOKEN` to have the action create a PR with updated `ws-resources.json` after first deploy.

### Known restrictions

- **Static sites only.** No server-side rendering, runtime logic, or server-side redirects.
- **No secrets.** All content is stored on Walrus (public). Do not include API keys, credentials, or private data.
- **Maximum 3 redirect hops** on the public portal.
- **Service-worker portal limitations** on iOS and certain browsers.
- **PWAs not fully supported.**

### Rules

1. **Choose an appropriate `--epochs` value.** Maximum is 53 epochs (~53 days on testnet where 1 epoch = 1 day, ~2 years on mainnet where 1 epoch = 14 days). Use `--epochs max` for the longest possible storage duration. Note: `--permanent` only prevents deletion — it does not extend storage duration.
2. **Build before deploying.** Run `npm run build` (or equivalent) to produce a static output directory. The site-builder deploys whatever directory you point it at.
3. **Do not change `original_package_id` in the portal config** unless you know the Walrus Sites framework package has been upgraded.
4. **`wal.app` is mainnet only.** For testnet, self-host the portal from the `MystenLabs/walrus-sites` repo.
5. **Keep `ws-resources.json` in version control.** It records the site object ID. Without it, future deploys create a new site instead of updating the existing one.
6. **Use `site-builder deploy` instead of `publish`/`update`.** The `deploy` command is the recommended unified command.

### Common mistakes

- **Publishing with `--epochs 5` and wondering why the site disappears.** Blobs expired. Re-deploy with a higher `--epochs` value or `--epochs max`.
- **Changing the portal's `original_package_id` to your app's package ID.** The portal needs the Walrus Sites framework package ID (`site::Site`), not your Move contract's ID.
- **Trying to visit a testnet site on `wal.app`.** It only serves mainnet. Use a local portal for testnet.
- **Forgetting to build the frontend before deploying.** `site-builder deploy dist/` deploys the `dist/` directory contents. If you did not build first, you are deploying source files or stale output.
- **Deploying an SPA without fallback routing.** React/Vue/Svelte SPAs use client-side routing. Direct navigation to `/dashboard` hits the portal looking for a `/dashboard` resource that does not exist. Configure a fallback route in `ws-resources.json`.
- **Not killing port 3000 before starting the portal.** Other dev tools often use port 3000. The portal fails silently if the port is taken.
- **Not committing `ws-resources.json` after first deploy.** Without it, the next deploy creates a brand new site instead of updating the existing one.
- **WASM files returning 503 errors.** Large `.wasm` files can trigger `upstream connect error or disconnect/reset before headers` from the portal. This is caused by the aggregator response exceeding the portal's idle timeout, not blob size limits. The fix (commit a31ec78, #714) sizes `idleTimeout` from the aggregator retry budget. If you hit this, tune via `AGGREGATOR_REQUEST_TIMEOUT_MS` / `PORTAL_IDLE_TIMEOUT_MAX_S` environment variables.
- **Windows users using `$(pwd)` in Docker commands.** PowerShell does not support `$(pwd)`. Use the full absolute path instead.
- **SuiNS domain costs.** Custom `.sui` names cost approximately $10/year through SuiNS. This is separate from Walrus storage costs.
- **Deploying the repo root instead of the build output.** Point `site-builder deploy` at `dist/`, `build/`, or `out/` — not the repository root. Deploying the root uploads `node_modules/`, source files, and config, dramatically increasing costs.
- **Redeploying to an existing site without `ws-resources.json`.** If you lost the file, use `--object-id <SITE_OBJECT_ID>` to target the existing site object directly.
