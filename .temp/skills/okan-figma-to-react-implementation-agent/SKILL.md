---
name: okan-figma-to-react-implementation-agent
description: React implementation skill for translating Figma designs into production browser React code. Use when Codex needs to implement a Figma URL or selected node as React, convert Figma frames, pages, components, or UI states into typed React components or screens, update existing React UI to match Figma, or preserve design fidelity while integrating with project conventions. Do not use for Figma canvas editing, Figma design-system creation, React Native screens, backend work, or pure marketing copy and SEO work unless tied to Figma implementation.
---

# Figma-To-React Implementation Agent

Use this skill when the deliverable is browser React code that should match a Figma design.

## Operating Model

- Read the project and nearest `AGENTS.md` files before editing code.
- Inspect the frontend stack, routing, styling system, component library, design tokens, assets, tests, and validation scripts.
- Use the relevant Figma extraction skill or MCP workflow when a Figma URL, file, selected node, or design context is available.
- Treat Figma-generated React, Tailwind, or CSS as design reference material, not final project code.
- Keep implementation inside the frontend-owned area unless the user explicitly expands scope.
- Apply relevant React, framework, documentation, and accessibility skills required by the target repo.

## Scope

Use this skill for:

- Implementing Figma frames, pages, components, variants, or UI states in React.
- Updating existing React UI to match a Figma design.
- Translating Figma layout, typography, colors, effects, assets, and responsive constraints into project conventions.
- Creating typed React components or screens from Figma while preserving accessibility and maintainability.
- Importing or downloading Figma-provided assets into the project asset pipeline.

Do not use this skill for:

- Creating, editing, deleting, or reorganizing nodes inside Figma.
- Building Figma variables, component libraries, or design-system foundations.
- React Native or Expo screens.
- Backend APIs, persistence, migrations, or service logic.
- Pure marketing copy, legal content, or SEO work unless a Figma implementation change is the main task.

## Implementation Workflow

1. Parse the Figma source from the user request, including file key and node ID when provided.
2. Fetch design context and a screenshot when Figma tools are available; if output is too large, inspect metadata and fetch smaller child nodes.
3. Inventory the target React project before coding: existing components, tokens, fonts, asset handling, responsive patterns, and tests.
4. Map Figma structure to existing project primitives first; add new components only when reuse would create worse code.
5. Move required images, SVGs, and exported assets into the project asset pipeline instead of depending on temporary Figma URLs.
6. Implement typed, accessible React with semantic HTML, stable list keys, clear component boundaries, and mobile-first responsive behavior.
7. Match Figma spacing, alignment, typography, colors, radii, shadows, and states closely while preserving project conventions.
8. Document intentional deviations only when accessibility, responsiveness, or project constraints require them.
9. Validate against the Figma screenshot and the project’s required checks before reporting completion.

## Fidelity And Code Rules

- Prefer design tokens and existing component variants over one-off raw values when they preserve the intended visual result.
- If project tokens visibly conflict with Figma, choose the smallest project-consistent adjustment and call it out.
- Do not import new icon, animation, or UI libraries just because Figma includes a shape or icon.
- Do not hardcode brittle absolute positioning unless the design truly requires fixed overlay behavior.
- Preserve text hierarchy and readable line lengths across small and large viewports.
- Keep interactions keyboard-accessible and preserve visible focus states.
- Keep static content and view models outside render functions when that improves testability.

## Verification Expectations

- Run available frontend checks, typically typecheck, lint, format check, tests, and build.
- Add or update tests for user-visible behavior, rendered headings, controls, links, images, states, and route selection as relevant.
- For significant UI work, compare the result with the Figma screenshot at the intended viewport and at least one small responsive viewport unless the user explicitly skips visual validation.
- Check for clipping, overlap, horizontal scrolling, missing assets, broken focus states, and inaccessible controls.
- Report validation performed, skipped checks, intentional Figma deviations, and remaining design assumptions.

## Output Expectations

Summarize:

- Figma source implemented
- major React components or screens changed
- asset and token mapping decisions
- accessibility and responsive considerations
- validation performed
- any intentional deviations or unresolved design gaps

## Initial Instruction Template

Use this prompt in a React project:

```text
Use $okan-figma-to-react-implementation-agent to implement this Figma design in browser React. Inspect the Figma source, project AGENTS.md rules, frontend stack, components, tokens, assets, and tests before editing. Treat Figma-generated code as reference only, integrate with project conventions, preserve accessibility and responsive behavior, and validate against the Figma screenshot plus available frontend checks.
```
