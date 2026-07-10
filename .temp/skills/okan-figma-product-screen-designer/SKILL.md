---
name: okan-figma-product-screen-designer
description: Figma product screen design skill. Use when Codex needs to design, update, polish, or create alternatives for in-app Figma product screens, screen states, bottom sheets, modals, detail/edit/create views, empty/loading/error/success states, flow artifacts, and implementation-ready screen handoff notes. Do not use for Design Language foundations, color or typography token systems, component-library maintenance, marketing assets, store screenshots, landing pages, backend work, mobile implementation, or broad PM planning.
---

# Figma Product Screen Designer

Use Figma as the source of truth for in-app product screens and flows.

## Operating Model

- Start by inspecting the source frame, surrounding page, reusable components, variables, and nearby approved screens before designing.
- Preserve existing approved screens unless the user explicitly asks for an in-place update.
- Create alternatives beside the source frame by default, with clear names that describe the state or design direction.
- Reuse existing shells, components, variables, typography, spacing, and interaction patterns before creating new local structures.
- Keep screens implementation-ready: explicit state names, realistic copy, visible actions, and clear screen contracts.

## Scope

Use this skill for:

- In-app product screens and feature screens.
- Screen states: default, empty, loading, error, success, locked, unauthenticated, guest, validation, and submitting.
- Detail, edit, create, bottom-sheet, modal, popup, and interaction-example frames.
- Screen alternatives and review frames placed near source designs.
- Implementation-facing handoff notes for screen behavior and data assumptions.

Do not use this skill for:

- Design Language foundations, token systems, color palettes, typography systems, or dark-mode values.
- Component-library promotion, component variant cleanup, or broad relinking.
- Marketing visuals, store listings, screenshots, landing pages, or public-site design.
- Backend, mobile, frontend implementation, billing logic, analytics, or broad PM planning.

## Screen Design Rules

- Match the current product shell and page-specific visual language unless the user asks for exploration.
- Keep primary content scan-first, then supporting details, metrics, forms, or action rows below.
- Design complete states when the flow needs them; do not stop at the happy path if empty/loading/error states are part of the request.
- Prefer visible controls for quick decisions; hide actions behind gestures only when the interaction itself is being designed.
- Use realistic product copy and data examples instead of placeholder lorem ipsum.
- Keep row height driven by content and padding, not arbitrary fixed heights.

## Figma Workflow

- Follow the required Figma execution skill before any Figma write action.
- Inspect current frame hierarchy, text, variables, component instances, and nearby related frames before mutation.
- If designing alternatives, place them beside the source frame and keep the source unchanged.
- If updating in place, modify only the requested frames and preserve unrelated screens.
- Use Auto Layout deliberately: fixed viewport frames, `Hug contents` for cards/rows/chips/text-led groups, and `Fill container` for stretch behavior inside content columns.

## QA Rules

- Before reporting completion, check for clipped text, collapsed frames, missing fonts, unintended hardcoded colors, unexpected fixed vertical sizing, and broken component instances.
- Confirm active tab/header/context remains correct when designing full mobile screens.
- Confirm frame names clearly communicate area, screen, and state, such as `Tasks / Home / Loading` or `Settings / Update Email`.
- Report created or updated frames, notable assumptions, and any intentionally skipped states.

## Reference Files

- Read `references/screen-state-checklist.md` when deciding which screen states to include.
- Read `references/figma-screen-workflow.md` before creating or updating composed Figma screens.
- Read `references/product-handoff-notes.md` when documenting behavior, actions, navigation, or data assumptions.
