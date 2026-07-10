# Expo Push Implementation Workflow

Use this reference when implementing Expo push notifications.

## Inspect First

Check:

- `package.json` for `expo-notifications`, `expo-constants`, `expo-device` or related app/device packages.
- `app.json` / `app.config.*` for plugins, bundle/package IDs, `extra.eas.projectId`, notification config, icons, and Android channel assumptions.
- `eas.json` for profiles, channels, env, and whether native rebuilds are expected.
- Existing auth/session bootstrap and guest handling.
- Existing API/OpenAPI notification device and preference endpoints.
- Secure/local storage helpers.
- Root navigation and deep-link handling.
- Current tests around notification helpers.

## Native Module Availability

- `expo-notifications` requires a native binary that includes the module.
- After installing or adding the config plugin, Expo Go or an old dev build may throw missing native module errors such as `ExpoPushTokenManager`.
- Handle missing native modules gracefully in app code when the feature should not block launch.
- Tell the user to rebuild a development/production build when the native module is missing.

## Permission Timing

- Request permission only after the user reaches the product-approved point.
- For account-backed push, default to after authenticated session bootstrap and skip guest users unless product requires otherwise.
- Permission denied should not block app usage or show generic API errors.

## Channel And Handler Setup

- Configure Android channels before token registration.
- Register foreground notification handling once near app provider/bootstrap code.
- Keep sound, badge, banner/list behavior aligned with product requirements.
- Avoid repeated handler registration on every render.

## Token Registration

- Resolve EAS project ID from `Constants.expoConfig?.extra?.eas?.projectId` or `Constants.easConfig?.projectId` depending on app conventions.
- Pass `projectId` to `Notifications.getExpoPushTokenAsync({ projectId })`.
- Treat missing project ID and token retrieval failures as non-fatal.
- Validate token shape if the backend accepts only Expo push tokens.
- Send platform, token, device ID, and app version when supported by backend.

## Verification

Local checks:

- Focused helper tests.
- Typecheck and lint.
- Mocked routing/preference tests.

Manual checks:

- Use a real device or development/production build.
- Confirm permission prompt timing.
- Confirm Android channel exists.
- Confirm backend registration succeeds once and is not duplicated on restart.
- Confirm tap routing from cold start and foreground/background.
