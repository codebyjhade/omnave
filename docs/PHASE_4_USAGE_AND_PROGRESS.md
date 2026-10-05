# Phase 4 — Usage, plans, and progress

Date: 2026-10-04

## Server owned plan policy

| Entitlement | Free | Pro | Window |
| --- | ---: | ---: | --- |
| Generated study kits | 3 | 100 | Learner local month |
| Processed PDF pages | 100 | 2,000 | Learner local week |
| Tutor messages | 15 | 200 | Learner local day |
| Pages per document | 50 | 250 | Per document |
| File size | 15 MB | 50 MB | Per upload |

The database table `plan_entitlements` is the source of truth. UI labels and preflight checks read `/api/usage/summary`; they do not define or enforce limits.

## Usage lifecycle

Every charge starts as `RESERVED` with a caller supplied idempotency key. A successful operation changes it to `CONSUMED`. A failed or cancelled operation changes it to `REFUNDED`. Abandoned reservations become `EXPIRED` after their entitlement window.

Reservations lock the learner profile row, calculate the relevant window in the saved IANA timezone, count active units, and insert the ledger entry in one transaction. Concurrent requests therefore cannot both spend the same remaining allowance.

Material processing reserves one generation and its page count. Completion consumes both entries. Failure, cancellation, or dead letter handling refunds both entries. Existing profile and usage counters remain temporary compatibility projections; enforcement uses `usage_ledger`.

## Quiz progress and XP

`POST /api/progress/quiz` calls one database function that validates material ownership, records the quiz result, awards XP, and updates the streak. Its mutation ID is unique per learner. Replaying the same payload returns the original result; replaying different content under the same ID returns HTTP 409.

XP is calculated by the database as 10 points per correct answer plus 20 points for a perfect result. The browser cannot select its own award. Streak dates use the learner's browser supplied IANA timezone after database validation, and the accepted timezone is saved to the profile.

## Offline replay

Quiz mutations are written to an IndexedDB backed queue before the request starts. Network failures keep the mutation for replay. Loading progress while online replays pending entries. A successful or idempotent response removes the entry. A 409 response keeps the entry with its conflict message for recovery instead of silently replacing either result.

## Public server contracts

- `GET /api/usage/summary`: plan limits, consumed and reserved units, remaining units, and reset times.
- `POST /api/progress/quiz`: atomic, idempotent quiz result and learner progress update.
- `reserve_usage` and `settle_usage`: service role only database functions used by chat and processing routes.
- `record_quiz_progress`: service role only database function used by the quiz route.

Direct browser writes to XP, streak fields, and quiz scores are revoked.
