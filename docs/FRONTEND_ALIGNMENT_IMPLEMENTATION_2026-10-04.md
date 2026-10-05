# Frontend alignment implementation — 2026-10-04

## Completed

- Replaced the connectivity-based “AI Engine Ready” claim with Checking, Ready to Upload, Limits Unavailable, and Offline states.
- Added live free/pro usage information before upload: weekly pages, monthly generations, page limit per PDF, and file-size limit.
- Mapped durable processing stages to learner-friendly labels.
- Added safe Retry for backend-confirmed retryable failures and explains automatic quota refunds.
- Separated activity-card dismissal from study-kit deletion. Closing an activity card no longer deletes its material.
- Changed Offline badges to reflect actual IndexedDB cache presence.
- Added visible offline progress states and automatic queue replay when connectivity returns.
- Removed the duplicated current kit from the Library browse list.
- Added one data-driven recommended next action to Progress.
- Added visible lesson-mode labels, larger touch targets, keyboard focus treatment, semantic status tokens, and reduced-motion support.

## Visual review

- `frontend-upgrade-2026-10-04-upload.png`
- `frontend-upgrade-2026-10-04-library.png`
- `frontend-upgrade-2026-10-04-progress.png`

## Later enhancements

- A full dark theme requires replacing the remaining hard-coded white and gray component colors with theme tokens.
- Focus mode can be extended with user-controlled typography and reading width.
- Haptics and restrained milestone celebrations can be added after mobile device testing.
- Swipe navigation remains excluded because it conflicts with flashcards, browser navigation, and accessibility gestures.
