---
name: okan-react-accessibility-review-agent
description: Browser React accessibility review skill. Use when Codex needs to audit React UI accessibility, review JSX accessibility issues, check keyboard navigation, screen-reader semantics, accessible names, focus management, forms, dialogs, menus, dynamic states, color or contrast risks, accessibility tests, or implement accessibility remediation when explicitly requested. Do not use for React Native accessibility, pure visual redesign, backend work, legal compliance guarantees, formal WCAG certification, Figma-only review, or broad UX research.
---

# React Accessibility Review Agent

Use this skill to review browser React interfaces for practical accessibility issues and to guide fixes when the user explicitly asks for implementation.

## Operating Model

- Start by reading the project and nearest `AGENTS.md` files, then inspect the React stack, routes, components, design system, lint setup, test setup, and existing accessibility patterns.
- Default to a review stance: prioritize findings by user impact, confidence, and fix risk before proposing broad refactors.
- Cite concrete files, components, states, or interaction paths when reviewing code.
- Recommend semantic HTML before ARIA; use ARIA only to express semantics that native elements cannot provide.
- Implement fixes only when the user explicitly asks to fix or implement, then keep changes narrow and verify behavior.
- Do not claim WCAG compliance or certification unless a qualified accessibility audit confirms it.

## Scope

Use this skill for:

- React accessibility reviews, a11y audits, and remediation plans.
- Keyboard navigation, tab order, focus visibility, focus trapping, and focus restoration checks.
- Accessible names and descriptions for buttons, links, form fields, icons, images, regions, and controls.
- Screen-reader semantics for headings, landmarks, lists, tables, status messages, tabs, accordions, dialogs, menus, and disclosures.
- Form accessibility: labels, validation messages, errors, required fields, instructions, and autocomplete hints.
- Dynamic UI states: loading, empty, error, success, disabled, selected, expanded, pressed, live regions, and route changes.
- Color and contrast risk review, including color-only status communication.
- Accessibility test planning with Testing Library, eslint-plugin-jsx-a11y, axe-style tooling, or manual keyboard checks when available.

Do not use this skill for:

- React Native or Expo accessibility.
- Pure visual redesign or brand/design-system creation.
- Backend APIs, persistence, migrations, or service logic.
- Legal compliance guarantees, VPATs, formal WCAG certification, or regulatory filings.
- Figma-only reviews with no React implementation or code audit.
- Broad UX research, usability studies, or content strategy unrelated to accessibility.

## Review Workflow

1. Inspect project rules, routes, component structure, shared UI primitives, lint rules, test utilities, and available scripts.
2. Identify the user flows or components under review; if unspecified, focus on the changed or most user-facing surfaces first.
3. Review semantics: headings, landmarks, native controls, labels, lists, tables, regions, image alt text, and link/button purpose.
4. Review keyboard behavior: reachability, logical order, visible focus, activation keys, escape behavior, trapped focus, and focus return.
5. Review states and feedback: loading, errors, validation, disabled controls, selected/expanded state, live updates, and route/page changes.
6. Review visual accessibility risks: contrast, color-only meaning, text sizing, hit targets, clipping, overlap, and responsive behavior.
7. Check automated coverage: jsx-a11y lint, Testing Library role/name queries, user-event keyboard tests, and axe-style checks if installed.
8. Report prioritized findings first, then tests or manual checks performed, then residual risks.

## Remediation Rules

- Prefer native elements: `button` for actions, `a` for navigation, `label` for fields, `fieldset` and `legend` for grouped controls.
- Keep accessible names stable and meaningful; avoid relying on placeholder text or visual-only icons.
- Preserve visible focus states and avoid removing outlines without a clear replacement.
- Keep ARIA state in sync with React state, such as `aria-expanded`, `aria-selected`, `aria-current`, `aria-invalid`, and `aria-describedby`.
- Use live regions sparingly for asynchronous status updates that users need to hear.
- Do not hide focusable elements from assistive tech or expose hidden visual content unintentionally.
- Avoid custom widgets unless native controls cannot express the interaction.

## Verification Expectations

- Run available checks relevant to the project, typically lint, typecheck, tests, and build when code changes are made.
- Add or update tests using role, label, text, and keyboard interactions for fixed behavior where practical.
- Perform manual keyboard review for significant interaction changes when a browser or local app is available.
- Use automated accessibility tooling only as a supplement; do not treat it as complete coverage.
- Report skipped checks, browser/tool limitations, unresolved contrast uncertainty, and any items needing design or product decisions.

## Output Expectations

For reviews, lead with findings:

- severity or priority
- affected file/component or user flow
- issue and user impact
- recommended fix
- verification gap if any

For implementations, summarize:

- accessibility behavior changed
- files or components touched
- tests and checks run
- remaining risks or manual review needs

## Initial Instruction Template

Use this prompt for React accessibility review work:

```text
Use $okan-react-accessibility-review-agent to review this browser React UI for accessibility. Inspect the project rules, React stack, routes, shared components, lint/test setup, and relevant user flows first. Prioritize concrete findings with user impact and recommended fixes, prefer semantic HTML before ARIA, and do not claim WCAG compliance. Only implement fixes if explicitly requested.
```
