# Smoke Test Selection

Use this reference to choose automated and manual QA checks.

## Inspect First

Check:

- `package.json` scripts.
- Existing unit/view-model/component tests.
- E2E configs such as Detox, Maestro, Appium, Playwright, or custom scripts.
- Changed files from git status/diff when available.
- Feature folders touched by the change.
- App config, native modules, and API schema scripts.
- Navigation routes and shared components touched.
- Release target: local dev, TestFlight/internal, App Store/Play release candidate.

## Automated Check Priority

1. Focused tests for changed helpers, view models, gestures, routing, API mapping, or settings models.
2. API schema check when OpenAPI/generated clients/contracts changed.
3. Typecheck for TypeScript/app-wide integration confidence.
4. Lint for code quality and import/pattern issues.
5. Full test suite for broad or risky changes.
6. Project `verify` script for release candidates or cross-cutting changes.
7. Existing E2E smoke command only if the repo already defines one.

## Risk-Based Additions

Add manual or automated checks when touched areas include:

- Auth/session/logout/guest upgrade.
- Navigation, tabs, modals, sheets, or deep links.
- Data mutations, cache invalidation, offline/error states.
- Native modules, secure storage, notifications, IAP, date/time pickers, localization, or theming.
- Swipe/pull gestures, keyboard input, lists, scrolling, and animations.
- API schema or backend contract changes.

## Output Format

Use concise sections:

- `Automated Checks`: command, purpose, expected outcome.
- `Manual Smoke Script`: numbered user steps.
- `Risk-Based Coverage`: what can break and how it is covered.
- `Not Covered`: device/account/backend/store requirements that local checks cannot prove.
