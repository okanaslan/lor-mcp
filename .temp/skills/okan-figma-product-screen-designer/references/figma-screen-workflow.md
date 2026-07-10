# Figma Screen Workflow

Use this workflow for in-app Figma screen creation or updates.

## Inspect

- Identify the target page, source frame, related states, and nearby approved patterns.
- Check component instances, local components, variables, typography, tab/header context, and existing frame names.
- Determine whether the request asks for alternatives or an in-place update.

## Design

- Reuse existing shells, tab bars, headers, cards, inputs, sheets, and notification patterns.
- Keep source frames unchanged when creating variants.
- Place alternatives beside or below the source frame with clear names.
- Use the current design language, token variables, and component family unless exploration is requested.
- Keep content realistic and implementation-ready.

## Layout

- Use fixed dimensions for phone viewports and deliberately locked previews.
- Use `Hug contents` for content-driven cards, rows, forms, chips, and text groups.
- Use `Fill container` only where a child should stretch inside an Auto Layout parent.
- For full scroll documentation, taller-than-viewport frames are acceptable when they improve review.

## Validate

- Check visible hierarchy, active tab, header context, and bottom navigation.
- Check clipped text, collapsed frames, missing fonts, broken instances, and unexpected fixed sizing.
- Confirm actions are visible and understandable unless the design intentionally demonstrates a hidden gesture.
