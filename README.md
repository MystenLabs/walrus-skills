# Walrus Agent Skills

Reusable agent skills for building on [Walrus](https://walrus.xyz), the decentralized storage protocol built on Sui. Install them into Claude Code, Cursor, Codex, and [40+ other AI coding agents](https://skills.sh) via the `skills` CLI.

## Install

```bash
# Browse available skills
npx skills add mystenlabs/walrus-skills --list

# Install a specific skill
npx skills add mystenlabs/walrus-skills --skill walrus-cli

# Install all skills
npx skills add mystenlabs/walrus-skills --all
```

## Skills

### Core

| Skill | Description |
|-------|-------------|
| [walrus-overview](walrus-overview/) | What Walrus is, architecture, terminology, decision tree for choosing a tool |
| [walrus-ts-sdk](walrus-ts-sdk/) | TypeScript SDK (`@mysten/walrus`) — storing/reading blobs, wallet wiring, upload relay |
| [walrus-http-api](walrus-http-api/) | Publisher/aggregator REST API for storing and reading blobs from any language |
| [walrus-cli](walrus-cli/) | CLI commands: `store`, `read`, `blob-status`, JSON mode for scripting |
| [walrus-storage-costs](walrus-storage-costs/) | Pricing, cost estimation, the dual-token (WAL + SUI) cost model |

### Feature-specific

| Skill | Description |
|-------|-------------|
| [walrus-quilts](walrus-quilts/) | Batching many small blobs into one unit, `QuiltPatchId` retrieval |
| [walrus-move-integration](walrus-move-integration/) | Referencing/wrapping blobs in Move contracts, `Move.toml` dependencies |
| [walrus-sites](walrus-sites/) | Deploying static sites to Walrus, site-builder, custom domains, CI/CD |
| [walrus-data-security](walrus-data-security/) | Encrypting before storing using Seal (threshold encryption + onchain access control) |

### Agent Memory

| Skill | Description |
|-------|-------------|
| [walrus-memory](walrus-memory/) | Persistent, portable, encrypted memory for AI agents (MemWal SDK, MCP, Python) |

### Lifecycle & Operations

| Skill | Description |
|-------|-------------|
| [walrus-blob-lifecycle](walrus-blob-lifecycle/) | Epochs/lifetimes, extend, delete, burn, share, attributes, large uploads |
| [walrus-troubleshooting](walrus-troubleshooting/) | Common error messages with causes and fixes |

## Repo Structure

Each skill is a directory containing a `SKILL.md` and any supporting reference files:

```
walrus-skills/
├── walrus-overview/
│   └── SKILL.md
├── walrus-cli/
│   └── SKILL.md
├── walrus-ts-sdk/
│   └── SKILL.md
├── walrus-http-api/
│   └── SKILL.md
├── walrus-storage-costs/
│   └── SKILL.md
├── walrus-quilts/
│   └── SKILL.md
├── walrus-move-integration/
│   └── SKILL.md
├── walrus-sites/
│   ├── SKILL.md
│   ├── publishing/SKILL.md
│   └── portal/SKILL.md
├── walrus-data-security/
│   ├── SKILL.md
│   └── seal-sdk.md
├── walrus-blob-lifecycle/
│   ├── SKILL.md
│   └── large-uploads.md
├── walrus-troubleshooting/
│   └── SKILL.md
└── scripts/
```

Supporting files (anything that is not `SKILL.md`) are bundled with the skill but only loaded by the agent when needed — they do not consume context upfront.

## Contributing

### Quick start

```bash
# Copy the template
cp -r template/ your-skill-name/

# Edit the skill definition
$EDITOR your-skill-name/SKILL.md

# Add supporting reference files
touch your-skill-name/setup.md

# Add evals
mkdir your-skill-name/evals
touch your-skill-name/evals/evals.json
```

### Steps

1. Create a new directory under the repo root: `your-skill-name/`
2. Add a `SKILL.md` with frontmatter:

```yaml
---
name: your-skill-name
description: What this skill does and when to use it. Be specific — this is what the agent uses to decide whether to trigger the skill.
---
```

3. Add supporting files to the same directory as needed
4. Add evals to `your-skill-name/evals/evals.json` (see [Evals](#evals) below)
5. Open a PR

### Evals

Every new skill must include evals. Evals verify that the skill produces correct, reliable output and prevent regressions as the skill evolves. PRs without evals will not be merged.

Place an `evals/evals.json` file in your skill directory:

```json
[
  {
    "id": "your-skill-basic",
    "prompt": "A realistic prompt a user would give the agent",
    "sources": [
        "https://docs.wal.app/docs/relevant-page"
    ],
    "expected_output": "Description of what correct output looks like",
    "expectations": [
      "Specific thing the output must include or satisfy",
      "Another requirement"
    ]
  }
]
```

When writing evals:
- Cover the core use cases your skill is designed to handle
- Use realistic prompts that match how a user would actually invoke the skill
- Include edge cases where the skill's domain has common pitfalls
- Each eval should test a distinct capability — avoid redundant prompts
- Each prompt should include a `sources` field that links out to documentation that should be used to verify the output of the eval

### Tips

- **Description is a trigger rule.** The `description` field in frontmatter determines when agents activate your skill. Write it like a conditional: "Use when X, Y, or Z."
- **SKILL.md routes, reference files teach.** Keep SKILL.md short — it tells the agent which files to load. Put the actual knowledge in reference files.
- **One skill per capability.** If two things have meaningfully different triggers, they should be separate skills.

## Resources

- [Walrus Documentation](https://docs.wal.app)
- [Walrus GitHub](https://github.com/MystenLabs/walrus)
- [skills.sh listing](https://skills.sh)
- [Agent Skills spec](https://github.com/vercel-labs/skills)
