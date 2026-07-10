---
name: okan-eas-build-submit-operator
description: Use when operating Expo EAS build and submit workflows for iOS or Android. Covers EAS build, EAS submit, build status, local artifact submission, production/preview/development profiles, credential prompts, build failure triage, artifact handoff, and retry commands. Inspect Expo/EAS config first, preflight target platform/profile/artifact, and only run networked build or submit commands when the user explicitly asks.
---

# EAS Build And Submit Operator

Use this skill to operate EAS Build and EAS Submit flows. This is an execution/runbook skill, not a broad release audit or App Store metadata assistant.

Use `$okan-expo-release-checklist-agent` for broader Expo release audits. Use `$okan-app-store-submission-assistant` for App Store Connect metadata, privacy labels, compliance, and review guidance.

## Operating Model

- Inspect the Expo project before running or recommending EAS commands.
- Confirm the requested target: platform (`ios`, `android`, or `all`), EAS profile, and operation (`build`, `submit`, `status`, or local artifact submit).
- Preflight only blockers that affect command success or artifact correctness.
- Run EAS commands only when the user explicitly asks for build/submit/status work.
- Treat EAS commands as networked, credentialed, and potentially long-running; request approval/escalation according to the active environment rules.
- Use current Expo/EAS docs through Context7 for CLI flags, credential behavior, build profiles, submit profiles, and platform-specific requirements.

## Required Inspection

Before build or submit, inspect:

- `package.json`: package manager, scripts, Expo SDK, EAS CLI usage if documented.
- `app.json` / `app.config.*`: bundle ID, package ID, owner, EAS project ID, updates config, plugins, permissions.
- `eas.json`: requested build/submit profile, env vars, distribution, channels, iOS simulator flags, Android build type.
- `.env.example` and relevant config: public API hosts, store product IDs, push/update project IDs.
- Native folders only if present or if prebuild/bare workflow is detected.
- Local artifact path when submitting with `--path`.

## Preflight Rules

Use `references/operator-runbook.md` for command selection and execution flow.

Before running:

- Confirm the selected profile exists.
- Confirm production iOS App Store builds are not simulator builds.
- Confirm production Android Play builds use AAB unless the user requests an internal APK.
- Confirm required public env vars exist in the selected profile.
- Confirm local artifact paths exist before artifact submit.
- Warn on metadata/privacy/store-dashboard gaps, but do not block unless they affect EAS command success.

## Execution Rules

- For build: run the exact `npx eas build ...` command matching platform/profile.
- For submit from latest build: run the exact `npx eas submit ...` command matching platform/profile.
- For submit from artifact: verify path exists, then run `npx eas submit ... --path <artifact>`.
- For status: use the appropriate EAS CLI status/list/build lookup command and summarize current state.
- If `submit.production` or the requested submit profile is missing, do not guess credentials; provide a minimal config-change plan.
- During long-running commands, capture build ID, URL, status, artifact path/URL, and next action.

## Failure Triage

Use `references/failure-triage.md` after any failed EAS command.

Summarize failures as:

- `Cause`: likely root cause.
- `Evidence`: exact log line or config value.
- `Fix`: concrete change or manual action.
- `Retry`: exact command to run again.

## Safety

- Never run EAS build/submit implicitly from a general audit request.
- Never commit or write signing secrets, service account JSON, `.p8`, `.p12`, provisioning profiles, keystores, passwords, or local env files.
- Never paste sensitive credential values into chat.
- Do not mutate project config unless the user explicitly asks for implementation.
