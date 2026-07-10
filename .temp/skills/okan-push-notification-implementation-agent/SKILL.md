---
name: okan-push-notification-implementation-agent
description: Use when implementing, wiring, debugging, or auditing mobile push notification support in Expo or React Native apps. Covers expo-notifications, Expo push token registration, permission prompts, Android notification channels, EAS project ID resolution, backend device-token APIs, secure token storage, token refresh and dedupe, notification preferences, foreground handlers, notification tap/deep-link routing, logout token deletion, missing native module rebuild issues, and push verification. Inspect app, backend/API, auth, storage, navigation, and release config before advising or editing.
---

# Push Notification Implementation Agent

Use this skill for mobile push notification implementation in Expo and React Native apps. It owns app-side push setup, registration lifecycle, preferences, runtime handling, and notification tap routing.

Use `$mobile-implementation-agent` when applying general React Native code changes. Use `$okan-expo-release-checklist-agent` for broad EAS/build/release readiness. Use `$okan-mobile-privacy-compliance-assistant` for store privacy disclosure answers. Use a mobile API schema sync skill when generated API contracts are stale.

## Operating Model

- Inspect the existing app, backend/API contract, auth lifecycle, secure storage, navigation, settings/preferences UI, and tests before recommending changes.
- Prefer `expo-notifications` for Expo apps unless the repo clearly uses direct native APNs/FCM.
- Request notification permission only at the product-approved time, usually after auth for account-backed push.
- Treat permission denial, simulator token failures, missing native modules, missing project ID, and backend registration failures as non-fatal app states.
- Use current docs through Context7 for Expo Notifications, Expo Constants, EAS project ID, React Navigation, APNs/FCM setup, and native module behavior when implementation depends on current APIs.

## Implementation Workflow

Read `references/expo-push-implementation-workflow.md` before implementing Expo push setup.

Default flow:

- Inspect package/config: `expo-notifications`, `expo-constants`, app config plugin, EAS project ID, Android package, iOS bundle ID, and native folders if present.
- Wire a global foreground notification handler once.
- Configure Android notification channel before requesting token.
- Resolve `projectId` and pass it to `Notifications.getExpoPushTokenAsync({ projectId })`.
- Validate Expo token format before sending to backend when the backend requires Expo push tokens.
- Register devices only for eligible authenticated users unless product requirements say otherwise.
- Keep registration, preferences, and routing code feature-scoped and testable.

## Device Token Lifecycle

Read `references/device-token-lifecycle.md` for backend registration and cleanup rules.

Core rules:

- Store a stable local install/device ID when the backend accepts one.
- Store backend registration data locally with user ID, Expo token, platform, device ID, app version, and backend device token ID.
- Skip backend registration when the stored record exactly matches the current target and has a backend ID.
- Re-register when user, token, platform, device ID, app version, or backend ID changes.
- Listen for push token changes when the notifications API supports it.
- Delete the backend token on explicit logout when possible, then clear local registration.
- Never block logout if backend delete fails.

## Routing And Preferences

Read `references/notification-routing-preferences.md` when wiring preferences or tap handling.

Default rules:

- Parse notification payloads defensively; ignore unknown or malformed payloads.
- Use the app's existing navigation ref/deep-link/root navigation pattern for notification taps.
- Handle cold-start last notification responses and future response listener events.
- Deduplicate handled responses where notification IDs are available.
- Keep notification preferences backend-backed when backend preferences exist.
- Patch preference changes partially when the API supports partial updates.
- Add focused tests for route mapping and preference patch payloads.

## Boundaries

- Do not own backend notification generation jobs unless explicitly requested.
- Do not add local scheduled notifications, receipt polling, custom sounds, badges, categories/actions, or rich media unless explicitly requested.
- Do not answer store privacy disclosures here; delegate to `$okan-mobile-privacy-compliance-assistant`.
- Do not run EAS builds or broad release audits here; delegate to `$okan-expo-release-checklist-agent` or an EAS operator skill.
- Do not suppress real implementation errors silently except for expected non-fatal push availability states.

## Handoff

Final responses should include:

- Push lifecycle areas implemented or audited.
- Backend endpoints and local storage behavior used.
- Permission, native-module, simulator, and project-ID limitations.
- Tests/checks run and results.
- Manual real-device or development-build verification still needed.
