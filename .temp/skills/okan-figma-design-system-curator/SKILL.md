---
name: okan-figma-design-system-curator
description: Figma foundation and design-language curator. Use when Codex needs to audit, document, propose, or apply approved updates to Figma design foundations such as color tokens, typography, spacing, radius, elevation, layout rules, light/dark theme values, variable hygiene, and Design Language pages. Do not use for product screen design, onboarding flows, reusable component-library cleanup, marketing assets, store screenshots, landing pages, backend work, mobile implementation, or broad PM planning.
---

# Figma Design System Curator

Use Figma as the source of truth for app foundations and design-language documentation.

## Operating Model

- Start by inspecting the existing Design Language page, local variables, text styles, and representative foundation examples before proposing changes.
- Treat existing tokens and styles as the default system; reuse or update them instead of creating parallel token families.
- Separate exploration from implementation: local review frames are acceptable for alternatives, but variable/token migration happens only after a direction is explicitly approved.
- Keep foundation work connected to real UI usage, but do not redesign product screens as part of this skill.
- Prefer concise documentation that helps future designers and implementers make the same decisions consistently.

## Scope

Use this skill for:

- Design Language pages and foundation overview frames.
- Color, typography, spacing, radius, elevation, surface, layout, and interaction rules.
- Figma variable audits, approved token value updates, and light/dark theme value proposals.
- Foundation handoff notes and implementation-facing token guidance.
- Review boards for foundation alternatives such as surfaces, urgency colors, feedback colors, or dark-mode palettes.

Do not use this skill for:

- Product screen creation or feature flow design.
- Component library promotion, component variants, or component cleanup.
- Onboarding-specific flows, marketing visuals, store listings, screenshots, or landing pages.
- Backend, mobile, frontend implementation, billing logic, analytics, or PM planning.

## Figma Workflow

- Follow the required Figma execution skill before any Figma write action.
- Inspect before mutating: identify existing variable collections, modes, styles, Design Language frames, and relevant approved examples.
- When exploring, create clearly named alternatives and keep colors local unless the user asks to update variables.
- When applying approved values, update the existing variable collection directly; do not create new variables, modes, aliases, pages, or components unless explicitly requested.
- Keep brand, feedback, semantic, urgency, support, and shell token families separate unless the user explicitly asks to study or change one family.
- Document selected directions in Design Language before or alongside token changes when the change affects future design decisions.

## Layout And QA Rules

- Use Auto Layout deliberately: fixed sizing for review canvases and viewport examples, `Hug contents` for cards/rows/chips/text-led groups, and `Fill container` only where children should stretch.
- Before reporting completion, check for clipped text, collapsed frames, missing fonts, unbound paints, unexpected fixed vertical sizing, and hardcoded colors where variables should be used.
- Use explicit names for foundation frames and layers, such as `Design Language / Surface Alternatives`, `Token Swatch / panel`, or `Typography Sample / Section Label`.
- Keep selected or approved directions easy to find near the exploration history.

## Reference Files

- Read `references/foundation-checklist.md` when auditing or planning foundation coverage.
- Read `references/figma-token-workflow.md` before changing variables, modes, token values, or color systems.
- Read `references/design-language-review.md` when creating or updating Design Language documentation or review boards.
