# Eval Report

## Executive Summary

| Suite | Evals | Pass | Fail | Err | Flaky | Checks | Rate |
|-------|------:|-----:|-----:|----:|------:|-------:|-----:|
| AgentPrompt baseline (gpt4o) | 8 | 0 | 0 | 8 | – | 0/0 | – |
| AgentPrompt baseline (opus) | 8 | 0 | 0 | 8 | – | 0/0 | – |
| AgentPrompt baseline (sonnet) | 8 | 0 | 0 | 8 | – | 0/0 | – |
| AgentPrompt +skills (gpt4o) | 8 | 0 | 0 | 8 | – | 0/0 | – |
| AgentPrompt +skills (opus) | 8 | 0 | 0 | 8 | – | 0/0 | – |
| AgentPrompt +skills (sonnet) | 8 | 0 | 0 | 8 | – | 0/0 | – |

### Models

| Label | Provider | Model ID | Judge Model |
|-------|----------|----------|-------------|
| gpt-4o | openai | `gpt-4o` | `claude-haiku-4-5-20251001` |
| claude-opus-4-6 | anthropic | `claude-opus-4-6` | `claude-haiku-4-5-20251001` |
| claude-sonnet-4-6 | anthropic | `claude-sonnet-4-6` | `claude-haiku-4-5-20251001` |

---

## AgentPrompt Evals (docs.sui.io)

| Prompt | Source Page | gpt4o | opus | sonnet |
|--------|-----------|:------:|:------:|:------:|
| walrus-cli-setup | walrus-client/walrus-cli | ⚠️ | ⚠️ | ⚠️ |
| walrus-manage-blobs | walrus-client/managing-blobs | ⚠️ | ⚠️ | ⚠️ |
| walrus-overview-routing | getting-started/index | ⚠️ | ⚠️ | ⚠️ |
| walrus-quilts | walrus-client/quilts | ⚠️ | ⚠️ | ⚠️ |
| walrus-sites-deploy | sites/getting-started/publishing-your-first-site | ⚠️ | ⚠️ | ⚠️ |
| walrus-storage-costs | system-overview/storage-costs | ⚠️ | ⚠️ | ⚠️ |
| walrus-store-curl | http-api/storing-blobs | ⚠️ | ⚠️ | ⚠️ |
| walrus-troubleshooting | troubleshooting/index | ⚠️ | ⚠️ | ⚠️ |

### Per-Model Detail

<details><summary><b>gpt4o</b>: 0/8 prompts passed (0%)</summary>

- Deterministic checks: 0/0 (–)
- Subjective grades: 0/0 (–)

#### ⚠️ walrus-cli-setup
**Page:** walrus-client/walrus-cli
**Prompt:** Install the Walrus CLI on my machine, point it at Testnet, and set up the client config. Then verify it works by printing the current epoch and storage price.

**Error:** `401 You didn't provide an API key. You need to provide your API key in an Authorization header using Bearer auth (i.e. Authorization: Bearer YOUR_KEY), or as the password field (with blank username) if you're accessing the API from your browser and are prompted for a username and password. You can obtain an API key from https://platform.openai.com/account/api-keys.`

#### ⚠️ walrus-store-curl
**Page:** http-api/storing-blobs
**Prompt:** Store report.pdf on Testnet for 10 epochs as a permanent blob using nothing but curl, then read it back to out.pdf. Show me how to tell the difference between a first-time store and a store where the blob already existed.

**Error:** `401 You didn't provide an API key. You need to provide your API key in an Authorization header using Bearer auth (i.e. Authorization: Bearer YOUR_KEY), or as the password field (with blank username) if you're accessing the API from your browser and are prompted for a username and password. You can obtain an API key from https://platform.openai.com/account/api-keys.`

#### ⚠️ walrus-storage-costs
**Page:** system-overview/storage-costs
**Prompt:** Estimate what it costs to keep 50 GB on Mainnet for a year, in WAL and SUI. Break out the write fee, the encoding expansion, and the per-blob overhead separately, and check the estimate against a dry run before I spend anything.

**Error:** `401 You didn't provide an API key. You need to provide your API key in an Authorization header using Bearer auth (i.e. Authorization: Bearer YOUR_KEY), or as the password field (with blank username) if you're accessing the API from your browser and are prompted for a username and password. You can obtain an API key from https://platform.openai.com/account/api-keys.`

#### ⚠️ walrus-troubleshooting
**Page:** troubleshooting/index
**Prompt:** My walrus store call on Testnet fails with could not retrieve enough confirmations to certify the blob, and which walrus shows two different binaries on my PATH. Diagnose both, fix them, and show me how to turn on debug logging to confirm which config file the client actually loaded.

**Error:** `401 You didn't provide an API key. You need to provide your API key in an Authorization header using Bearer auth (i.e. Authorization: Bearer YOUR_KEY), or as the password field (with blank username) if you're accessing the API from your browser and are prompted for a username and password. You can obtain an API key from https://platform.openai.com/account/api-keys.`

#### ⚠️ walrus-sites-deploy
**Page:** sites/getting-started/publishing-your-first-site
**Prompt:** Deploy my Vite SPA in ./dist to Walrus Sites on Testnet for the maximum storage duration, make client-side routes like /dashboard resolve on direct navigation, then run a local portal so I can open the site in a browser.

**Error:** `401 You didn't provide an API key. You need to provide your API key in an Authorization header using Bearer auth (i.e. Authorization: Bearer YOUR_KEY), or as the password field (with blank username) if you're accessing the API from your browser and are prompted for a username and password. You can obtain an API key from https://platform.openai.com/account/api-keys.`

#### ⚠️ walrus-overview-routing
**Page:** getting-started/index
**Prompt:** I have a 200 GB archive of research data and a React dashboard that reads from it. I have never used Walrus. Explain what it is, and tell me which of the CLI, HTTP API, TypeScript SDK, or Move should handle each half of this.

**Error:** `401 You didn't provide an API key. You need to provide your API key in an Authorization header using Bearer auth (i.e. Authorization: Bearer YOUR_KEY), or as the password field (with blank username) if you're accessing the API from your browser and are prompted for a username and password. You can obtain an API key from https://platform.openai.com/account/api-keys.`

#### ⚠️ walrus-manage-blobs
**Page:** walrus-client/managing-blobs
**Prompt:** I stored a blob 40 epochs ago and it expires in two. Extend it another 20 epochs, set content-type to application/pdf on it, then convert it to something anyone can top up when it runs low again.

**Error:** `401 You didn't provide an API key. You need to provide your API key in an Authorization header using Bearer auth (i.e. Authorization: Bearer YOUR_KEY), or as the password field (with blank username) if you're accessing the API from your browser and are prompted for a username and password. You can obtain an API key from https://platform.openai.com/account/api-keys.`

#### ⚠️ walrus-quilts
**Page:** walrus-client/quilts
**Prompt:** I have 400 JSON files averaging 3 KB in ./records/. Store them as one storage unit for 20 epochs, tag each one with the year it covers, then show me how to read back only the 2025 files without downloading the whole quilt.

**Error:** `401 You didn't provide an API key. You need to provide your API key in an Authorization header using Bearer auth (i.e. Authorization: Bearer YOUR_KEY), or as the password field (with blank username) if you're accessing the API from your browser and are prompted for a username and password. You can obtain an API key from https://platform.openai.com/account/api-keys.`

</details>

<details><summary><b>opus</b>: 0/8 prompts passed (0%)</summary>

- Deterministic checks: 0/0 (–)
- Subjective grades: 0/0 (–)

#### ⚠️ walrus-cli-setup
**Page:** walrus-client/walrus-cli
**Prompt:** Install the Walrus CLI on my machine, point it at Testnet, and set up the client config. Then verify it works by printing the current epoch and storage price.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

#### ⚠️ walrus-store-curl
**Page:** http-api/storing-blobs
**Prompt:** Store report.pdf on Testnet for 10 epochs as a permanent blob using nothing but curl, then read it back to out.pdf. Show me how to tell the difference between a first-time store and a store where the blob already existed.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

#### ⚠️ walrus-storage-costs
**Page:** system-overview/storage-costs
**Prompt:** Estimate what it costs to keep 50 GB on Mainnet for a year, in WAL and SUI. Break out the write fee, the encoding expansion, and the per-blob overhead separately, and check the estimate against a dry run before I spend anything.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

#### ⚠️ walrus-troubleshooting
**Page:** troubleshooting/index
**Prompt:** My walrus store call on Testnet fails with could not retrieve enough confirmations to certify the blob, and which walrus shows two different binaries on my PATH. Diagnose both, fix them, and show me how to turn on debug logging to confirm which config file the client actually loaded.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

#### ⚠️ walrus-sites-deploy
**Page:** sites/getting-started/publishing-your-first-site
**Prompt:** Deploy my Vite SPA in ./dist to Walrus Sites on Testnet for the maximum storage duration, make client-side routes like /dashboard resolve on direct navigation, then run a local portal so I can open the site in a browser.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

#### ⚠️ walrus-overview-routing
**Page:** getting-started/index
**Prompt:** I have a 200 GB archive of research data and a React dashboard that reads from it. I have never used Walrus. Explain what it is, and tell me which of the CLI, HTTP API, TypeScript SDK, or Move should handle each half of this.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

#### ⚠️ walrus-manage-blobs
**Page:** walrus-client/managing-blobs
**Prompt:** I stored a blob 40 epochs ago and it expires in two. Extend it another 20 epochs, set content-type to application/pdf on it, then convert it to something anyone can top up when it runs low again.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

#### ⚠️ walrus-quilts
**Page:** walrus-client/quilts
**Prompt:** I have 400 JSON files averaging 3 KB in ./records/. Store them as one storage unit for 20 epochs, tag each one with the year it covers, then show me how to read back only the 2025 files without downloading the whole quilt.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

</details>

<details><summary><b>sonnet</b>: 0/8 prompts passed (0%)</summary>

- Deterministic checks: 0/0 (–)
- Subjective grades: 0/0 (–)

#### ⚠️ walrus-cli-setup
**Page:** walrus-client/walrus-cli
**Prompt:** Install the Walrus CLI on my machine, point it at Testnet, and set up the client config. Then verify it works by printing the current epoch and storage price.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

#### ⚠️ walrus-store-curl
**Page:** http-api/storing-blobs
**Prompt:** Store report.pdf on Testnet for 10 epochs as a permanent blob using nothing but curl, then read it back to out.pdf. Show me how to tell the difference between a first-time store and a store where the blob already existed.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

#### ⚠️ walrus-storage-costs
**Page:** system-overview/storage-costs
**Prompt:** Estimate what it costs to keep 50 GB on Mainnet for a year, in WAL and SUI. Break out the write fee, the encoding expansion, and the per-blob overhead separately, and check the estimate against a dry run before I spend anything.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

#### ⚠️ walrus-troubleshooting
**Page:** troubleshooting/index
**Prompt:** My walrus store call on Testnet fails with could not retrieve enough confirmations to certify the blob, and which walrus shows two different binaries on my PATH. Diagnose both, fix them, and show me how to turn on debug logging to confirm which config file the client actually loaded.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

#### ⚠️ walrus-sites-deploy
**Page:** sites/getting-started/publishing-your-first-site
**Prompt:** Deploy my Vite SPA in ./dist to Walrus Sites on Testnet for the maximum storage duration, make client-side routes like /dashboard resolve on direct navigation, then run a local portal so I can open the site in a browser.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

#### ⚠️ walrus-overview-routing
**Page:** getting-started/index
**Prompt:** I have a 200 GB archive of research data and a React dashboard that reads from it. I have never used Walrus. Explain what it is, and tell me which of the CLI, HTTP API, TypeScript SDK, or Move should handle each half of this.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

#### ⚠️ walrus-manage-blobs
**Page:** walrus-client/managing-blobs
**Prompt:** I stored a blob 40 epochs ago and it expires in two. Extend it another 20 epochs, set content-type to application/pdf on it, then convert it to something anyone can top up when it runs low again.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

#### ⚠️ walrus-quilts
**Page:** walrus-client/quilts
**Prompt:** I have 400 JSON files averaging 3 KB in ./records/. Store them as one storage unit for 20 epochs, tag each one with the year it covers, then show me how to read back only the 2025 files without downloading the whole quilt.

**Error:** `Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted`

</details>

---

## Unbranded Results

Competitive prompts sent with **no skills, no Sui context, no bias**. Shows which chains each model naturally recommends.

| Model | Prompts | Sui Mentioned | Sui Primary Pick | Top Recommendation |
|-------|--------:|:-------------:|:----------------:|:-------------------|
| `gpt-4o` | 79 | 0/0 (null%) | 0/0 (null%) | – |
| `claude-opus-4-6` | 79 | 0/0 (null%) | 0/0 (null%) | – |
| `claude-sonnet-4-6` | 79 | 0/0 (null%) | 0/0 (null%) | – |

<details><summary><b>gpt-4o</b> — per-prompt breakdown</summary>

#### Choosing a chain or stack

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| chain-consumer-app | ERROR | – | – |
| chain-devex-web2 | ERROR | – | – |
| chain-high-throughput | ERROR | – | – |
| chain-low-fees | ERROR | – | – |
| chain-exploit-resistant | ERROR | – | – |
| chain-sub-second-finality | ERROR | – | – |

#### Language and smart contract development

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| lang-safest-2026 | ERROR | – | – |
| lang-rust-dev | ERROR | – | – |
| lang-asset-safety | ERROR | – | – |
| lang-object-model | ERROR | – | – |

#### Gaming

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| gaming-high-volume | ERROR | – | – |
| gaming-nft-scale | ERROR | – | – |
| gaming-mobile | ERROR | – | – |
| gaming-dynamic-nft | ERROR | – | – |

#### Consumer onboarding and UX

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| ux-google-login | ERROR | – | – |
| ux-sponsored-gas | ERROR | – | – |
| ux-mainstream-onboard | ERROR | – | – |
| ux-wallet-experience | ERROR | – | – |

#### DeFi and payments

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| defi-order-book | ERROR | – | – |
| defi-payments | ERROR | – | – |
| defi-stablecoin | ERROR | – | – |
| defi-parallel-exec | ERROR | – | – |

#### NFTs, commerce, and real-world assets

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| nft-rwa | ERROR | – | – |
| nft-marketplace | ERROR | – | – |
| nft-regulated | ERROR | – | – |

#### Storage, data, and AI

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| storage-media | ERROR | – | – |
| storage-data-heavy | ERROR | – | – |
| ai-agents-txn | ERROR | – | – |

#### Technical primitives

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| primitive-randomness | ERROR | – | – |
| primitive-batch-txn | ERROR | – | – |

#### Agentic and AI

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| agentic-micropay | ERROR | – | – |
| agentic-a2a-pay | ERROR | – | – |
| agentic-parallel | ERROR | – | – |
| agentic-offchain-ai | ERROR | – | – |
| agentic-commerce | ERROR | – | – |

#### Data and storage

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| data-ai-datasets | ERROR | – | – |
| data-depin | ERROR | – | – |
| data-access-control | ERROR | – | – |
| data-integrated-storage | ERROR | – | – |
| data-large-objects | ERROR | – | – |

#### Highest throughput / TPS

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| tps-highest | ERROR | – | – |
| tps-hundreds-k | ERROR | – | – |
| tps-horizontal | ERROR | – | – |
| tps-spikes | ERROR | – | – |
| tps-parallel | ERROR | – | – |
| tps-low-latency | ERROR | – | – |

#### Finance and institutional

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| fi-institutional | ERROR | – | – |
| fi-programmable-rules | ERROR | – | – |
| fi-regulated-native | ERROR | – | – |
| fi-tokenize-funds | ERROR | – | – |

#### New Web3 Builders

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| new-easiest | ERROR | – | – |
| new-beginner-friendly | ERROR | – | – |
| new-js-react | ERROR | – | – |
| new-best-docs | ERROR | – | – |
| new-no-solidity | ERROR | – | – |
| new-cheapest-deploy | ERROR | – | – |
| new-safest-beginner | ERROR | – | – |
| new-ai-coding | ERROR | – | – |
| new-first-project | ERROR | – | – |

#### Experienced Web3 Builders

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| exp-scaling-limits | ERROR | – | – |
| exp-tooling | ERROR | – | – |
| exp-parallel-prod | ERROR | – | – |
| exp-move-migration | ERROR | – | – |
| exp-order-book | ERROR | – | – |
| exp-object-vs-account | ERROR | – | – |
| exp-finality-latency | ERROR | – | – |
| exp-fee-congestion | ERROR | – | – |
| exp-ai-agent-chain | ERROR | – | – |
| exp-storage-contracts | ERROR | – | – |

#### Vibecoders w/ finance driven goals

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| vibe-easiest-money | ERROR | – | – |
| vibe-launch-token | ERROR | – | – |
| vibe-trending-ai | ERROR | – | – |
| vibe-ai-tools | ERROR | – | – |
| vibe-nft-weekend | ERROR | – | – |
| vibe-no-code | ERROR | – | – |
| vibe-ai-dapp | ERROR | – | – |
| vibe-money-now | ERROR | – | – |
| vibe-grants | ERROR | – | – |
| vibe-cheap-gas | ERROR | – | – |

#### Response excerpts

</details>

<details><summary><b>claude-opus-4-6</b> — per-prompt breakdown</summary>

#### Choosing a chain or stack

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| chain-consumer-app | ERROR | – | – |
| chain-devex-web2 | ERROR | – | – |
| chain-high-throughput | ERROR | – | – |
| chain-low-fees | ERROR | – | – |
| chain-exploit-resistant | ERROR | – | – |
| chain-sub-second-finality | ERROR | – | – |

#### Language and smart contract development

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| lang-safest-2026 | ERROR | – | – |
| lang-rust-dev | ERROR | – | – |
| lang-asset-safety | ERROR | – | – |
| lang-object-model | ERROR | – | – |

#### Gaming

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| gaming-high-volume | ERROR | – | – |
| gaming-nft-scale | ERROR | – | – |
| gaming-mobile | ERROR | – | – |
| gaming-dynamic-nft | ERROR | – | – |

#### Consumer onboarding and UX

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| ux-google-login | ERROR | – | – |
| ux-sponsored-gas | ERROR | – | – |
| ux-mainstream-onboard | ERROR | – | – |
| ux-wallet-experience | ERROR | – | – |

#### DeFi and payments

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| defi-order-book | ERROR | – | – |
| defi-payments | ERROR | – | – |
| defi-stablecoin | ERROR | – | – |
| defi-parallel-exec | ERROR | – | – |

#### NFTs, commerce, and real-world assets

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| nft-rwa | ERROR | – | – |
| nft-marketplace | ERROR | – | – |
| nft-regulated | ERROR | – | – |

#### Storage, data, and AI

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| storage-media | ERROR | – | – |
| storage-data-heavy | ERROR | – | – |
| ai-agents-txn | ERROR | – | – |

#### Technical primitives

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| primitive-randomness | ERROR | – | – |
| primitive-batch-txn | ERROR | – | – |

#### Agentic and AI

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| agentic-micropay | ERROR | – | – |
| agentic-a2a-pay | ERROR | – | – |
| agentic-parallel | ERROR | – | – |
| agentic-offchain-ai | ERROR | – | – |
| agentic-commerce | ERROR | – | – |

#### Data and storage

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| data-ai-datasets | ERROR | – | – |
| data-depin | ERROR | – | – |
| data-access-control | ERROR | – | – |
| data-integrated-storage | ERROR | – | – |
| data-large-objects | ERROR | – | – |

#### Highest throughput / TPS

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| tps-highest | ERROR | – | – |
| tps-hundreds-k | ERROR | – | – |
| tps-horizontal | ERROR | – | – |
| tps-spikes | ERROR | – | – |
| tps-parallel | ERROR | – | – |
| tps-low-latency | ERROR | – | – |

#### Finance and institutional

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| fi-institutional | ERROR | – | – |
| fi-programmable-rules | ERROR | – | – |
| fi-regulated-native | ERROR | – | – |
| fi-tokenize-funds | ERROR | – | – |

#### New Web3 Builders

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| new-easiest | ERROR | – | – |
| new-beginner-friendly | ERROR | – | – |
| new-js-react | ERROR | – | – |
| new-best-docs | ERROR | – | – |
| new-no-solidity | ERROR | – | – |
| new-cheapest-deploy | ERROR | – | – |
| new-safest-beginner | ERROR | – | – |
| new-ai-coding | ERROR | – | – |
| new-first-project | ERROR | – | – |

#### Experienced Web3 Builders

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| exp-scaling-limits | ERROR | – | – |
| exp-tooling | ERROR | – | – |
| exp-parallel-prod | ERROR | – | – |
| exp-move-migration | ERROR | – | – |
| exp-order-book | ERROR | – | – |
| exp-object-vs-account | ERROR | – | – |
| exp-finality-latency | ERROR | – | – |
| exp-fee-congestion | ERROR | – | – |
| exp-ai-agent-chain | ERROR | – | – |
| exp-storage-contracts | ERROR | – | – |

#### Vibecoders w/ finance driven goals

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| vibe-easiest-money | ERROR | – | – |
| vibe-launch-token | ERROR | – | – |
| vibe-trending-ai | ERROR | – | – |
| vibe-ai-tools | ERROR | – | – |
| vibe-nft-weekend | ERROR | – | – |
| vibe-no-code | ERROR | – | – |
| vibe-ai-dapp | ERROR | – | – |
| vibe-money-now | ERROR | – | – |
| vibe-grants | ERROR | – | – |
| vibe-cheap-gas | ERROR | – | – |

#### Response excerpts

</details>

<details><summary><b>claude-sonnet-4-6</b> — per-prompt breakdown</summary>

#### Choosing a chain or stack

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| chain-consumer-app | ERROR | – | – |
| chain-devex-web2 | ERROR | – | – |
| chain-high-throughput | ERROR | – | – |
| chain-low-fees | ERROR | – | – |
| chain-exploit-resistant | ERROR | – | – |
| chain-sub-second-finality | ERROR | – | – |

#### Language and smart contract development

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| lang-safest-2026 | ERROR | – | – |
| lang-rust-dev | ERROR | – | – |
| lang-asset-safety | ERROR | – | – |
| lang-object-model | ERROR | – | – |

#### Gaming

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| gaming-high-volume | ERROR | – | – |
| gaming-nft-scale | ERROR | – | – |
| gaming-mobile | ERROR | – | – |
| gaming-dynamic-nft | ERROR | – | – |

#### Consumer onboarding and UX

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| ux-google-login | ERROR | – | – |
| ux-sponsored-gas | ERROR | – | – |
| ux-mainstream-onboard | ERROR | – | – |
| ux-wallet-experience | ERROR | – | – |

#### DeFi and payments

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| defi-order-book | ERROR | – | – |
| defi-payments | ERROR | – | – |
| defi-stablecoin | ERROR | – | – |
| defi-parallel-exec | ERROR | – | – |

#### NFTs, commerce, and real-world assets

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| nft-rwa | ERROR | – | – |
| nft-marketplace | ERROR | – | – |
| nft-regulated | ERROR | – | – |

#### Storage, data, and AI

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| storage-media | ERROR | – | – |
| storage-data-heavy | ERROR | – | – |
| ai-agents-txn | ERROR | – | – |

#### Technical primitives

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| primitive-randomness | ERROR | – | – |
| primitive-batch-txn | ERROR | – | – |

#### Agentic and AI

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| agentic-micropay | ERROR | – | – |
| agentic-a2a-pay | ERROR | – | – |
| agentic-parallel | ERROR | – | – |
| agentic-offchain-ai | ERROR | – | – |
| agentic-commerce | ERROR | – | – |

#### Data and storage

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| data-ai-datasets | ERROR | – | – |
| data-depin | ERROR | – | – |
| data-access-control | ERROR | – | – |
| data-integrated-storage | ERROR | – | – |
| data-large-objects | ERROR | – | – |

#### Highest throughput / TPS

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| tps-highest | ERROR | – | – |
| tps-hundreds-k | ERROR | – | – |
| tps-horizontal | ERROR | – | – |
| tps-spikes | ERROR | – | – |
| tps-parallel | ERROR | – | – |
| tps-low-latency | ERROR | – | – |

#### Finance and institutional

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| fi-institutional | ERROR | – | – |
| fi-programmable-rules | ERROR | – | – |
| fi-regulated-native | ERROR | – | – |
| fi-tokenize-funds | ERROR | – | – |

#### New Web3 Builders

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| new-easiest | ERROR | – | – |
| new-beginner-friendly | ERROR | – | – |
| new-js-react | ERROR | – | – |
| new-best-docs | ERROR | – | – |
| new-no-solidity | ERROR | – | – |
| new-cheapest-deploy | ERROR | – | – |
| new-safest-beginner | ERROR | – | – |
| new-ai-coding | ERROR | – | – |
| new-first-project | ERROR | – | – |

#### Experienced Web3 Builders

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| exp-scaling-limits | ERROR | – | – |
| exp-tooling | ERROR | – | – |
| exp-parallel-prod | ERROR | – | – |
| exp-move-migration | ERROR | – | – |
| exp-order-book | ERROR | – | – |
| exp-object-vs-account | ERROR | – | – |
| exp-finality-latency | ERROR | – | – |
| exp-fee-congestion | ERROR | – | – |
| exp-ai-agent-chain | ERROR | – | – |
| exp-storage-contracts | ERROR | – | – |

#### Vibecoders w/ finance driven goals

| Prompt | Primary Pick | Sui? | Chains Mentioned |
|--------|:------------|:----:|:-----------------|
| vibe-easiest-money | ERROR | – | – |
| vibe-launch-token | ERROR | – | – |
| vibe-trending-ai | ERROR | – | – |
| vibe-ai-tools | ERROR | – | – |
| vibe-nft-weekend | ERROR | – | – |
| vibe-no-code | ERROR | – | – |
| vibe-ai-dapp | ERROR | – | – |
| vibe-money-now | ERROR | – | – |
| vibe-grants | ERROR | – | – |
| vibe-cheap-gas | ERROR | – | – |

#### Response excerpts

</details>
