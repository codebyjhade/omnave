# Omnave Phase 0: product experience audit

Date: 2026-10-02  
Scope: Local Next.js preview at `http://localhost:3000`, desktop browser (798 × 668) and phone viewport (390 × 844).  
User goal: Understand Omnave, create an account, and begin studying.  
Accessibility target: Clear content, usable controls, responsive layout, and understandable state changes.

## Overall assessment

The visual identity is recognizable, the phone hero has a clear primary action, and the signed-in Library exposes existing study kits with little friction. The largest experience problem is unreliable state handling: the app reported “No connection” while some authenticated data and lesson content loaded, several routes never left their placeholders, and the phone Library never advanced beyond the splash screen. A new account also opens on a progress-heavy dashboard instead of helping the learner add their first material. Public claims and plan limits need to be aligned with the engine and backend that actually ship.

## Captured steps

1. **Desktop landing — mixed.** [Screenshot](01-landing.png). The brand, headline, and primary action are easy to find. The hero says material becomes flashcards, quizzes, and “interactive audio chat modules in under 10 seconds.” This is an unusually specific promise that needs product verification. “Install Web App” appears as a peer action before the user has experienced the product. The offline status message appeared while the landing page loaded.
2. **Sign in — mixed.** [Screenshot](02-sign-in.png). The form is visually simple and has a password visibility control. The disabled Google option occupies substantial space and looks like a supported sign-in method until read closely. The dialog is nearly the full viewport height at this size.
3. **Create account — needs work.** [Screenshot](03-sign-up.png). The registration dialog extends beyond the 668 px desktop viewport; its top and bottom are not visible together. The form describes creating a “workspace,” which may imply a team or organizational setup rather than a personal study account. Password requirements use very small, pale text.
4. **Phone landing — good foundation.** [Screenshot](04-mobile-landing.png). The headline, explanation, and two actions fit in a single column. The first viewport spends substantial room on promises before showing a real study example. The unlabeled menu button in the accessibility snapshot needs an accessible name.
5. **Phone registration — mixed.** [Screenshot](05-mobile-sign-up.png). The form fits in the tested phone viewport, but the password rules and disabled Google option are faint. The form asks for full name before showing the study experience.
6. **Plans and pricing — needs verification.** [Screenshot](06-pricing.png). The cards are easy to compare visually, but “3 AI document uploads monthly” does not explain the weekly page pool and file size restrictions seen in the existing implementation. The page offers a $12 Pro plan and claims unlimited uploads; the actual purchase and entitlement path were not verified in this audit.
7. **Install choice — mixed.** [Screenshot](07-install-choice.png). Platform choices are clear, but the dialog asks the user to know their device/browser rather than detecting the current platform and showing the most relevant guidance first.
8. **Desktop install guidance — mixed.** [Screenshot](08-install-desktop.png). The steps are readable. The guidance says to use Chrome or Edge even though the user is already in a browser, and it does not distinguish whether install is currently available.
9. **New-account home — needs work.** The user supplied a current desktop screenshot after creating an account. The layout has a clear sidebar and readable summary cards, but the first screen does not guide a new user to upload their first material. Instead, it shows “Characteristics and Organization of Life” under “Up Next,” which looks like real account content even though the account is new. “Today's Goal” immediately asks for three lessons and one quiz, while the level, streak, and AI momentum panels repeat zero-state information. The highest-value first action is buried in the sidebar as “Upload.”
10. **Library — mixed.** [Screenshot](09-library.png). Cached study kits are available while the app reports no connection. Search and the All/Recent/Ready filters are easy to find. The first lesson is duplicated in “Continue Learning” and “All Study Kits,” while long titles are aggressively truncated despite available horizontal space. Cards show the flashcard count but not quiz count, summary availability, last activity, offline availability, or processing quality. The search field did not expose an accessible name in the browser snapshot.
11. **Upload — visually ready but state messaging is contradictory.** [Screenshot](10-upload-ready.png). The PDF picker, 15 MB limit, and empty Active Processing area rendered while the app reported no connection. The “AI Engine Ready” badge therefore communicates availability that was not demonstrated by the observed network state. The page needs a single authoritative readiness state, clear supported-file guidance, and an explanation of what happens after selection.
12. **Progress — broken in the observed offline state.** [Screenshot](11-progress-stuck-loading.png). The page retained a complete dashboard skeleton indefinitely. There was no message explaining that progress was unavailable offline and no cached summary, retry action, or empty state.
13. **Profile — broken in the observed offline state.** [Screenshot](12-profile-stuck-loading.png). Profile remained an indefinite skeleton with no account summary, offline explanation, cached identity state, or retry option.
14. **Lesson workspace — cached summary is usable, but availability is unclear.** [Screenshot](13-lesson-summary.png). The study material and bottom mode switcher rendered even while the app reported no connection, which is a valuable offline behavior. The interface does not identify which modes are cached, whether Flashcards, Quiz, and Tutor Chat will work offline, or whether progress will sync later. The floating switcher also covers the lower reading area and uses icons without visible text labels.
15. **Home — broken in the audit browser's offline state.** [Screenshot](14-home-stuck-loading.png). The greeting and shell load, but every meaningful dashboard area remains a skeleton. This differs from the populated Home screenshot supplied by the user in Brave and shows that connectivity detection changes the experience inconsistently across browsers.
16. **Phone Library — broken in the observed offline state.** [Screenshot](15-mobile-library-blank.png). At 390 × 844 the route remained on a white splash/loading view, leaving only the offline status available to accessibility inspection. The cached desktop Library did not carry through to the tested phone viewport.

## Highest impact issues

1. **Connectivity and loading states.** Use one authoritative connection state across the shell, engine, and data requests. Every loading surface needs a bounded wait followed by content, an empty state, or a specific recoverable error. Home, Progress, and Profile remained placeholders indefinitely; the phone Library remained on its splash screen.
2. **Offline content integrity.** Define offline availability per kit and per study mode. Show what is stored locally, what requires a connection, whether progress is queued for sync, and when cached content was last updated.
3. **New-user home state.** Replace the apparent sample lesson with an explicit first-use path. Lead with “Add your first material,” explain what will be generated, and reveal goals, streaks, and progress after the learner has meaningful activity.
4. **Trust and expectations.** Check claims about audio chat, “under 10 seconds,” spaced repetition, reminders, “thousands of active students,” and plan capabilities against the shipped product and real evidence. Remove or qualify unsupported claims.
5. **Plan transparency.** Show the limits that actually govern uploads and generation, including page and file limits, renewal periods, and what happens on failure or cancellation.
6. **Account entry clarity.** Replace “Create workspace” with language that matches a personal study product. Keep the registration form fully usable in short desktop viewports and at browser zoom.
7. **Library scanability.** Use available width for titles, show each kit's generated assets and last activity, distinguish processing/cached/failed states, and explain why the current kit appears in two sections.
8. **Accessibility.** Label the phone menu, Library search, and lesson mode controls; improve the legibility of password rules and disabled controls; then inspect keyboard focus, dialog scrolling, errors, and zoom in a dedicated interaction pass.

## Strengths to retain

- Clear brand mark and consistent purple accent.
- Strong visual priority on the main phone call to action.
- Simple sign-in field set.
- Installation guidance is structured as short platform-specific steps.

## Redesign order

1. Define the connection, loading, offline, retry, and sync states shared by every signed-in screen.
2. Align the engine and backend lifecycle with those visible states, especially upload, generation, cached study, and failure recovery.
3. Redesign first-use Home around adding the learner's first material and showing honest generation progress.
4. Make Library and lesson availability explicit per kit and per study mode, then improve scanning and navigation.
5. Correct public claims, plan limits, account language, and installation guidance to match the implemented product.
6. Fix dialog behavior and accessibility, then verify the complete experience on phone and desktop.

## Evidence limits

This is a combined public and authenticated-state audit. The public flow and the authenticated Library, Upload, Progress, Profile, Home, and lesson shell were captured directly. The populated Home assessment also uses the screenshot supplied by the user during this audit. The audit browser reported no connection, so online upload, live processing, populated analytics/profile data, quiz interaction, Tutor Chat, settings, deletion, and successful offline study were not observed. Screenshots can reveal contrast and layout risks, but cannot establish full accessibility compliance or confirm backend behavior. No data was created, uploaded, modified, or deleted during the authenticated pass.
