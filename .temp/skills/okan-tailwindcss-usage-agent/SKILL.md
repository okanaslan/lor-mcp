---
name: okan-tailwindcss-usage-agent
description: Tailwind CSS usage skill for browser frontend projects. Use when Codex needs to write, review, or refactor Tailwind CSS classes, clean up utility usage, fix responsive Tailwind layouts, map design tokens, use Tailwind v4 @theme, configure Tailwind with Vite or similar builds, structure component variants, review custom CSS layers, or fix bugs caused by dynamic class names. Do not use for pure visual design without Tailwind code, backend work, React Native styling, broad CSS architecture not using Tailwind, or formal design-system governance.
---

# Tailwind CSS Usage Agent

Use this skill to keep Tailwind CSS code maintainable, statically detectable, responsive, accessible, and aligned with the project’s design tokens.

## Operating Model

- Read the project and nearest `AGENTS.md` files before changing styles.
- Inspect the Tailwind version, build integration, CSS entrypoints, theme token setup, component patterns, class composition helpers, formatting setup, lint rules, and existing responsive conventions.
- Use current Tailwind documentation for version-specific syntax, setup, or migration questions.
- Prefer existing project tokens, utilities, and component variants over new one-off styling patterns.
- Keep Tailwind class names statically detectable by the compiler.
- Treat generated Figma or copied Tailwind as reference material; adapt it to the project’s tokens and component conventions.

## Scope

Use this skill for:

- Writing or reviewing Tailwind class usage in browser frontend projects.
- Cleaning up brittle, duplicated, conflicting, or unreadable utility strings.
- Fixing responsive layout issues with mobile-first utilities and breakpoint variants.
- Mapping colors, typography, spacing, radii, shadows, and layout values to theme tokens.
- Using Tailwind v4 CSS-first configuration, including `@theme`, CSS variables, and Vite plugin setups.
- Building explicit class maps for variants, sizes, tones, and states.
- Reviewing custom CSS, `@layer`, component classes, arbitrary values, and third-party class composition helpers.

Do not use this skill for:

- Pure visual design with no Tailwind implementation or review.
- Backend APIs, persistence, migrations, or service logic.
- React Native, Expo, NativeWind, or platform-native styling.
- Broad CSS architecture for projects that do not use Tailwind.
- Formal design-system governance, token naming strategy, or Figma library curation unless Tailwind code is the task.

## Tailwind Workflow

1. Inspect the project setup: Tailwind version, integration plugin, CSS entrypoint, theme declarations, content scanning behavior, and package scripts.
2. Identify the styling target: component, screen, layout, token mapping, responsive issue, variant system, or custom CSS cleanup.
3. Prefer project theme tokens and named utilities for recurring product colors, fonts, spacing, radii, and shadows.
4. Write mobile-first classes first, then add breakpoint variants such as `sm:`, `md:`, `lg:`, and larger sizes only when the layout needs them.
5. Keep variants explicit with object maps or constants, such as `sizeClasses` or `toneClasses`; do not build class names with string interpolation like `text-${color}-600`.
6. Use arbitrary values only when they represent real design constraints that do not deserve a token yet.
7. Extract custom CSS or component classes only when utility strings become unclear, are repeated widely, or need selectors/media behavior that utilities cannot express cleanly.
8. Preserve interaction and accessibility states, including `hover:`, `focus-visible:`, `disabled:`, `aria-*`, `data-*`, `motion-safe:`, and `motion-reduce:` when relevant.
9. Validate with available typecheck, lint, format check, tests, build, and visual/responsive checks appropriate to the change.

## Class Composition Rules

- Keep complete class names visible in source so Tailwind can detect them.
- Use explicit maps for component variants instead of concatenating partial utility names.
- Keep class order readable and consistent with the project formatter if one exists.
- Avoid conflicting utilities on the same element unless the override is intentional and breakpoint-scoped.
- Prefer composition at component boundaries over copying long class strings across many call sites.
- Keep conditional classes tied to clear UI state: selected, open, disabled, invalid, loading, active, or tone.

## Theme And Token Rules

- Use project tokens for brand colors, semantic colors, fonts, radii, surfaces, borders, and repeated spacing.
- In Tailwind v4 projects, prefer CSS-first theme variables via `@theme` when that matches the existing setup.
- Do not introduce raw hex values in component classes when a token exists.
- Do not create new tokens for one-off implementation details unless repetition or product meaning justifies them.
- Keep token names semantic or project-consistent rather than tied to a single component.

## Responsive And Layout Rules

- Design from the smallest supported width first.
- Use stable dimensions, min/max widths, grid tracks, flex wrapping, and aspect ratios to prevent text or controls from shifting unpredictably.
- Check for horizontal scrolling, clipped text, overlapping elements, inaccessible hit targets, and unreadable line lengths.
- Avoid viewport-scaled font sizes unless the project explicitly uses a controlled fluid type system.
- Prefer container-aware constraints over fragile absolute positioning.

## Verification Expectations

- Run available frontend checks when code changes are made: typecheck, lint, format check, tests, and build as applicable.
- For responsive or visual changes, inspect at least one small and one desktop viewport unless the user explicitly skips visual validation.
- If changing Tailwind config, theme variables, or build integration, verify generated styles through the project build.
- Report skipped checks, assumptions, token decisions, and any intentional arbitrary values or custom CSS.

## Output Expectations

Summarize:

- Tailwind usage changed or reviewed
- token and variant mapping decisions
- responsive/accessibility considerations
- validation performed
- skipped checks or remaining style risks

## Initial Instruction Template

Use this prompt for Tailwind work:

```text
Use $okan-tailwindcss-usage-agent to review or implement this Tailwind CSS change. Inspect the project Tailwind version, CSS entrypoints, theme tokens, class composition patterns, responsive conventions, and validation scripts first. Keep class names statically detectable, prefer project tokens, use explicit variant maps, write mobile-first responsive utilities, and verify with available checks.
```
