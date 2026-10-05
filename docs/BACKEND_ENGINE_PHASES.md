# Omnave backend and engine upgrade: Phases 1–5

Date: 2026-10-03

## Working rule

Complete and verify one phase before starting the next. Each phase ends with a documented contract, implementation evidence, and a clear pass/fail gate.

## Review of the existing UX resolution

`audit-2026-10-02/PHASE_1_RESOLUTION.md` documents useful UI changes for first use, upload, Library, and lesson offline messaging. It should be treated as a **UX implementation draft with verification pending**, because the current code still relies on `navigator.onLine`, describes processed kits as offline without proving each asset is cached, and claims progress will sync without an implemented durable sync queue. Those UX changes remain in place while the backend work defines the real states they must display.

## Phase 1 — Data, security, and state contracts

**Goal:** create a dependable backend contract that every screen, API route, job, and AI provider uses.

### Scope

- Add the Supabase schema and migration history to source control.
- Document and type the tables currently inferred from the app: `profiles`, `materials`, `user_usage`, and `quiz_scores`.
- Define one material/job state model with permitted transitions and terminal states.
- Add generated database types and remove duplicated handwritten row shapes where practical.
- Centralize authenticated server client creation and caller identification.
- Require ownership checks on every user-scoped API operation.
- Define RLS and Storage policies for each table and object path.
- Replace ambiguous booleans such as `is_processed` as the primary lifecycle signal.
- Define a stable API error envelope and safe server logging fields.

### Immediate risks this phase must resolve

- `DELETE /api/materials/[id]` uses the service-role client and does not authenticate or compare the material owner.
- No migration files currently explain the production schema, constraints, RLS policies, triggers, or Storage policies.
- Material status values mix upper and lower case and include `PROCESSING`, `PARSING_DOCUMENT`, `GENERATING_SUMMARY`, `BUILDING_ASSESSMENTS`, `COMPLETED`, `failed`, and `cancelled`.
- Browser code writes lifecycle states directly, while server routes and Inngest also write them.
- The service-role client is a global unrestricted client; mistakes in route filters can bypass RLS for every user.
- Profile creation occurs from browser code when a profile is missing, so account initialization is not guaranteed to be atomic.

### Completion gate

- A fresh database can be reconstructed from committed migrations.
- RLS and Storage ownership rules are explicit and reviewable.
- Every protected route authenticates the caller and scopes reads/writes to that caller.
- All job transitions use the shared state contract.
- Invalid transitions and cross-user reads, updates, deletes, and storage access are rejected.

### Plugin and reference needs

- **Supabase plugin:** schema inspection, migrations, RLS, Storage policies, database types, and advisors.
- **Local Next.js 16 documentation:** route handlers, proxy authentication, server/client boundaries, and caching behavior.

## Phase 2 — Reliable ingestion and job orchestration

**Goal:** make PDF upload and study-kit processing durable, idempotent, resumable, and observable.

### Scope

- Move authoritative upload registration and quota reservation to the server.
- Use an idempotency key and a durable processing-attempt record.
- Validate file type, size, ownership, and page limits on the server.
- Make quota reservation, job creation, completion, failure, cancellation, and refund atomic.
- Replace browser polling assumptions with a durable job status API or authenticated realtime subscription.
- Add retry policy, timeout policy, dead-letter handling, and stale-job recovery.
- Store structured failure codes that can be translated into useful UI messages.

### Completion gate

- Refreshing or closing the browser does not lose a job.
- Duplicate requests cannot double-charge usage or create duplicate kits.
- Cancellation and failure leave the database, Storage, usage ledger, and UI consistent.
- A stale or interrupted job can be diagnosed and safely resumed or retried.

### Plugin needs

- **Supabase plugin** for database transactions, Realtime, Storage, and queue-related data design.

## Phase 3 — AI engine quality and provider control

**Goal:** produce consistent study kits with measurable quality, predictable cost, and controlled fallbacks.

### Scope

- Replace the broad provider waterfall with a small, configurable provider policy.
- Pin current supported model names and capabilities.
- Version prompts and output schemas.
- Validate structured output strictly; reject placeholder or fabricated fallback answers.
- Separate extraction, chunking, summarization, card generation, quiz generation, and title generation into traceable stages.
- Add content-size budgets, provider timeouts, retry classification, and cost/latency recording.
- Add quality checks for coverage, duplicates, answer validity, and source grounding.
- Define safe partial completion and regeneration behavior.

### Completion gate

- The same input produces schema-valid assets or a specific failure; it never silently inserts placeholder answers.
- Provider failures follow an explicit policy with bounded retries and cost.
- Each generated asset records prompt version, provider, model, timing, and quality result.

### Plugin needs

- **OpenAI Developers plugin** if OpenAI remains a configured provider.
- Official documentation for every retained AI provider.

## Phase 4 — Usage, plans, progress, and consistency

**Goal:** make entitlements and learner progress correct under concurrency, retries, offline use, and plan changes.

### Scope

- Replace mutable counters with an auditable usage ledger and atomic database functions.
- Define plan entitlements in one server-owned policy.
- Separate reserved, consumed, refunded, and expired usage.
- Make quiz attempts and XP awards idempotent.
- Define streak calculations by the learner's timezone.
- Implement a durable offline mutation queue with conflict and replay rules.
- Expose a single usage summary for UI and enforcement.

### Completion gate

- Concurrent requests cannot exceed quotas or lose increments.
- Retries cannot award XP or consume usage twice.
- UI limits match server enforcement.
- Offline progress either syncs exactly once or reports a recoverable conflict.

### Plugin needs

- **Supabase plugin** and its Postgres best-practices guidance.

## Phase 5 — Operations, performance, and release readiness

**Goal:** operate Omnave safely with real users and diagnose failures without reading raw production data.

### Scope

- Add structured logs and correlation IDs across route, job, provider, and database stages.
- Define product and reliability metrics: success rate, stage latency, provider fallback rate, cost per kit, queue age, and sync failures.
- Add alert thresholds and an incident playbook.
- Review indexes and query plans for real access patterns.
- Add retention and deletion rules for source files, generated content, logs, and account deletion.
- Add backup/restore and migration rollback procedures.
- Perform security, privacy, accessibility, PWA, and production readiness checks.

### Completion gate

- A failed user request can be traced end to end by a safe correlation ID.
- Alerts identify stuck jobs, elevated failures, quota inconsistencies, and provider degradation.
- Data deletion, restore, and migration rollback have documented evidence.
- The release checklist passes in the production-like environment.

### Plugin needs

- **Supabase plugin** for advisors and database performance.
- **Codex Security plugin** for the final security review.
- **GitHub plugin** only when pull-request and CI review become part of the release workflow.

## Current status

Phases 1–5 have implementation foundations in place. Phase 5 adds correlation-based operational telemetry, health metrics, alert thresholds, retention, account deletion, security headers, PWA cache protections, and operating runbooks. The production release checklist remains the launch gate because it requires production credentials, provider dashboards, backup settings, and device-level verification.
