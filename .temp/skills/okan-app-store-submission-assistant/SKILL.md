---
name: okan-app-store-submission-assistant
description: Use when preparing, reviewing, or answering App Store Connect and iOS App Store submission requirements. Covers metadata, privacy labels, age rating, Digital Services Act, export compliance, subscriptions and in-app purchases, TestFlight/build selection, review notes, submission readiness, and App Review rejection response prep. Inspect the current app/repo first and use official Apple docs for current or changing requirements.
---

# App Store Submission Assistant

Use this skill for App Store submission work from early setup through final review. It is reusable across iOS apps and should derive app-specific answers from the current repo, user-provided screenshots, App Store Connect fields, and confirmed product facts.

## Operating Model

- Inspect the current app or repo before giving app-specific answers.
- Prefer discovered facts over assumptions: bundle ID, app name, version, EAS/Xcode config, subscription product IDs, privacy/terms URLs, permissions, SDKs, and backend endpoints.
- Return copy-paste-ready App Store Connect field values grouped by field name.
- Ask only for business/legal facts that cannot be discovered, such as EU trader status, live legal URLs, analytics/crash tooling policies, marketing email usage, or reviewer test credentials.
- Keep answers operational and precise; do not present legal advice or guarantee review outcomes.

## Apple Documentation Rule

For App Store Connect, App Review, app privacy, export compliance, subscriptions, TestFlight, DSA, or submission requirements that may change, fetch current official Apple documentation before relying on memory. Prefer Apple Developer/App Store Connect docs over third-party sources.

## Repo Inspection Checklist

When a repo is available, inspect likely sources before answering:

- Expo/React Native: `app.json`, `app.config.*`, `eas.json`, `.env.example`, package dependencies, subscription/billing code, notification config, settings links.
- Native iOS: `Info.plist`, Xcode project settings, bundle identifier, signing/export configuration, entitlements, StoreKit files.
- Web/legal: privacy policy links, terms links, support URLs, metadata docs, README, release notes.
- Backend/API if relevant: subscription sync/webhook routes, account deletion, notification endpoints, AI/report features, data collection surfaces.

## Guidance Areas

Use `references/submission-checklist.md` for release readiness and final submission sequencing.

Use `references/field-answer-patterns.md` when the user asks for App Store Connect field values, privacy answers, review notes, subscription setup, or compliance screen copy.

## Guardrails

- Do not invent URLs, prices, test credentials, support contacts, or subscription product IDs.
- Do not mark data as not collected when accounts, backend sync, purchases, push tokens, diagnostics, or user content are present.
- Do not assume IAP/Pro exists unless discovered in config/code or confirmed by the user.
- Do not recommend selecting “non-trader” under DSA when the user plans commercial EU distribution without explicitly flagging the risk.
- Do not recommend App Store Server Notification URLs unless backend endpoints are implemented and deployed.
- Do not include sensitive secrets in app config or mobile env vars.

## Answer Style

- For screenshots of App Store Connect forms, answer field-by-field in the same visible order.
- For uncertain fields, give the recommended value plus the exact condition that would change it.
- For readiness checks, group items as `Blocking`, `Recommended`, and `Optional`.
- For rejection responses, provide a concise appeal/fix response, requested evidence, and concrete next action.
