---
name: walrus-sites-portal
description: >
  Running a local Walrus Sites portal to view testnet sites. Use when the user
  needs to set up the portal server, fix portal 404 errors, resolve port conflicts,
  understand the original_package_id configuration, or learn why wal.app doesn't
  serve testnet sites. Also use when the user asks about portal architecture,
  base36 subdomains, or how site resolution works.
  For publishing and managing sites, see the `walrus-sites/publishing` skill.
---

# Running a Local Portal for Testnet

> **MCP tool:** When available in your environment, also query the Sui documentation MCP server (`https://sui.mcp.kapa.ai`) for up-to-date answers. Use it for verification and for details not covered by these reference files.

> **Source constraint:** All information sourced from [MystenLabs/walrus-sites](https://github.com/MystenLabs/walrus-sites/tree/main/portal). Do not use third-party blogs or unofficial tutorials.

The public portal at `wal.app` only serves **mainnet** sites. To view testnet sites, you must self-host the portal from the `MystenLabs/walrus-sites` repository.

## Prerequisites

- **Docker** — to run the portal container
- **Git** — to clone the portal repo (for the helper script)

## Setup (Docker — recommended)

The official way to run a local portal is via Docker. The portal Docker image tag is always `mainnet-<version>` — the served network is controlled by environment variables, not the image tag. The portal image version **must match** your installed `site-builder` version.

### Option 1: Helper script (easiest)

```bash
git clone https://github.com/MystenLabs/walrus-sites.git
cd walrus-sites
git checkout mainnet
scripts/local-docker-portal.sh testnet
```

The script auto-generates a config matching your installed `site-builder` version and runs the Docker image with the correct environment variables (`SUINS_CLIENT_NETWORK`, `RPC_URL_LIST`, `AGGREGATOR_URL`).

### Option 2: Manual Docker run

```bash
docker run -p 3000:3000 mysten/walrus-sites-server-portal:mainnet-<version> \
  -e SUINS_CLIENT_NETWORK=testnet \
  -e RPC_URL_LIST="https://fullnode.testnet.sui.io" \
  -e AGGREGATOR_URL="https://aggregator.walrus-testnet.walrus.space"
```

Replace `<version>` with the version matching your `site-builder`.

**Do not modify `original_package_id` in the config.** It must match the Walrus Sites framework package on testnet (`site::Site` type). The example config ships with the correct value. Changing it to your app's Move package ID will cause all site lookups to fail.

The portal runs on **port 3000** by default.

## Setup (Bun — development only)

For hacking on the portal source code, you can run the dev server directly:

```bash
git clone https://github.com/MystenLabs/walrus-sites.git
cd walrus-sites
git checkout mainnet
cd portal
bun install
cp server/portal-config.testnet.example.yaml server/portal-config.yaml
bun -F server start
```

## Accessing your site

Site URLs use a base36-encoded site object ID as the subdomain:

```
http://<base36-site-id>.localhost:3000
```

The `site-builder publish` output provides the exact URL. Example:

```
http://3q7dwaf5a6egmuoi9fe0owij1x78d0csw1aid7opbwe8e7hp1m.localhost:3000
```

You can also convert a hex site object ID to base36:

```bash
site-builder convert 0x95926fb4cd28705823af105900d704d1c56c17d55d994a0715479c175590f80a
```

## Understanding `original_package_id`

This is the most common misconfiguration. The portal's `original_package_id` refers to the **Walrus Sites framework package** — the package that defines the `site::Site` Move type. It is **not**:

- Your app's Move package ID
- The site-builder's deployment package
- Your published site's object ID

The framework package is what the site-builder uses internally to create `Site` objects. The portal needs it to look up dynamic fields on site objects. The testnet example config already has the correct value.

**How to verify:** run `sui client object <your-site-object-id>` and check `objType`. It will show something like:

```
objType: 0xf99aee9...::site::Site
```

The hex prefix in that type is the `original_package_id` the portal needs.

## Troubleshooting

### Portal returns "Page not found" (404)

1. **Blobs expired.** Run `site-builder sitemap <site-object-id>` and check the "Earliest Expiration Date" column. If dates are in the past, re-deploy with a higher `--epochs` value or `--epochs max`. Note: an expired blob returns a distinct 404 whose body reads "This content is no longer available / It may have expired" and names the Blob ID.

2. **Wrong `original_package_id`.** If you edited the portal config, restore the original value from the example file. Check with `sui client object <site-id>` — the `objType` prefix is the correct package ID.

3. **Portal is looking up the old site object.** If you re-published (created a new site instead of updating), the URL changed. Check the `site-builder publish` output for the new base36 subdomain.

### Port 3000 already in use

```bash
# Find what's using port 3000
lsof -i :3000 -P | grep LISTEN

# Kill it
lsof -i :3000 -t | xargs kill

# Restart portal
cd walrus-sites/portal
bun -F server start
```

Common conflicts: Vite dev server, Next.js dev server, other Node processes.

### Portal crashes on startup

- Ensure `portal-config.yaml` exists in `portal/server/`.
- Ensure `bun install` completed successfully in the `portal/` directory.
- Check that the Bun version is recent: `bun --version` (1.0+ required).

## Mainnet vs testnet

| Aspect | Testnet | Mainnet |
|--------|---------|---------|
| Public portal | None — self-host required | `wal.app` |
| URL format (self-hosted) | `<b36>.localhost:3000` | `<b36>.wal.app` |
| WAL tokens | Faucet available | Real cost |
| Blob durability | Testnet resets possible | Production grade |
| Use case | Development, staging | Production |

## Portal architecture (how it works)

When you visit `http://<b36-id>.localhost:3000/index.html`:

1. The portal extracts the subdomain and converts base36 to hex to get the site object ID.
2. It queries Sui RPC for the site object and its dynamic fields.
3. It finds the dynamic field matching the path `/index.html`.
4. The dynamic field contains a Walrus blob ID (or quilt patch ID) for the resource.
5. The portal fetches the blob from the Walrus aggregator.
6. It decompresses (if needed) and serves the content as an HTTP response.

All of this happens per-request. The portal is stateless — it reads from Sui and Walrus on every request (with optional Redis caching in production).

## Rules

1. **Don't change `original_package_id`** unless you know the Walrus Sites framework package has been upgraded. The testnet example value is correct.
2. **`wal.app` is mainnet only.** For testnet, self-host the portal.
3. **Kill port 3000 before starting the portal.** Other dev servers commonly use this port.
4. **Use Docker (or the helper script) to run the portal** — this is the officially documented method. Use `bun -F server start` only for portal development.
5. **Clone the `mainnet` branch**, not `main`, for a stable portal release. The portal image version must match your `site-builder` version.

## Common mistakes

- **Changing `original_package_id` to your app's Move package ID.** This breaks all site lookups. The portal needs the Walrus Sites framework package ID, not yours.
- **Trying to visit a testnet site on `wal.app`.** It only serves mainnet.
- **Not killing port 3000 before starting the portal.** The portal silently fails to bind.
- **Running `bun -F server start` from the wrong directory.** Must be run from inside `walrus-sites/portal/`.
- **Forgetting to copy the config file.** The portal needs `portal-config.yaml` in `portal/server/`. Without it, the server crashes on startup.
