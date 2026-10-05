# Phase 5 — Operations and release readiness

Date: 2026-10-04

## Observability contract

Every upload request receives an `x-request-id`. The same UUID is passed to the durable job and stored with route and worker events. `operational_events` contains safe identifiers, states, timings, error codes, and bounded metadata. It must never contain PDF text, chat messages, prompts, summaries, email addresses, authentication data, or provider secrets.

AI provider attempts remain in `ai_generation_runs`, including stage, provider, model, latency, token counts when available, estimated cost, result, and quality metadata.

The scheduled operational monitor reads `get_operational_health(24)` every ten minutes. It reports:

- job totals, active count, success rate, and oldest active job;
- AI success rate, average latency, estimated cost, and fallback runs;
- operational errors, warnings, and sync conflicts.

## Alert thresholds

| Alert | Threshold | First action |
| --- | --- | --- |
| Stuck job | Oldest active job is at least 60 minutes old | Inspect the correlation and attempt timelines, then retry or close the attempt |
| Job failure spike | At least 5 failed or dead letter jobs in 24 hours | Group by failure code and recent deployment |
| AI failure spike | At least 10 failed provider attempts in 24 hours | Check provider status, credentials, model availability, and fallback rate |

Alerts currently appear in the Inngest run log. Before a wider public launch, connect those logs to the hosting provider's alert destination.

## Incident workflow

1. Record the incident start time and the user supplied request ID.
2. Query `operational_events` by `correlation_id` without opening source content.
3. Follow `attempt_id` into `processing_attempts` and `ai_generation_runs`.
4. Determine whether usage is reserved, consumed, or refunded in `usage_ledger`.
5. Stop repeated damage by disabling the affected provider or route at deployment configuration level.
6. Recover stuck jobs through the existing retry or dead letter flow.
7. Record the cause, affected window, mitigation, and follow-up migration or code change.

## Retention and deletion

- Operational events: 90 days.
- AI generation telemetry: 180 days.
- Weekly `purge-operational-data` performs both cleanups.
- Study source files and generated kits remain until the learner deletes the material or account.
- `DELETE /api/account` authenticates the caller, removes their Storage objects, and hard deletes the Supabase Auth user. Foreign-key cascades remove profiles, materials, attempts, scores, usage, and AI telemetry.
- Database backups may temporarily retain deleted rows until the provider backup window expires. This must be stated in the published privacy policy.

## Backup and restore runbook

1. Confirm the Supabase project's scheduled backup and point-in-time recovery settings before launch.
2. Record the most recent successful backup timestamp daily.
3. For a restore drill, create an isolated project and restore the selected backup there.
4. Apply any migrations newer than the backup in timestamp order.
5. Compare row counts for users, materials, attempts, ledger entries, and quiz results.
6. Confirm RLS remains enabled and service-role functions retain restricted grants.
7. Run one synthetic upload, failure refund, chat reservation, and idempotent quiz replay in the isolated project.
8. Destroy the isolated restore after recording the outcome. Never test restoration over production.

Migration rollback uses a forward corrective migration. Do not delete an applied migration or manually rewrite production history.

## Database performance review

The current access paths have supporting indexes for material owner and status queries, attempts by material and user, stale active attempts, AI runs by attempt and provider result, usage by active entitlement window, quiz replay keys, and operations by correlation, attempt, user, and failure time.

Capture query plans from production-like data before changing indexes. Remove or add indexes only from measured query plans because every index also increases write cost.

## Security and privacy review

- Service role credentials remain server only and `.env*` files are ignored.
- No tracked private keys or provider credentials were found in the source scan.
- Database telemetry tables have RLS enabled and no browser grants.
- Expensive AI and mutation routes authenticate independently.
- Standard response headers block framing, MIME sniffing, unnecessary device capabilities, and unsafe referrer disclosure.
- API and Supabase responses bypass the first-party service worker cache, preventing authenticated responses from being written there.
- A strict Content Security Policy still requires a nonce-based rollout because the application and boot page currently use inline styles and scripts.

## PWA review

The install manifest starts at `/home`, uses root scope, has standalone display, and provides 192 and 512 pixel icon declarations. API and Supabase requests are never cached by the service worker. The offline fallback explains when a page is unavailable. Offline quiz writes use the durable IndexedDB queue described in Phase 4.
