---
name: okan-react-native-app-initializer
description: Use when creating, planning, or bootstrapping a new Expo React Native app. Covers app identity, Expo initialization, EAS-ready config, environment setup, validation commands, and first-run handoff.
---

# React Native App Initializer

Use this skill for new mobile app setup. Default to Expo + TypeScript + Expo Router unless the user explicitly asks for bare React Native.

## Resource Loading
- For missing product/app facts, read `references/kickoff-checklist.md`.
- For Expo/EAS config structure, read `references/expo-eas-setup.md`.
- For handoff and validation before finishing, read `references/release-readiness.md`.

## Initialization Flow
1. Gather the required app facts: app name, slug, Android package, iOS bundle ID, platforms, API hosts, auth needs, and expected release targets.
2. Check the target directory before creating or editing files.
3. Fetch current Expo/EAS docs before relying on CLI/config details.
4. Scaffold with `npx create-expo-app@latest <app-name>`.
5. Configure `app.json` or `app.config.ts` with stable identifiers and owner/project metadata where applicable.
6. Add EAS profiles for development, preview, and production.
7. Establish validation commands: typecheck, lint, test if present, and start/build smoke checks.
8. Document manual release credentials steps separately from code setup.

## Guardrails
- Never commit keystores, credentials, provisioning profiles, or local env secrets.
- Keep Expo managed workflow unless a native dependency requires prebuild.
- Do not invent billing, auth, or backend contracts during initialization.
- Prefer explicit package/bundle IDs before first build to avoid signing identity churn.
