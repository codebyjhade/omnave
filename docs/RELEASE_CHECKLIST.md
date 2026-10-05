# Omnave release checklist

## Required before production launch

- [x] Run a production build with the configured environment values. Passed on Next.js 16.3.8 on 2026-10-04.
- [ ] Run the app through sign-up, sign-in, upload, processing, retry, cancellation, quiz, chat, offline replay, sign-out, and account deletion.
- [ ] Confirm Free and Pro limits from `/api/usage/summary` match the displayed product copy.
- [ ] Confirm one failed upload refunds generation and page reservations.
- [ ] Confirm the same quiz mutation ID awards XP exactly once.
- [ ] Run Lighthouse for installability, performance, accessibility, and PWA behavior on mobile and desktop.
- [ ] Complete keyboard, focus, screen-reader label, contrast, zoom, reduced-motion, and touch-target review.
- [ ] Confirm Inngest production signing keys, event delivery, retries, schedules, and failure notifications.
- [ ] Confirm Supabase backups and complete an isolated restore drill.
- [ ] Review Supabase security and performance advisors with no unresolved critical finding.
- [x] Run a production dependency vulnerability audit. `npm audit --omit=dev` reports zero vulnerabilities.
- [x] Run full repository lint. Passed with 0 errors; legacy UI migration findings remain visible as warnings.
- [ ] Connect operational alerts to a monitored destination.
- [ ] Publish privacy, retention, account deletion, terms, and AI limitation copy.
- [ ] Add a nonce-based Content Security Policy.
- [ ] Verify production domains, HTTPS, OAuth redirects, cookie settings, and CORS behavior.
- [ ] Record rollback owner, incident owner, deployment version, and release time.

## Evidence already implemented

- [x] Versioned database migrations and generated database types.
- [x] Explicit RLS and Storage ownership rules.
- [x] Durable processing attempts, retries, cancellation, stale recovery, and dead letter state.
- [x] Provider policy, schema validation, quality checks, and AI run telemetry.
- [x] Atomic entitlement ledger and shared usage summary.
- [x] Idempotent quiz progress and timezone based streaks.
- [x] Durable offline quiz replay.
- [x] Correlation IDs across upload route and processing worker.
- [x] Operational health metrics and documented alert thresholds.
- [x] Automated telemetry retention.
- [x] Authenticated account deletion endpoint.
- [x] PWA network-only rules for authenticated APIs.
- [x] Baseline production security headers.
- [x] Browser smoke navigation for Home and Library with no runtime errors; only a Framer Motion deprecation warning remains.
- [x] First-party service worker replaces the vulnerable PWA build plugin and excludes API and Supabase traffic from caching.
