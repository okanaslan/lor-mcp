# Mobile Accessibility Audit Workflow

Use this reference when auditing an Expo or React Native app flow.

## Inspect First

Check:

- `package.json` for React Native, Expo, navigation, gesture, testing, and UI dependencies.
- App config for platform features that affect accessibility.
- Shared primitives: buttons, inputs, switches, tabs, cards, sheets, modals, toasts, list rows, and icon buttons.
- Target feature screens and route entrypoints.
- Gesture/swipe surfaces and whether non-gesture alternatives exist.
- Translation files for accessibility copy if the app is localized.
- Tests using React Native Testing Library or model/helper tests for labels/states.

## Review Order

1. Screen structure and navigation entry/exit.
2. Interactive control names, roles, states, and hints.
3. Modal/sheet focus, dismissal, and traversal.
4. Forms, validation, inputs, keyboard behavior, and errors.
5. Gestures, swipe actions, pull actions, and alternatives.
6. Dynamic type, touch targets, clipping, and scrollability.
7. Color-only meaning and contrast risk.
8. Automated test coverage and manual VoiceOver/TalkBack gaps.

## Finding Format

For each finding, include:

- Severity: `Blocking`, `Recommended`, or `Optional`.
- Flow/component/file when known.
- Issue and affected assistive-tech user impact.
- Fix direction with React Native props or UI behavior.
- Verification step.

## Severity Guidance

- `Blocking`: primary flow unreachable, unlabeled critical controls, trapped/unclosable modal, destructive action unclear, form cannot be completed, paid/auth flow inaccessible.
- `Recommended`: confusing labels, missing state, gesture-only secondary action, weak modal traversal, insufficient error announcement, likely touch target issue.
- `Optional`: polish, redundant wording, minor hint improvement, low-risk contrast or text expansion concern.

## Remediation Approach

- Fix shared primitives when the issue repeats widely.
- Fix feature components when the issue is flow-specific.
- Preserve behavior and visuals unless the current UI prevents accessibility.
- Add tests for accessible names/states where existing test patterns support it.
