# React Native Translation Rules

## Layout

- Preserve safe-area handling and tab/header overlays.
- Use existing ScrollView/FlatList patterns; do not replace list mechanics without a performance or behavior reason.
- Respect keyboard behavior in forms and bottom sheets.
- Use fixed heights only when the app standardizes that component family.
- Test long localized strings and long user content.

## Components

- Prefer feature-specific components for feature-specific card/sheet/list behavior.
- Use shared primitives only for stable mechanics: frame, rail, divider, sheet shell, button base, input base.
- If a shared component needs many visual/behavior knobs, create or update explicit feature wrappers instead.

## Colors And Dark Mode

- Map Figma colors to semantic tokens used by the app.
- Check both light and dark mode if the app supports themes.
- Do not introduce raw hex values unless the token does not exist and the user requested exact color sync.
- Preserve contrast for text, icons, dividers, disabled states, and pressed states.

## Typography

- Use the app's configured font family and font-weight utilities.
- Match Figma hierarchy through existing text scales when possible.
- Avoid text clipping: verify line height, number of lines, and dynamic content.

## Icons And Assets

- Prefer icon libraries already used by the app for standard symbols.
- Keep icon size, stroke width, and container size consistent with the component family.
- Add image/SVG assets only for non-standard artwork, and place them in the app's existing asset structure.

## Sheets, Modals, And Forms

- Preserve drag-to-dismiss, backdrop dismiss, safe-area padding, CTA placement, and validation behavior.
- Keep field order and domain-specific save/create/delete/duplicate logic local unless the requirement changes behavior.
- Do not share whole forms unless structures are genuinely identical.

## Loading, Empty, Error, Disabled

- Implement all states shown in Figma or already present in the app.
- Preserve skeleton geometry for the component family.
- Keep retry/error actions accessible and localized.
- For animated loading, avoid expensive layout animations in large lists.

## Accessibility

- Keep touch targets large enough for mobile.
- Add accessibility labels for icon-only actions.
- Ensure selected/disabled states are not color-only when a label or semantic role is available.
- Preserve screen-reader meaningful text for badges, tabs, and action buttons.

## Verification

Run the app's relevant checks, usually:

```bash
npm run typecheck
npm run lint
```

Run focused tests when view models, mappings, localization, or interactions change.

Manual QA should cover:

- light/dark mode
- small/large devices
- long text and Turkish localization
- row taps/swipes/gestures
- loading/empty/error states
- sheet open/dismiss and keyboard behavior
