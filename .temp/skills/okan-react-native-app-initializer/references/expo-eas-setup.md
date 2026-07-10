# Expo And EAS Setup

Recommended setup for a new app:
- Scaffold with `npx create-expo-app@latest <app-name>`.
- Keep app identity stable before the first native build.
- Use `app.json` for simple static config; use `app.config.ts` only when config needs environment-aware logic.
- Prefer Expo managed workflow. Run prebuild only when native project ownership is required.
- Add `eas.json` with development, preview, and production profiles.
- Use APK only for development/internal direct installs; use AAB for Play Store release builds.
- Keep `android/` and `ios/` ignored unless the app intentionally owns native code.

Environment defaults:
- Use `EXPO_PUBLIC_` variables only for values safe to embed in the client.
- Do not store secrets, signing passwords, service account keys, or API private keys in app config.
- Document required local `.env` values, but ignore actual local env files.

Signing defaults:
- Let EAS manage Android upload keystores unless the user already has a required production key.
- Do not commit `.jks`, `.keystore`, `.p8`, `.p12`, `.key`, provisioning profiles, or service account JSON files.
- Record manual Play Console and App Store Connect steps separately from code changes.
