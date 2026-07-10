# Device Token Lifecycle

Use this reference when wiring backend device token registration.

## Stored Registration Record

When supported by backend, store enough local data to decide whether re-registration is needed:

- user ID.
- Expo push token.
- platform: `ios` or `android`.
- stable local device/install ID.
- app version.
- backend device token ID.

Use secure storage when available because the record links device and account identity.

## Registration Dedupe

Skip backend registration only when all relevant fields match and the backend device token ID exists.

Re-register when:

- user changes.
- Expo push token changes.
- platform changes.
- app version changes when backend tracks app version.
- stable device/install ID changes.
- stored backend device token ID is missing.
- local record is corrupted or cannot be parsed.

## Failure Handling

- Permission denied: skip non-fatally.
- Unsupported platform: skip non-fatally.
- Missing native module: skip non-fatally and require native rebuild.
- Missing project ID: skip non-fatally and flag config fix.
- Invalid token shape: do not send to backend.
- Backend missing ID: do not store a successful registration.
- Network/API failures: keep app usable and allow retry later.

## Token Refresh

- Subscribe to token change events when the notification library supports it.
- On token change, run the same dedupe-aware registration flow.
- Avoid registering repeatedly on every render or every app focus without changed inputs.

## Logout Cleanup

On explicit logout:

1. Read stored registration.
2. If it has a backend device token ID, call backend delete.
3. Ignore delete failures so logout can continue.
4. Clear local registration record in `finally`.

Do not delete registration on transient auth refresh or bootstrap uncertainty unless the product explicitly wants it.
