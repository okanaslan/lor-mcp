---
name: okan-figma-to-mobile-implementation-agent
description: Use when implementing Expo or React Native mobile UI from Figma URLs, Figma nodes, screenshots, or updated mobile designs. Covers Figma-to-React-Native translation for screens, bottom sheets, list cards, settings pages, empty/loading states, tokens, colors, typography, icons, dark mode, and component refreshes. Prefer Figma MCP design context when available, inspect the current app first, and preserve existing mobile architecture, feature folders, navigation, state, and behavior.
---

# Figma-to-Mobile Implementation Agent

Use this skill to translate Figma designs into focused Expo/React Native app changes. It is a mobile implementation bridge: fetch or interpret design truth, map it to the current app, and implement the smallest correct feature-area change.

Use `$mobile-implementation-agent` alongside this skill for general React Native implementation discipline. Use Figma file-editing skills when the task is to change Figma itself. Use a future design-system sync skill for broad token/library alignment.

## Operating Model

- Inspect the current mobile app structure before implementing.
- Identify the target feature folder, screen, component family, navigation route, tokens, translations, data/view-model shape, and tests.
- Prefer existing feature components and explicit purpose-named wrappers over highly configurable shared components.
- Preserve behavior unless the user explicitly asks to change it: API calls, navigation, field ordering, state, gestures, swipes, sorting, cache invalidation, and mutations.
- Implement visible copy through the app's localization system when one exists.
- Validate both the Figma visual intent and mobile runtime states.

## Figma Input Workflow

Use `references/mobile-figma-workflow.md` for URL parsing, context capture, and implementation sequencing.

- If a Figma URL is provided, parse the file key and node ID.
- Prefer Figma MCP design context and screenshot when available.
- Treat the screenshot as visual source of truth and the structured design context as implementation input.
- If Figma MCP is unavailable, explicitly state the limitation and implement from the user-provided screenshot or visible design requirements only.
- Do not invent backend fields, statuses, navigation routes, or interactions from visual design alone.

## React Native Translation Rules

Use `references/react-native-translation-rules.md` for mobile-specific mapping.

Core rules:

- Map Figma colors to existing app tokens before adding new tokens.
- Reuse established typography, spacing, radius, card, sheet, header, list, input, and button patterns first.
- Keep safe areas, keyboard handling, ScrollView/FlatList behavior, bottom tabs, and modal/sheet dismissal intact.
- Prefer existing icon libraries/assets already used by the app; add assets only when the design requires non-icon artwork.
- Check light/dark mode, long text, localization expansion, loading, empty, error, disabled, and pressed states.
- Avoid pixel-perfect one-offs that fight the app's design system unless the user explicitly prioritizes exact one-off fidelity.

## Boundaries

- Do not edit Figma files or create Figma libraries with this skill.
- Do not perform backend/API/schema changes unless the request explicitly includes backend work; otherwise surface missing data as an assumption or follow-up.
- Do not create broad design-system abstractions for a single design update.
- Do not change product behavior to match a static Figma image unless behavior change is explicitly requested.

## Handoff

Final responses should include:

- What changed visually and behaviorally.
- Key implementation areas touched.
- Figma limitations or deviations, if any.
- Verification commands and results.
- Manual visual checks still needed, especially light/dark and device sizes.
