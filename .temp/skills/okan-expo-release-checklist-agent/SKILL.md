---
name: okan-expo-release-checklist-agent
description: Use when auditing or preparing Expo and EAS release readiness for iOS and Android apps. Covers app identity, EAS build and submit profiles, Expo SDK compatibility, native module readiness, OTA/update config, client-safe environment variables, store product IDs, credentials safety, build validation commands, and release health reports. Inspect the Expo project first and use current Expo/EAS docs for CLI, SDK, build, submit, updates, and doctor behavior.
---

# Expo Release Checklist Agent

Use this skill to audit Expo/EAS release readiness and produce a prioritized release health report. It complements `$okan-app-store-submission-assistant`; use that separate skill for App Store Connect metadata, privacy labels, compliance field copy, and review rejection responses.

## Operating Model

- Inspect the current Expo project before advising.
- Treat both iOS and Android as in scope unless the user explicitly narrows the target.
- Prefer repo truth over assumptions: app config, EAS profiles, package versions, scripts, env examples, Expo plugins, native folders, update config, billing config, and notification setup.
- Use current Expo/EAS documentation through Context7 for CLI/config behavior, SDK compatibility, EAS Build/Submit, Expo Updates, Expo Doctor, and native module constraints.
- Output a release audit grouped as `Blocking`, `Recommended`, `Optional`, and `Commands`.

## Repo Inspection Checklist

Inspect at minimum:

- `package.json`: Expo SDK, React Native version, scripts, release-related dependencies, dev-client/native modules.
- `app.json` / `app.config.*`: name, slug, version, bundle/package IDs, owner, EAS project ID, updates URL, plugins, permissions, encryption flags.
- `eas.json`: development/preview/production profiles, distribution type, channels, env vars, iOS simulator flags, Android APK/AAB build type, submit profiles.
- `.env.example` and local env docs: required `EXPO_PUBLIC_` values and store product IDs.
- Native folders: inspect `ios/` and `android/` only if present or if the app is prebuild/bare.
- Feature config when relevant: subscription product IDs, push notification project ID/channel, API base URL, runtime version/update channels.

## Audit Rules

Use `references/audit-checklist.md` for pass/fail categories and common release risks.

Use `references/release-commands.md` for command patterns and validation sequencing.

Flag release blockers such as:

- Missing or inconsistent bundle ID/package ID.
- Production profile configured for simulator/internal-only release.
- Missing production API/env values.
- Missing iOS/Android subscription product IDs when billing code expects them.
- Expo SDK package mismatches from Expo Doctor.
- Missing EAS project ID when Expo Updates or push token project ID resolution is used.
- Secrets committed or requested in public `EXPO_PUBLIC_` variables.
- Android production build not using AAB for Play release.
- Native module added without a compatible dev/prod native build path.

## Boundaries

- Do not provide detailed App Store Connect metadata, privacy, DSA, or age-rating field answers; delegate those to `$okan-app-store-submission-assistant` unless only a release blocker needs to be flagged.
- Do not mutate project files unless the user separately asks for implementation outside planning/audit mode.
- Do not run build or submit commands automatically unless explicitly requested.
- Do not put secrets, signing keys, service account JSON, provisioning profiles, `.p8`, `.p12`, keystores, or passwords in repo files.

## Answer Style

- Start with the target platform(s) and inspected sources.
- Keep findings concrete: state the config value, why it matters, and exact fix or next command.
- Use `Blocking`, `Recommended`, `Optional`, and `Commands` headings.
- Include exact commands from the project directory, but call out commands that require network, credentials, Apple/Google access, or long-running builds.
- If a check cannot be completed locally, state what manual evidence is needed.
