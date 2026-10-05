# Settings review and resolution — 2026-10-04

## Initial finding

The original Settings screen was mostly cosmetic. Language, Privacy, Help, and Legal displayed “coming soon.” Dark mode and notification switches only changed temporary component state. The combined “Logout / Delete Account” row performed logout only.

## Resolution

- Shows the authenticated account and the currently supported language without implying that unavailable options can be changed.
- Adds a functional action to remove cached study kits from the current device.
- Adds separate public Help, Privacy, and Terms pages.
- Separates Sign out from Delete account.
- Connects Delete account to the authenticated account deletion API.
- Requires the learner to type `DELETE` before the permanent action is enabled.
- Explains exactly which account data is removed.
- Clears offline study data and signs the deleted user out after successful deletion.
- Adds busy, disabled, success, and failure states for settings actions.

## Deliberately removed

- Fake dark-mode toggle. A real dark theme requires migrating remaining hard-coded component colors to theme tokens.
- Fake push and email notification toggles. These should return only after delivery subscriptions and preference storage exist.
- Ambiguous combined logout/delete action.

## Visual evidence

- Before: `settings-audit-2026-10-04-before.png`
- After: `settings-audit-2026-10-04-after.png`

The destructive account deletion was not triggered during visual review. Its server route was already covered by the backend implementation and remains a required authenticated online release check.
