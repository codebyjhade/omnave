# Phase 1 — Data, security, and state contracts

Date: 2026-10-03  
Implementation status: Complete and applied to the hosted Omnave Supabase project.

## Implemented

- Initialized a source-controlled Supabase project configuration.
- Added a baseline migration for `profiles`, `materials`, `user_usage`, `quiz_scores`, and the private `study_materials` bucket.
- Added explicit Data API grants because new Supabase projects no longer expose public tables automatically.
- Enabled RLS and added owner-scoped policies for all user data.
- Added Storage policies that require the first object-path segment to equal the authenticated user ID and restrict uploads to PDF files.
- Added automatic `profiles` and `user_usage` creation when an Auth user is created.
- Added one canonical material lifecycle enum and a database trigger that rejects invalid transitions.
- Added the shared TypeScript lifecycle contract and typed Supabase clients.
- Added a shared authenticated server-client helper based on cookie sessions and `auth.getUser()`.
- Marked the service-role client as server-only.
- Secured `DELETE /api/materials/[id]`, which previously accepted a material ID without authenticating or authorizing the caller.
- Applied authentication and owner scoping to processing cancellation and deletion routes.
- Removed direct browser writes to material lifecycle state.
- Added a structured API error envelope for new and migrated error paths.

## Canonical material lifecycle

1. `UPLOADED`
2. `QUEUED`
3. `PARSING_DOCUMENT`
4. `GENERATING_SUMMARY`
5. `BUILDING_ASSESSMENTS`
6. `COMPLETED`

Terminal exception states are `FAILED` and `CANCELLED`. Retrying a terminal state returns it to `QUEUED`.

The legacy `is_processed` column remains temporarily for UI compatibility. The migration derives it from `status`; `status` is now the authoritative lifecycle field.

## Security model

| Resource | Browser access | Server access |
|---|---|---|
| `profiles` | Read own row; update learner activity columns only | Service role manages plan and usage counters |
| `materials` | Read own rows; insert an owned `UPLOADED` row | Authenticated routes and workers manage lifecycle and deletion |
| `user_usage` | Read own row | Service role manages usage |
| `quiz_scores` | Read and insert owned scores for owned materials | Service role available for later atomic progress work |
| `study_materials` | Read, upload, and delete files inside the user's own folder | Service role can perform worker cleanup |

## Verification evidence

- Inspected the hosted schema before deployment, including columns, existing RLS policies, Storage bucket configuration, migration history, and legacy quiz identifiers.
- Preserved all 34 existing quiz-score rows, including 17 legacy `lesson-1` records.
- Executed the complete migration against the hosted schema inside a transaction and rolled it back successfully before deployment.
- Applied both Phase 1 migrations to the hosted Omnave project; local and remote migration histories match.
- Confirmed all 10 intended Phase 1 table and Storage policies are installed.
- Confirmed existing materials were normalized to the canonical enum: 9 `COMPLETED` and 8 `FAILED` at verification time.
- Generated `types/database.generated.ts` directly from the migrated hosted schema.
- Next.js/TypeScript compilation check passes with no errors.
- ESLint passes for the Phase 1 routes, helpers, generated types, processing worker, upload context, and affected services.
- Supabase security and performance advisors report no database-policy or function warnings after remediation.
- Current official Supabase guidance was checked for RLS, explicit grants, SSR authentication, Storage ownership, and 2026 Data API exposure changes.

## Remaining account-level recommendation

The Supabase advisor reports that leaked-password protection is disabled. This feature is available on Supabase Pro plans and is enabled from the hosted Auth settings. It does not block the Phase 1 data and authorization contract.

The repository-wide lint command still reports existing UI and AI-service violations outside the Phase 1 change set. Those should be handled in the relevant later phases rather than mixed into this foundation migration.
