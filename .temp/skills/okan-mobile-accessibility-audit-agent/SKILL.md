---
name: okan-mobile-accessibility-audit-agent
description: Use when auditing, reviewing, planning, or fixing accessibility in Expo or React Native mobile apps. Covers VoiceOver and TalkBack issues, accessible names, accessibilityLabel, accessibilityHint, accessibilityRole, accessibilityState, accessibilityLiveRegion, importantForAccessibility, modals and bottom sheets, tabs/navigation, forms and validation, switches and controls, gestures and swipe actions, touch targets, dynamic type/font scaling, color-only state, contrast risk, localization of accessibility copy, accessibility tests, and manual assistive-tech verification. Inspect the app first and do not use for browser React accessibility or formal compliance certification.
---

# Mobile Accessibility Audit Agent

Use this skill for practical accessibility audits and focused remediation in Expo and React Native apps.

Use `$mobile-implementation-agent` when applying code changes. Use `$okan-mobile-qa-smoke-test-agent` for general smoke QA. Use `$okan-react-native-performance-audit-agent` for performance investigations. Use `$react-accessibility-review-agent` for browser React accessibility, not React Native.

## Operating Model

- Inspect the app before reporting or fixing accessibility issues.
- Review app config, dependencies, shared components, target screens, navigation, modals/sheets, touch controls, forms, gestures, localization, tests, and existing accessibility props.
- Prioritize findings by user impact, confidence, and fix risk.
- Prefer native React Native accessibility props and meaningful visible text before custom labels.
- Use current docs through Context7 for React Native accessibility APIs, Expo/platform behavior, React Native Testing Library, gesture-handler, navigation, and platform assistive-tech behavior when details matter.
- Do not claim WCAG compliance, legal compliance, certification, or VPAT-level coverage.

## Audit Workflow

Read `references/mobile-accessibility-audit-workflow.md` before a repo or screen audit.

Default output sections:

- `Findings`: prioritized issues with affected component/flow, user impact, and exact fix direction.
- `Automated Checks`: focused test/lint/typecheck commands available in the repo.
- `Manual Assistive-Tech Script`: VoiceOver/TalkBack steps for affected flows.
- `Residual Risks`: items requiring device testing, design decisions, or product copy decisions.

## React Native Checklist

Read `references/react-native-accessibility-checklist.md` when reviewing code or implementing fixes.

Core checks:

- Interactive controls have meaningful accessible names, roles, and states.
- Icon-only and swipe-only actions have accessible alternatives or clear labels.
- Tabs, segmented controls, switches, disabled/busy/expanded/selected states are synchronized with UI state.
- Forms have labels, errors, instructions, and keyboard behavior that remain understandable to assistive tech.
- Modals and bottom sheets support close actions, Android back, sensible screen-reader traversal, and focus/visibility boundaries where feasible.
- Touch targets and `hitSlop` are sufficient for small controls.
- Dynamic type/font scaling does not clip critical content or controls.
- Color is not the only indicator of status, failure, selection, or progress.
- Accessibility labels and hints are localized when the app has localization.

## Manual Verification

Read `references/manual-assistive-tech-script.md` when producing device QA steps.

Manual review should cover:

- VoiceOver on iOS and TalkBack on Android when possible.
- Screen-reader order and names for the target flow.
- Activation of buttons, rows, switches, tabs, swipe actions, modals, and sheets.
- Dynamic type / larger text where supported.
- Reduced motion, dark/light mode, and high contrast risks when relevant.

## Remediation Rules

- Keep fixes narrow and behavior-preserving.
- Do not rewrite UI structure unless the current structure blocks accessibility.
- Localize new accessibility strings through the app's i18n system when present.
- Add focused tests when existing patterns support accessible labels, roles, states, or route/control behavior.
- Avoid hiding content from assistive tech unless it is genuinely decorative, duplicated, or not currently visible.
- Do not add broad design-system abstractions unless the same issue is repeated across shared primitives.

## Boundaries

- Do not perform browser React accessibility audits with this skill.
- Do not do broad UX redesign, visual redesign, or design-system sync unless a targeted accessibility fix requires it.
- Do not perform general smoke, release, privacy, or performance audits unless the issue is accessibility-specific.
- Do not claim legal compliance or certification.

## Handoff

Final responses should include:

- Accessibility behavior reviewed or changed.
- Prioritized findings or fixes.
- Tests/checks run and results.
- Manual VoiceOver/TalkBack checks still needed.
- Residual risks requiring design/product decisions or device access.
