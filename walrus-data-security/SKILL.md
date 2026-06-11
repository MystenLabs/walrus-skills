---
name: walrus-data-security
description: >
  Encrypting data before storing on Walrus using Seal (threshold encryption with
  onchain access control). Use when the user needs to store private or sensitive data
  on Walrus, implement access control for blob content, encrypt blobs before uploading,
  use @mysten/seal for threshold encryption, or understand Walrus data security
  guarantees (availability, integrity, confidentiality). Also use when the user asks
  about Nautilus (TEE-based off-chain computation) in the context of Walrus data.
  All blobs on Walrus are public by default.
---

# Walrus Data Security

> **Source constraint:** All information in this skill is sourced from the
> [Walrus data security documentation](https://docs.wal.app/docs/data-security)
> and the [Seal SDK documentation](https://seal-docs.wal.app/).
> When extending this skill, only pull from these sources.

All data stored on Walrus is public and discoverable by anyone. Blob IDs are not secrets. If your use case requires data confidentiality or access control, you must encrypt data before uploading. Seal is the recommended encryption solution for onchain access control with Walrus.

All patterns in this skill are derived from:
- https://docs.wal.app/docs/data-security
- https://seal-docs.wal.app/
- https://www.npmjs.com/package/@mysten/seal

If unsure about Seal or Walrus security, fetch the relevant page before answering.

---

## Related skills

| Topic | Skill | Load when |
|-------|-------|-----------|
| Storing blobs | `walrus-cli` or `walrus-ts-sdk` | Uploading blobs (after encryption) |
| HTTP API | `walrus-http-api` | Storing encrypted data via REST |
| Blob lifecycle | `walrus-blob-lifecycle` | Managing encrypted blob lifetimes |
| Move integration | `walrus-move-integration` | Onchain access policies for Seal |
| Troubleshooting | `walrus-troubleshooting` | Seal error messages and fixes |

---

## Reference files

### seal-sdk — Seal SDK Integration Guide
**Path:** `seal-sdk.md`
**Load when:** integrating the `@mysten/seal` TypeScript SDK, writing `seal_approve` Move functions, configuring key server object IDs, implementing encryption/decryption flows, or debugging Seal-specific errors (session signing, sender mismatch, threshold not met).
**Covers:** SealClient initialization, key server IDs, encryption/decryption flow, `seal_approve` Move function pattern, access control patterns (allowlist, token gate, time lock), session signing, common errors table, limitations.

---

## Routing guide

| Task | Load |
|------|------|
| Understand Walrus security guarantees | Skill Content below |
| Encrypt data before storing on Walrus | `seal-sdk.md` |
| Write a Seal access policy in Move | `seal-sdk.md` |
| Debug Seal encryption/decryption errors | `seal-sdk.md` |
| Set up Nautilus TEE computation | Skill Content below |
| Decide whether to use Seal or custom encryption | Skill Content below |

---

## Skill Content

### Key concepts

- **All Walrus blobs are public.** Anyone with a blob ID can fetch the blob. There is no native encryption or access control in Walrus itself. Blob IDs are not secrets.

- **Encrypt before uploading.** To store private data, encrypt it client-side before calling any Walrus store operation. Walrus stores the ciphertext. Only parties with decryption keys can read the plaintext.

- **Seal.** A threshold encryption system where no single party holds the full decryption key. You define onchain access policies (Move smart contracts) that determine who can decrypt and under what conditions. Seal integrates directly with Walrus and the Sui blockchain.

- **Nautilus.** A framework for secure off-chain computation using trusted execution environments (TEEs). Use Nautilus for hybrid apps that need private data processing, AI inference, or Web2 integration with onchain verification.

### Data availability guarantees

- **Write threshold:** Blobs can be written and remain available as long as 2/3 of shards are operated by honest storage nodes.
- **Read threshold:** After data is written, reads are possible even if only 1/3 of nodes are available.
- **Point of availability (PoA):** Observable through a Sui event. Before PoA, you are responsible for blob availability. After PoA, Walrus maintains it for the full storage period.
- **Inconsistency proofs:** If a blob is incorrectly encoded, storage nodes produce an inconsistency proof and reads return `None`. Correctly stored blobs cannot have false inconsistency proofs.

### Data integrity

Walrus guarantees that data read matches what the uploader intended. Because encoding is client-side, it is possible for encoding to be incorrect (by mistake or on purpose). The consistency check mechanisms (default and strict) detect and handle this.

### Seal: Threshold encryption with onchain access control

Seal provides:
- **Threshold encryption:** No single party holds the full decryption key.
- **Onchain access policies:** Move smart contracts define who can decrypt and under what conditions.
- **Seamless Walrus integration:** Encrypt locally, store ciphertext on Walrus, define access rules on Sui.

#### Use cases for Seal

- Sensitive off-chain content: user documents, game assets, private messages
- Time-locked or token-gated data
- Data shared between trusted parties or roles

#### Installation

```bash
npm install @mysten/seal
```

#### Seal SDK initialization

```typescript
import { SealClient } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';

const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });
const sealClient = new SealClient({ suiClient, network: 'mainnet' });
```

#### Important: Set the transaction sender

When building a programmable transaction block (PTB) for Seal policy checks, set the transaction sender before passing the PTB to Seal. The sender must match the address requesting decryption access:

```typescript
tx.setSender(address);
```

If the sender is missing or does not match, decryption fails with `Transaction was not signed by the correct sender`.

#### Wallet session signing

Seal decryption requires the wallet to sign multiple transactions. Some wallets support **session signing** to avoid repeated approval prompts. If the connected wallet does not support session signing, you get `Connected wallet does not support Seal session signing`. In that case, the user must approve each signature individually, or use a different wallet that supports sessions.

### Nautilus: Secure off-chain computation

Nautilus enables delegating sensitive or resource-intensive tasks to a self-managed trusted execution environment (TEE) while preserving onchain trust through smart contract verification.

- Currently supports self-managed AWS Nitro Enclave TEEs
- Attestations are verified onchain using Move smart contracts
- Use for: trusted oracles, AI agents, DePIN, fraud prevention, identity management

To get started: https://docs.sui.io/concepts/cryptography/nautilus/using-nautilus

### Rules

1. **Always encrypt sensitive data before uploading to Walrus.** There is no server-side encryption. All blobs are public.
2. **Blob IDs are not secrets.** Anyone with a blob ID can fetch the blob content. Security comes from encryption, not obscurity.
3. **Use Seal for onchain access control.** If you want decryption tied to blockchain state (token ownership, time locks, role membership), Seal is the recommended solution.
4. **Set `tx.setSender(address)` before Seal PTBs.** Missing or mismatched sender causes decryption to fail.
5. **Delete does not guarantee privacy.** Even after deletion, copies might exist in caches, past storage nodes, or user downloads. Encryption is the only reliable privacy mechanism.

### Common mistakes

- **Storing sensitive data unencrypted on Walrus.** All blobs are public. Without encryption, anyone can read them.
- **Assuming blob IDs are secret.** They are deterministic, derived from content. If someone has the content, they can compute the blob ID. If they have the blob ID, they can fetch the content.
- **Forgetting `tx.setSender()` in Seal transactions.** The sender must be set explicitly on the PTB before passing it to Seal. This is the most common Seal integration error.
- **Relying on delete for privacy.** Deletion removes slivers from current/future storage nodes but does not affect caches, past nodes, or copies others have made. Encrypt first.
- **Confusing Seal with Walrus-native encryption.** Walrus itself has no encryption feature. Seal is a separate system that works alongside Walrus.
- **`Connected wallet does not support Seal session signing`.** Not all wallets support Seal's session signing protocol. Check wallet compatibility or implement manual per-signature approval.
- **Using Seal for HIPAA/PHI or government-classified data.** Seal is not designed for highly regulated data. Its threat model assumes threshold trust among key servers, which might not meet regulatory requirements.
- **Not specifying Seal key server object IDs.** The Seal client needs the correct key server object IDs for the target network. These are different for testnet and mainnet. Check the [Seal documentation](https://seal-docs.wal.app/) for current values.
