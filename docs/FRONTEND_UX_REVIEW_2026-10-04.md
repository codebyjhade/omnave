# Omnave frontend and UX review — 2026-10-04

## Verdict

Omnave has a recognizable visual identity and a consistent component language. The purple shell, rounded cards, Poppins typography, simple icon set, and predictable navigation suit a focused learning PWA. The system is strong enough to keep; it needs refinement and clearer product states rather than a full visual rebuild.

The backend is more mature than the interface currently communicates. Core progress, quota, upload lifecycle, retries, refunds, and offline quiz synchronization exist, but some visible labels are inferred from weak signals or omit important recovery actions.

## Current evidence

1. **Home — healthy with hierarchy issues.** `audit-2026-10-04-current-home.png`
   The next action is prominent and the dashboard is easy to scan. Several large cards compete for attention, the desktop canvas wastes width, and the recommendation panel dominates content that is more useful to returning learners.

2. **Library — usable but only partially truthful.** `audit-2026-10-04-current-library.png`
   Search, filters, progress, and generated asset counts scan well. The current kit is duplicated in Continue Learning and All Study Kits. Every completed material receives an Offline badge without verifying that its local cache is present.

3. **Upload — visually clear but status semantics are inaccurate.** `audit-2026-10-04-current-upload.png`
   The drop zone and limits are easy to understand. “AI Engine Ready” reflects browser connectivity rather than provider or queue health. The screen does not show remaining page and generation allowance before selection. Detailed backend lifecycle states and retry eligibility are not presented consistently.

4. **Progress — data is present but weak as guidance.** `audit-2026-10-04-current-progress.png`
   Mastery and weekly activity are readable. The screen emphasizes charts and zero values but provides little explanation or a recommended next action. Scroll position also persisted unexpectedly during route capture, which can make navigation feel disorienting.

## Highest impact improvements

### P0 — make frontend claims match backend truth

- Replace “AI Engine Ready” with explicit states derived from real checks: Online, Checking service, Ready, Delayed, and Unavailable.
- Display usage before upload: pages remaining this week, generations remaining this month, maximum pages per document, and maximum file size.
- Bind processing cards directly to the durable lifecycle: queued, parsing, generating summary, building assessments, ready, retryable failure, permanent failure, and cancelled.
- Add Retry and Cancel actions only when the backend says they are allowed; explain automatic quota refunds on failure or cancellation.
- Show Offline only after checking that the kit is actually cached. Otherwise show Online only or Download for offline.
- Surface queued offline progress and its sync result with states such as Saved on device, Syncing, Synced, and Needs attention.

### P1 — improve the core learning journey

- Make Home answer three questions: what should I do now, what did I finish, and what needs attention.
- Remove duplicate representation of the same kit in Library or visually separate Resume from Browse all.
- Turn Progress into coaching: add Continue studying, Review weak cards, or Retry quiz actions based on real data.
- Make first use a short guided path: Upload PDF, wait for generation, start first lesson, complete first quiz.
- Add clear empty, delayed, partial generation, failed, and retry states to every signed-in route.

### P2 — refine the design system

- Keep the brand palette and rounded geometry, but reduce heavy shadows and repeated purple surfaces.
- Increase secondary text contrast and avoid essential information at 9–10 px.
- Use a denser desktop grid while preserving the simple single-column mobile layout.
- Standardize focus rings, disabled states, status colors, destructive actions, and minimum 44 px touch targets.
- Add semantic design tokens for success, warning, error, offline, processing, and focus instead of page-specific color strings.

## Recommended release scope

Complete P0 before a public launch. P1 can follow immediately after launch preparation. P2 can be improved incrementally without blocking release, except for contrast, focus visibility, and touch target issues.

## Evidence limits

This review used the current desktop Home, Library, Upload, and Progress screens. Mobile behavior, keyboard navigation, screen reader output, live provider generation, file upload completion, account deletion, and all error/retry variants were not visually exercised in this pass.
