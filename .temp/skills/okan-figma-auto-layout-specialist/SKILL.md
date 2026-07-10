---
name: okan-figma-auto-layout-specialist
description: Figma Auto Layout specialist skill. Use when Codex needs to audit, fix, convert, or validate Figma Auto Layout structure, Hug/Fill/Fixed sizing modes, collapsed frames, clipped text, row/card height issues, scroll-review frame height, constraints, padding, gaps, and responsive layout behavior. Do not use for product-screen concept design, Design Language token work, component-library promotion, marketing visuals, backend work, mobile implementation, or broad PM planning.
---

# Figma Auto Layout Specialist

Use Figma as the source of truth for layout structure and sizing behavior.

## Operating Model

- Inspect the current Figma node hierarchy, nearby approved examples, component instances, and parent-child sizing before changing layout.
- Preserve visual appearance, product copy, colors, token bindings, component intent, and screen structure unless the user explicitly asks for redesign.
- Fix layout from the outside in: parent frame, content column, section/card, row, then text/icon children.
- Use Auto Layout to make the design robust; do not replace thoughtful layout with arbitrary fixed dimensions.
- Treat this skill as a layout repair and QA specialist that can support product-screen, component-library, and design-system work.

## Scope

Use this skill for:

- Auto Layout conversion or cleanup.
- `Hug contents`, `Fill container`, and fixed-size decisions.
- Collapsed frames, clipped text, missing visible content, and overflow issues.
- Row, card, form, sheet, list, and documentation-board sizing problems.
- Padding, gap, alignment, constraint, and scroll-review frame height cleanup.
- Layout QA before reporting Figma design work as complete.

Do not use this skill for:

- Product-screen concept design, new feature flows, or visual redesign.
- Design Language token values, typography systems, color systems, or dark-mode palettes.
- Component-library promotion, variant contract cleanup, or broad instance relinking.
- Marketing visuals, store screenshots, landing pages, or public-site design.
- Backend, mobile, frontend implementation, billing logic, analytics, or broad PM planning.

## Core Layout Rules

- Fixed sizing is for phone viewports, device previews, tab bars, deliberately locked examples, and fixed-size icon containers.
- Use `Hug contents` for text-led groups, buttons, chips, rows, cards, forms, stacked documentation sections, and vertical content height.
- Use `Fill container` only where a child should stretch inside an Auto Layout parent, such as full-width rows, content columns, sheet bodies, card bodies, and list items.
- Let row and card height come from content, padding, and gap values, not arbitrary fixed heights.
- For full scroll documentation, a taller-than-viewport frame is acceptable when it makes complete content reviewable.

## Figma Workflow

- Follow the required Figma execution skill before any Figma write action.
- Inspect source nodes before mutating layout, especially parent frame sizing, child resizing, text auto-resize, clipping, and overflow.
- Preserve source frames unless the user asks for an in-place repair; create audit notes or alternatives when safer.
- Recheck layout at the end by verifying parent/child sizing relationships, visible content, and visual equivalence.

## QA Rules

- Before reporting completion, check for clipped text, collapsed frames, overflowing children, unexpected fixed vertical sizing, invalid Fill usage, missing content, and broken component instances.
- Confirm review frames are tall enough to show intended content when they document scrollable mobile screens.
- Confirm no visual redesign, token change, copy rewrite, or component-library reorganization happened unless explicitly requested.
- Report the frames/components audited or repaired, the sizing issues fixed, and any remaining intentional fixed dimensions.

## Reference Files

- Read `references/auto-layout-rules.md` when deciding between Hug, Fill, and Fixed or structuring common UI patterns.
- Read `references/layout-audit-workflow.md` before auditing or repairing a Figma layout.
- Read `references/layout-qa-checklist.md` before final validation.
