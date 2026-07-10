# Localization Rollout Workflow

Use this reference when auditing or implementing localization in an Expo/React Native app.

## Inspect First

Check likely sources before changing copy:

- Translation files and supported locale exports.
- I18n provider, hook, fallback locale, and locale resolver.
- Device locale integration such as `expo-localization` or platform APIs.
- Settings or onboarding language picker and update payloads.
- Auth/session user language fields and backend language persistence.
- Tests for locale resolution, language options, and translated view models.
- Feature components for hardcoded `Text`, placeholders, button labels, toasts, errors, accessibility labels, and navigation titles.

## Key Design

- Follow the current translation object shape and naming style.
- Prefer feature-scoped keys for feature copy and `common.*` only for widely reused labels.
- Keep key names semantic, not tied to the English phrase.
- Use interpolation for runtime values instead of string concatenation.
- Keep enum/API/status values separate from translated labels.
- Do not put user-generated, backend-generated, AI-generated, URLs, product IDs, or file paths into translation files.

## Implementation Sequence

1. Identify all visible copy in the target flow.
2. Add missing keys to the default locale.
3. Add matching keys to every supported locale.
4. Replace hardcoded strings with the app's translation hook/function.
5. Preserve existing component and view-model boundaries.
6. Update tests for locale resolution, picker options, translation fallback, and key-producing view models where patterns exist.
7. Run focused tests, typecheck, and lint when available.

## Locale Handling

- Normalize regional tags to supported base locales when that is the app convention.
- Keep picker options limited to supported app locales.
- Preserve a stable default/fallback locale.
- Avoid showing unsupported device locales as selectable values.
- Persist only values accepted by the backend/API contract.

## Verification

Run the most focused commands available first:

- Localization helper tests.
- Feature tests for changed view models or screens.
- Typecheck.
- Lint.

Manual checks should cover language switching, fallback behavior, missing keys, long text wrapping, modal/sheet scrollability, and accessibility labels.
