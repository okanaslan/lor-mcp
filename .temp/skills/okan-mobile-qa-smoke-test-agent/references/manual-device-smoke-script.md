# Manual Device Smoke Script

Use this reference for manual QA scripts. Keep scripts concise and tied to the changed feature plus core flows.

## Baseline App Smoke

- Launch app from a clean start.
- Confirm session/bootstrap finishes without errors.
- Confirm bottom tabs/main navigation render.
- Switch through every main tab once.
- Background and foreground the app once.
- Force close and relaunch if session persistence is part of the risk.

## Auth And Account

- Sign in with a test account when available.
- Continue as guest if guest mode exists.
- Log out and confirm local state clears correctly.
- Upgrade/link guest account if touched.
- Confirm account/settings rows still open expected screens.

## Feature Mutation Flow

For changed CRUD/data flows:

- Create a record.
- Edit primary fields.
- Trigger relevant status/check-in/action mutation.
- Delete/archive/complete/reopen if supported.
- Pull to refresh or switch tabs and confirm persisted state.
- Verify error handling by testing offline or backend unavailable when practical.

## UI Interaction Flow

- Open and close sheets/modals using close button, backdrop, swipe/gesture, and hardware back on Android when relevant.
- Test keyboard focus, submit, validation, and dismissal.
- Test swipe actions, pull gestures, scroll-to-bottom behavior, and long content.
- Check loading, empty, error, disabled, pending, and success states.

## Platform And Release-Critical Checks

- iOS and Android spot check when native/platform code changed.
- Light and dark mode when visual tokens/components changed.
- EN/TR or supported locale switching when copy/layout changed.
- Push notification permission, registration, and tap routing when notifications changed.
- IAP/subscription purchase/restore in sandbox when billing changed.
- Offline/poor network behavior when networking/cache changed.

## Result Notes

Capture:

- Device/platform/build type.
- Account/data state used.
- Steps passed.
- Steps failed with screenshots/logs when useful.
- Any unchecked steps and why.
