# Mobile Figma Workflow

## Intake

Identify:

- Figma URL or screenshot/image source.
- Target platform and screen/feature.
- Whether the request is visual-only or includes behavior/API changes.
- Existing component or feature area likely affected.

## Figma URL Parsing

For URLs like:

```text
https://www.figma.com/design/<fileKey>/<fileName>?node-id=947-191&m=dev
```

Use:

- `fileKey`: path segment after `/design/`.
- `nodeId`: `node-id` query value, converting `-` to `:` if the Figma tool expects colon format.

Also handle:

- `/board/` for FigJam context, usually not mobile implementation.
- `/slides/` for presentations, usually not mobile implementation.
- `/make/` only if relevant to design handoff.

## Preferred MCP Flow

When Figma MCP tools are available:

1. Fetch design context for the node.
2. Fetch screenshot for the same node.
3. If context is too broad, fetch metadata and then child nodes for the specific component/screen.
4. Extract layout, typography, colors, tokens, icons, variants, and states.
5. Compare against current app components before editing.

## Screenshot-Only Fallback

When MCP is unavailable or only an image is provided:

- State that exact specs are inferred from screenshot.
- Use existing app tokens and components as the source for exact values.
- Avoid adding new tokens or assets unless the visual need is clear.
- Preserve behavior and data mapping from the current app.

## Implementation Sequence

1. Inspect current target files and related shared primitives.
2. Identify the smallest component boundary to change.
3. Map design elements to app tokens/components.
4. Implement feature-local changes first; promote shared primitives only when multiple current call sites need the same stable mechanic.
5. Add/update localization keys for new visible copy.
6. Run focused tests/checks.
7. Summarize deviations from Figma and manual visual QA needed.

## Design-System Conflict Policy

- If Figma uses a token already present in the app, use the app token.
- If Figma has a new semantic token used across multiple components, plan or implement token sync deliberately.
- If Figma has a one-off raw value, prefer a local style/class unless it clearly belongs in the design system.
