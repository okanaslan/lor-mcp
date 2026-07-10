---
name: okan-mobile-design-system-sync-agent
description: Use when syncing Figma design-system foundations into Expo or React Native mobile code. Covers Figma-to-mobile color, typography, spacing, radius, dark/light tokens, NativeWind/Tailwind variable mappings, theme providers, reusable component colors/states, loading and skeleton surfaces, shared primitives, and design-system mismatch audits. Treat Figma as source of truth, inspect mobile theme/components first, and implement focused design-system syncs without changing feature behavior.
---

# Mobile Design-System Sync Agent

Use this skill to sync Figma design-system foundations and reusable component contracts into mobile code. Figma is the source of truth. This skill can implement mobile code syncs when requested.

Use `$okan-figma-to-mobile-implementation-agent` for one-off screen or feature design implementation. Use `$mobile-implementation-agent` for general mobile implementation discipline. Use Figma design-system skills when the task is to edit Figma itself.

## Operating Model

- Inspect Figma source first when a Figma URL, token list, or component page is provided.
- Inspect mobile theme, NativeWind/Tailwind config, theme provider, shared primitives, feature wrappers, and tests before changing code.
- Update the smallest stable design-system layer that fixes the mismatch.
- Prefer canonical semantic token names from Figma.
- Keep compatibility aliases only when needed to avoid risky broad refactors.
- Avoid feature behavior changes: no API, navigation, data mapping, sorting, gestures, mutations, or business logic changes unless explicitly requested.

## Figma Source Handling

- Use Figma MCP for token/component truth when available.
- If Figma MCP is unavailable, use user-provided token values, screenshots, or explicit design notes and state the limitation.
- Distinguish foundation sync from one-off screen implementation.
- Do not edit Figma files from this skill.

## Mobile Sources To Inspect

Use `references/mobile-token-sync.md` for token sync workflow.

Inspect:

- theme token definitions and tests.
- NativeWind/Tailwind color and variable mappings.
- theme provider, runtime variables, and direct JS token usage.
- shared primitives: buttons, inputs, sheets, list cards, tracker charts, tabs, settings rows, skeletons.
- feature wrappers that intentionally own semantic visuals.
- localization only when component labels or accessibility copy change.

## Sync Strategy

- Sync token values and mappings before component usages.
- Add new tokens only when Figma introduces a reusable semantic concept.
- Prefer migrating touched code to canonical names while preserving aliases for existing call sites when needed.
- Update tests that assert token values, aliases, or component-level mapping helpers.
- For component syncs, update design-system-level visuals only: colors, radius, spacing, icon size, state colors, skeleton surfaces, dark/light behavior.
- Route feature-specific Figma node implementation to `$okan-figma-to-mobile-implementation-agent`.

## Component Sync

Use `references/component-sync-checklist.md` when auditing reusable component mismatches.

Default reusable component areas:

- navigation headers and tab bars.
- segmented controls and chips.
- primary/secondary/social buttons.
- text inputs, notes inputs, pickers.
- bottom sheets and modal scaffolds.
- list cards, dividers, rails, badges, skeletons.
- tracker charts, empty/error/loading cards.
- settings groups and rows.
- toast/action surfaces.

## Boundaries

- Do not redesign product screens.
- Do not create broad abstractions just to match one Figma instance.
- Do not remove compatibility aliases unless the full migration is in scope.
- Do not hardcode app-specific values into the skill.
- Do not skip verification for token changes; token regressions spread widely.

## Handoff

Final responses should include:

- Synced token/component areas.
- Any compatibility aliases kept.
- Figma values or source used.
- Verification commands and results.
- Manual light/dark and component spot checks still needed.
