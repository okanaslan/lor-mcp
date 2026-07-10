# EAS Failure Triage

## Auth Or Account

Signals:

- Not logged in.
- Account/organization not found.
- Permission denied.

Fix:

- Run `npx eas whoami`.
- Log in with the correct Expo account.
- Confirm app owner/organization in app config.

## Missing Or Bad Profile

Signals:

- Profile does not exist.
- Submit profile missing.
- Invalid JSON in `eas.json`.

Fix:

- Add or correct the requested build/submit profile.
- Validate JSON and rerun the same command.

## iOS Credentials Or Provisioning

Signals:

- Apple authentication failure.
- Bundle ID mismatch.
- Provisioning profile/certificate errors.
- App Store Connect app not found.

Fix:

- Confirm `ios.bundleIdentifier` matches App Store Connect.
- Let EAS manage credentials or repair credentials in EAS.
- Confirm Apple Developer team access.

## Android Credentials Or Package

Signals:

- Keystore/upload key errors.
- Package name mismatch.
- Play Console app not found.
- Service account/API permission errors.

Fix:

- Confirm `android.package` matches Play Console.
- Confirm EAS credentials or upload key.
- Confirm Play service account permissions if using submit.

## Dependency Install Or Native Build

Signals:

- npm/yarn install failure.
- Expo SDK package mismatch.
- CocoaPods/Gradle build failure.
- Native module missing or incompatible.

Fix:

- Run `npx expo-doctor` and `npx expo install --check`.
- Align Expo packages with `npx expo install --fix` when appropriate.
- Rebuild native binaries after adding native modules.

## Environment Or Runtime Config

Signals:

- Missing `EXPO_PUBLIC_*` values.
- API base URL undefined.
- Missing subscription product IDs.
- Missing EAS project ID for notifications/updates.

Fix:

- Add required client-safe env vars to the selected EAS profile or EAS secrets as appropriate.
- Do not put private secrets in `EXPO_PUBLIC_*`.

## Artifact Submit Failure

Signals:

- File does not exist.
- Wrong file type: IPA/AAB/APK mismatch.
- Artifact already processed or invalid.

Fix:

- Verify path with `ls`.
- Use `.ipa` for iOS App Store submit.
- Use `.aab` for Play production submit.

## Store Metadata Or Processing

Signals:

- Build uploaded but unavailable in store dashboard.
- Processing delay.
- Missing export compliance or app version metadata.

Fix:

- Wait for store processing.
- Complete dashboard-required metadata manually.
- Use `$okan-app-store-submission-assistant` for App Store Connect field guidance.
