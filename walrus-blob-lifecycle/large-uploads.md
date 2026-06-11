# Large Data Upload Patterns

Source: https://docs.wal.app/docs/large-uploads

The maximum blob size on Walrus is approximately 13.6 GiB. Uploading large datasets or individual blobs larger than 1 GiB requires planning for optimal performance.

## Estimate storage duration and costs

- Use the [Walrus cost calculator](https://costcalculator.wal.app/) or `walrus info` to estimate costs.
- Calculate storage duration in months, not epochs. A Mainnet epoch is 14 days.
- Validate assumptions against `walrus info` output, which shows the price per encoded storage unit and write fee.
- Include a cost buffer for large datasets to account for potential epoch duration or pricing changes.

## Tune uploads for large blobs (>1 GiB)

- Test uploads with representative dataset sizes before production workloads.
- Use batching or chunking strategies for datasets approaching the 13.6 GiB maximum.
- Monitor upload throughput and adjust client parameters based on observed performance.

## Use local tooling for upload observability

External publishers or managed upload paths might offer limited visibility into upload progress.

- Use the Walrus CLI or local SDK tooling when upload visibility matters.
- Log upload state (blob IDs, transaction digests, epoch information) for debugging large ingestion jobs.
- Prefer workflows that expose progress indicators for operational pipelines.

## Persist upload state in ingestion pipelines

Large workflows should tolerate failures and support retries.

- Persist blob IDs and transaction references between pipeline steps so that a failed step can resume without re-uploading.
- Design pipelines with the assumption that any step might fail and need retry.
- Implement cleanup workflows for partial uploads (for example, delete orphaned blob registrations that were never certified).
- Track the **point of availability (PoA)** for each blob. A blob is only guaranteed retrievable after its availability certificate is posted onchain. If the pipeline fails between registration and certification, the blob is not yet available and you need to retry.

## Manage upload throughput

- Ramp upload traffic gradually instead of large bursts.
- Monitor throughput during large ingestion jobs; reduce upload rate if error rates increase or confirmations slow.
- Batch uploads where possible to reduce individual transaction count.
- For very large migrations (TiB or more), coordinate with the Walrus team through the [Walrus Discord](https://discord.gg/walrusprotocol) to plan the ingestion schedule.

## Manage memory for concurrent uploads

Erasure coding adds memory overhead per blob. Each upload requires approximately **4.5x the blob size** in memory because erasure coding expands data into redundant shards the client holds during encoding.

- Limit concurrent upload workers based on available RAM.
- Estimate total memory as: `blob_size x 4.5 x concurrent_uploads`.
- Scale horizontally across multiple machines rather than increasing concurrency on a single host.

## Quick reference

| Constraint | Value |
|------------|-------|
| Maximum blob size | ~13.6 GiB |
| Mainnet epoch duration | 14 days |
| Maximum storage duration | 53 epochs (~2 years) |
| Memory per upload | ~4.5x blob size |
| Cost estimation tool | https://costcalculator.wal.app/ |
