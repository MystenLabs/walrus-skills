# Seal SDK Integration Guide

Source: https://seal-docs.wal.app/ and https://www.npmjs.com/package/@mysten/seal

This reference file covers the practical details of integrating the Seal TypeScript SDK with Walrus for encrypted blob storage. For the conceptual overview of Walrus data security, see the parent SKILL.md.

## Overview

Seal provides threshold encryption with onchain access control. The workflow is:
1. Define an access policy as a Move smart contract on Sui
2. Encrypt data client-side using the Seal SDK (threshold encryption)
3. Store the ciphertext on Walrus (it is safe because it is encrypted)
4. To decrypt, the requesting user proves they meet the access policy; Seal key servers provide decryption shares

No single key server holds the full decryption key. A threshold of key servers must participate.

## Installation

```bash
npm install @mysten/seal @mysten/sui
```

## Client initialization

```typescript
import { SealClient } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });

const sealClient = new SealClient({
  suiClient,
  network: 'mainnet',  // or 'testnet'
});
```

## Key server object IDs

Seal requires key server object IDs for the target network. These identify the on-chain key server registry that coordinates threshold decryption.

**Important:** Key server object IDs are different for testnet and mainnet. Check the [Seal documentation](https://seal-docs.wal.app/) for the current values. Do not hardcode them — they may change with upgrades.

If you are building a frontend, these are commonly set as environment variables:
```
NEXT_PUBLIC_SEAL_PACKAGE_ID=<seal-package-id>
```

## Encryption flow

```typescript
// 1. Build a policy transaction (defines who can decrypt)
const tx = new Transaction();
// ... add your access control logic (allowlist check, token gate, etc.)

// 2. Encrypt the data
const { encryptedData, encryptionKey } = await sealClient.encrypt({
  data: plaintextBytes,  // Uint8Array
  policyId: '<POLICY_OBJECT_ID>',
  threshold: 2,  // number of key servers needed for decryption
});

// 3. Store the encrypted data on Walrus
const result = await walrusClient.walrus.storeBlob({
  blob: encryptedData,
  epochs: 30,
});
```

## Decryption flow

```typescript
// 1. Read the encrypted blob from Walrus
const encryptedData = await walrusClient.walrus.readBlob({ blobId: '<BLOB_ID>' });

// 2. Build the policy check transaction
const tx = new Transaction();
tx.setSender(userAddress);  // CRITICAL: must match the requesting address
// ... add policy verification calls

// 3. Decrypt
const decryptedData = await sealClient.decrypt({
  data: encryptedData,
  tx,
});
```

## The `seal_approve` Move function

Access policies are implemented as Move modules that export a `seal_approve` function. This function is called during decryption to verify the requester meets the policy conditions.

Example: allowlist-based access control:
```move
module my_policy::access {
    use seal::seal;

    public fun seal_approve(
        allowlist: &Allowlist,
        id: vector<u8>,
        ctx: &TxContext,
    ) {
        // Verify the sender is on the allowlist
        assert!(allowlist.contains(ctx.sender()), ENotAllowed);
        seal::approve(id, ctx);
    }
}
```

The `seal::approve(id, ctx)` call at the end signals to the key servers that this requester is authorized for the given encryption ID.

## Access control patterns

| Pattern | Description |
|---------|------------|
| **Allowlist** | Only specific addresses can decrypt. Managed via a shared Sui object. |
| **Token gate** | Only holders of a specific NFT or coin can decrypt. |
| **Time lock** | Data becomes decryptable after a specific epoch or timestamp. |
| **Subscription** | Decryption tied to an active subscription NFT. Access follows token transfers. |
| **Role-based** | Capabilities or role objects control access. |

## Session signing

Seal decryption requires the wallet to sign multiple transactions (one per key server in the threshold). To avoid prompting the user for each signature:

- **Wallets with session signing support:** The wallet signs once for a session, and subsequent signatures happen automatically.
- **Wallets without session support:** The user must approve each signature individually. This creates a poor UX for high-threshold configurations.

If the wallet does not support sessions, you get:
```
Connected wallet does not support Seal session signing
```

**Workaround:** Implement a manual approval flow, or recommend users switch to a wallet that supports Seal sessions.

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Transaction was not signed by the correct sender` | Missing `tx.setSender(address)` or sender mismatch | Set `tx.setSender(userAddress)` before passing to Seal |
| `Connected wallet does not support Seal session signing` | Wallet does not implement session protocol | Use a compatible wallet or manual per-signature approval |
| `PolicyNotFound` | The policy object ID is wrong or on the wrong network | Verify the policy object exists on the target network |
| `ThresholdNotMet` | Not enough key servers responded | Retry; some key servers may be temporarily unavailable |
| `DecryptionFailed` | Ciphertext was not encrypted with this policy | Verify the policy ID matches what was used during encryption |

## Limitations

- **Not for HIPAA/PHI or government-classified data.** Seal assumes threshold trust among key servers. This may not meet strict regulatory requirements.
- **Key servers must be online for decryption.** If fewer than the threshold number of key servers are available, decryption fails.
- **Ciphertext is still public on Walrus.** The encrypted blob is visible to anyone. Security relies entirely on the encryption, not on obscurity.
- **Self-hosting key servers is possible but complex.** The Docker image is at `ghcr.io/mystenlabs/seal/key-server`. Check the Seal docs for setup instructions.
