# Phase 2 — Durable ingestion and job orchestration

## Implemented contract

- The browser uploads the PDF to the user's private Storage folder, then sends only file metadata and one idempotency key to the authenticated server route.
- The server validates ownership, PDF type, actual byte size, plan size limit, readable content, page count, and page allowance.
- `processing_attempts` records each durable job, its queue/run state, heartbeat, failure code, retryability, and terminal timestamps.
- `register_material_attempt` returns the same material and attempt for duplicate requests with the same user and idempotency key.
- `reserve_and_queue_material` locks the user's plan and usage rows, then reserves generation and page quota in one database transaction.
- `set_processing_attempt_state` completes, cancels, fails, or dead-letters a job and releases reserved quota at most once.
- Inngest runs one singleton job per attempt, retries processing twice, and records exhausted retries as dead-letter failures.
- A scheduled recovery job closes active attempts that have not reported a heartbeat for one hour.
- `POST /api/process-material/retry` creates a new numbered attempt for a failed material and reserves its quota atomically.
- `GET /api/process-material/[id]` is the authenticated source for durable job status and structured failures.
- Cancellation updates the job and refunds quota atomically, then removes the stored file.
- Deleting a material removes its stored file before deleting its database row and related attempts.

## Failure codes

| Code | Meaning |
|---|---|
| `STORAGE_DOWNLOAD_FAILED` | The registered private file could not be loaded. |
| `FILE_METADATA_MISMATCH` | Actual file size did not match the registered upload. |
| `DOCUMENT_PARSE_FAILED` | The PDF had no readable text or parsing failed. |
| `DOCUMENT_PAGE_LIMIT` | A free-plan document exceeded 50 pages. |
| `WEEKLY_PAGE_LIMIT` | Reserving the document would exceed 100 pages for the current pool. |
| `QUOTA_RESERVATION_FAILED` | The atomic reservation could not complete. |
| `QUEUE_DISPATCH_FAILED` | Inngest did not accept the job; reserved quota was released. |
| `PROCESSING_RETRIES_EXHAUSTED` | The worker failed after its retry policy. |
| `STALE_PROCESSING_JOB` | An active job stopped reporting progress for one hour. |
| `USER_CANCELLED` | The learner cancelled processing. |

## Deployment order

1. Apply `20261004011616_phase2_durable_ingestion.sql`.
2. Regenerate database types from the linked project if the hosted schema differs from the committed type file.
3. Deploy the Next.js application and register both Inngest functions.
4. Confirm the scheduled stale-job recovery function appears in Inngest.
