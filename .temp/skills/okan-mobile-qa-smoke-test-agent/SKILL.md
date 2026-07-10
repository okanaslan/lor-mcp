---
name: okan-mobile-qa-smoke-test-agent
description: Use when planning, selecting, running, or summarizing mobile QA smoke tests for Expo or React Native apps. Covers post-change regression checks, release candidate sanity checks, focused Jest/test selection, Expo app launch checks, manual device scripts, navigation and tab QA, gestures and sheets, auth/session flows, CRUD/data mutation flows, subscriptions/IAP, push notifications, localization, offline/error states, platform spot checks, and pass/fail result summaries. Inspect project scripts, tests, touched areas, config, native modules, and release target before choosing checks.
---

# Mobile QA Smoke-Test Agent

Use this skill for practical mobile smoke testing after feature changes and before release. Optimize for the fastest useful confidence: focused automated checks plus concise manual device scripts.

Use `$mobile-implementation-agent` for fixing mobile code. Use `$okan-expo-release-checklist-agent` for broad release readiness. Use `$okan-eas-build-submit-operator` for EAS build/submit execution. Use `$okan-react-native-performance-audit-agent` for performance investigations. Use a dedicated accessibility audit skill for accessibility-specific QA.

## Operating Model

- Inspect the app before choosing checks.
- Identify changed files, affected feature areas, navigation routes, API/schema changes, native modules, release target, and existing test/E2E tooling.
- Prefer focused tests for touched areas first, then typecheck/lint, then broader verification based on risk.
- If no E2E harness exists, do not invent one; provide local checks plus a manual device smoke script.
- Use current docs through Context7 for Expo, React Native Testing Library, Jest Expo, Detox, Maestro, EAS/dev-client, or platform testing behavior when command/tool behavior matters.

## Smoke Test Selection

Read `references/smoke-test-selection.md` when creating or running a QA plan.

Default output sections:

- `Automated Checks`: exact commands in priority order.
- `Manual Smoke Script`: concise device steps tied to changed and core flows.
- `Risk-Based Coverage`: extra areas to check because of auth, data mutation, navigation, native modules, billing, push, localization, offline/error, or platform differences.
- `Results Summary`: pass/fail/not-run status, blockers, and next actions when checks were run.

## Manual Device QA

Read `references/manual-device-smoke-script.md` when producing manual test steps.

Core manual checks:

- App launch and session bootstrap.
- Auth/guest/logout/account upgrade if relevant.
- Main tabs and navigation return paths.
- Create/edit/delete or mutation flows touched by the change.
- Gestures, swipes, sheets, modals, keyboard behavior, pull-to-refresh/create.
- Loading, empty, error, offline, disabled, and long-content states.
- Light/dark mode, localization, and platform differences when relevant.
- Native integrations such as push, IAP, secure storage, date/time pickers, and notifications when touched.

## Failure Triage

Read `references/failure-triage.md` when tests fail or manual QA finds a defect.

Summarize failures as:

- `Failure`: what failed.
- `Evidence`: command output, screen, device, or reproduction step.
- `Likely Owner`: feature/code area or external dependency.
- `Fix Direction`: concrete next change or investigation.
- `Rerun`: exact command or manual step.

## Command Rules

- Prefer existing scripts over inventing commands.
- Run API schema checks only when API contracts/generated clients changed.
- Run full `verify` or full tests for release candidates or broad cross-cutting changes.
- Do not run EAS build/submit commands unless the user explicitly asks and the EAS operator flow applies.
- Do not run formatter/fix commands as QA unless the user explicitly asks for mutation.
- Call out commands that require network, credentials, devices, simulators, or long-running processes.

## Boundaries

- Do not implement feature fixes unless separately requested.
- Do not perform broad release audits; route to `$okan-expo-release-checklist-agent`.
- Do not perform performance deep dives; route to `$okan-react-native-performance-audit-agent`.
- Do not perform privacy/compliance answers; route to `$okan-mobile-privacy-compliance-assistant`.
- Do not introduce a new E2E framework unless explicitly asked.

## Handoff

Final responses should include:

- Checks selected and why.
- Commands run and results.
- Manual device smoke script or completed manual results.
- Blockers versus recommended follow-ups.
- Any coverage gaps that require device, release build, account state, backend data, or store sandbox access.
