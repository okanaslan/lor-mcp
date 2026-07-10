# Expo Release Audit Checklist

## Identity And App Config

- App name, slug, version, orientation, icon, splash, and runtime version are production-ready.
- iOS `bundleIdentifier` is final and matches App Store Connect.
- Android `package` is final and matches Play Console.
- `owner`, EAS `projectId`, and updates URL are present when EAS Updates or push token project ID resolution is used.
- Export compliance flags are intentionally configured when applicable.

## EAS Profiles

- Production profile is not simulator-only and is not internal distribution unless intentionally shipping outside stores.
- iOS production profile is suitable for App Store builds.
- Android production profile uses `app-bundle` for Play Store release.
- Submit profiles exist when using `eas submit`.
- Channels match intended update/release strategy.

## Environment Variables

- Required `EXPO_PUBLIC_` values are set in all relevant build profiles.
- Client-visible env vars contain no secrets.
- API base URLs point to production for production builds.
- Store product IDs are set when subscription code requires them.
- `.env.example` documents required local values without real secrets.

## Dependencies And Native Runtime

- Expo SDK packages match the installed Expo SDK expectations.
- Native modules are supported by the target build type.
- Dev-client-only assumptions are not used for App Store/Play production builds.
- `expo-doctor` is clean or known warnings are documented.
- Push notifications, IAP, SecureStore, Updates, and localization plugins are represented in app config when used.

## OTA Updates

- Runtime version policy is intentional.
- Updates URL and channel strategy are configured when using EAS Update.
- Release build and update channel naming are consistent.
- Dangerous OTA changes that require a native binary are not planned as JS-only updates.

## Store Billing

- iOS App Store product IDs match App Store Connect.
- Android Play Store product IDs match Play Console when Android billing is enabled.
- Billing code handles missing products gracefully in non-store builds.
- Restore purchase flow is implemented and smoke-tested if subscriptions are available.

## Credentials Safety

- No keystores, provisioning profiles, `.p8`, `.p12`, service account JSON, signing passwords, or local env files are committed.
- EAS-managed credentials are preferred unless manual credentials are required.

## Validation

- Run project checks: API/schema check if present, typecheck, lint, tests.
- Run `npx expo-doctor` and resolve SDK dependency mismatches before final release.
- Build on EAS for each target platform.
- Smoke test the production-like build on a real device.
