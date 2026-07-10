---
name: okan-mobile-localization-rollout-agent
description: Use when rolling out, auditing, or maintaining localization in Expo or React Native mobile apps. Covers translation key rollout, hardcoded string audits, language picker behavior, supported locale normalization, fallback locales, i18n-js or similar libraries, Expo localization, interpolation and plurals, date/time/number formatting, accessibility labels, EN/TR parity, and mobile UI text-expansion QA. Inspect the app's existing localization infrastructure before advising or editing.
---

# Mobile Localization Rollout Agent

Use this skill for mobile app localization work in Expo or React Native projects. Optimize for app-consistent translation coverage, safe locale behavior, and UI that still works with translated text.

Use `$mobile-implementation-agent` alongside this skill for general React Native implementation discipline. Use `$okan-figma-to-mobile-implementation-agent` when localization is part of a Figma-driven UI change. Use `$store-listing-copy-agent` for App Store or Google Play listing copy. Use `$okan-mobile-privacy-compliance-assistant` for privacy, legal, or compliance wording decisions.

## Operating Model

- Inspect the app's localization system before giving implementation guidance or editing files.
- Identify supported locales, fallback locale, translation file shape, i18n provider/hook, language settings UI, auth/onboarding language payloads, tests, and hardcoded visible strings.
- Preserve the existing i18n library and app patterns unless the task explicitly asks for a migration.
- Keep every supported locale in sync when adding or changing visible UI copy.
- Ask only for translation intent that cannot be inferred, such as preferred wording, tone, or whether a business/legal phrase has approved copy.
- Use current docs through Context7 for localization libraries, Expo localization APIs, React Native i18n behavior, Intl support, or platform locale behavior when implementation depends on current behavior.

## Localization Workflow

Read `references/localization-rollout-workflow.md` when auditing or implementing a rollout.

Default flow:

- Map existing translation sources and supported locales first.
- Search for hardcoded user-visible strings in the target feature and nearby shared components.
- Add feature-scoped translation keys that match the app's existing key structure.
- Update all supported locale files in the same change.
- Normalize regional language tags to supported app locales; do not expose unsupported regional variants in language pickers.
- Keep backend text, user-generated content, AI-generated content, task names, notes, report bodies, and server error details as content unless explicitly requested.
- Update focused tests for locale resolution, language options, translation fallback, key-producing view models, or changed UI models when patterns exist.

## Quality Rules

Read `references/translation-quality-checklist.md` for translation QA and text-expansion checks.

Core rules:

- Do not leave missing translation keys in secondary locales.
- Keep interpolation variable names identical across locales.
- Check plural/count wording and numeric/date/time formatting for locale correctness.
- Localize accessibility labels, placeholders, button labels, empty/error/loading states, toast copy, and validation messages.
- Avoid translating constants, enum values, API statuses, product IDs, file paths, URLs, emails, or user content.
- Check long Turkish and English strings for wrapping, truncation, touch target overlap, and sheet/modal scroll behavior.
- Prefer concise, natural translations over literal word-by-word translations.

## Boundaries

- Do not rewrite the localization architecture unless explicitly requested.
- Do not machine-translate legal, privacy, subscription, medical, or regulated copy without flagging that human approval is needed.
- Do not handle App Store or Google Play listing metadata with this skill; route it to `$store-listing-copy-agent`.
- Do not make design-system token or component changes unless localization text expansion directly requires a small UI fix.
- Do not invent supported languages; discover them from the repo or ask if the app is being expanded to new locales.

## Handoff

Final responses should include:

- Locales and translation areas touched.
- Hardcoded strings removed or remaining known gaps.
- Tests/checks run and results.
- Manual QA still needed for language switching, text expansion, accessibility labels, and platform locale behavior.
