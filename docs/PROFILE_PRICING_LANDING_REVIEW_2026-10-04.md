# Profile, pricing, navigation, and landing update — 2026-10-04

## Profile dashboard

- Removed placeholder Edit Profile, Change Email, Change Password, Two-Factor, Theme, Notifications, Google, and GitHub controls.
- Removed estimated storage usage that was derived from document count.
- Added account identity, real study-kit/flashcard/quiz totals, and live generation/page/chat allowance from the usage API.
- Added working links to Settings and Support.
- Added a Pro comparison entry point for mobile and desktop users.

## Settings navigation

- Settings header back now returns directly to Home.
- Help, Privacy, and Terms use browser history to return to the screen that opened them.
- This prevents the Settings → Help → Settings → Help back-navigation loop.

## In-app pricing

- Added a persistent desktop sidebar entry and a Profile plan card.
- Pricing now uses one consistent preview: ₱149/month, or ₱1,188 annually.
- Free and Pro limits match the database entitlements.
- Checkout is labeled as coming soon and does not pretend that payment is active.

## Landing page

- Removed unsupported claims about audio files, lecture URLs, audio chat, sub-10-second generation, reminders, PDF export, and unlimited features.
- Described the real PDF-to-summary/flashcard/quiz/tutor workflow and verified offline behavior.
- Aligned Free and Pro pricing with backend limits and in-app pricing.
- Connected footer Terms and Privacy links to the public pages.

## Visual evidence

- `profile-dashboard-2026-10-04.png`
- `in-app-pro-pricing-2026-10-04.png`
