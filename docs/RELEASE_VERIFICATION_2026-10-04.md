# Release verification — 2026-10-04

## Passed

- Next.js upgraded from 16.2.10 to the patched 16.3.8 release.
- Production build completed successfully: compilation, TypeScript, 21 static pages, dynamic APIs, and build traces.
- Production dependency audit reports zero vulnerabilities.
- Phase 1–5 backend and API files pass ESLint with zero errors.
- Full repository ESLint exits successfully with zero errors. A scoped migration policy keeps 145 legacy UI findings visible as warnings.
- Supabase Phase 5 migrations deployed and generated database types refreshed.
- Isolated Supabase acceptance suite passed all 10 checks using a temporary user that was deleted after the run.
- Verified profile bootstrap, duplicate-safe upload registration, atomic free-plan quota reservation, visible reserved usage, failure transitions, and automatic quota refunds.
- Verified server-calculated quiz XP, replay idempotency, conflicting mutation rejection, and the operational health summary.
- The acceptance run exposed and resolved ambiguous plan entitlement lookup and health alert JSON aggregation defects before release.
- Home and Library rendered in the local browser with authenticated study data.
- Home to Library navigation worked.
- Browser console contained no errors. It contained a Framer Motion deprecation warning.
- Offline state displayed its banner and retained access to the cached library.
- API and Supabase requests are explicitly excluded from service worker caching.
- No tracked environment files, private keys, or provider credentials were found by the repository scan.

## Open before public launch

- Resolve the 145 remaining legacy UI warnings incrementally; they are visible but do not block the release command.
- The in-app browser reported offline network state, so the storage upload route and cookie-authenticated account deletion route still need an online browser pass.
- A live AI provider generation was intentionally excluded from acceptance to avoid consuming the production API allowance; quota and generation lifecycle behavior were verified at the database boundary.
- Run Lighthouse and manual accessibility checks on mobile and desktop.
- Review Supabase security and performance advisors in the project dashboard.
- Complete an isolated backup restoration drill.
- Connect Inngest alert logs to a monitored notification destination.
- Add a nonce-based Content Security Policy after removing or nonce-enabling the remaining inline script and style usage.
- Verify Pro payment activation and publish privacy and terms pages.
