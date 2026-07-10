# Component Sync Checklist

Use this for reusable component color/spacing/state syncs. Do not use it for one-off screen implementation.

## Audit Questions

- Is the mismatch in a shared primitive, feature wrapper, or single screen?
- Does Figma show a reusable component state or just one instance?
- Does the app already have a semantic token for the color/surface/state?
- Does changing the primitive affect multiple screens safely?
- Are feature-specific meanings such as task urgency, habit success, or limit danger preserved?

## Common Components

### Navigation And Headers

Check tab bar, top cards, segmented controls, active/inactive icons, settings/add actions, safe-area spacing, and overlay backgrounds.

### Buttons And Inputs

Check primary, secondary, destructive, disabled, pressed, social, text input, notes input, selected/unselected chips, borders, placeholder text, and inverse text.

### Bottom Sheets

Check sheet shell, handle, header, icon actions, section cards, field gaps, CTA surfaces, safe-area padding, keyboard behavior, and dark mode.

### List Cards

Check shell background, border, radius, height, content padding, title/description typography, leading badge, divider/status bar, rail layout, skeleton, and swipe container clipping.

### Tracker Charts

Check chart card surfaces, title/settings colors, row labels, dot/bar states, loading skeletons, empty/error cards, retry actions, and fixed header overlays.

### Settings And Toasts

Check settings group surfaces, row dividers, titles, values, chevrons, toggles, toast shell, action pills, and error/success/warning/info surfaces.

## Implementation Rules

- Prefer updating the primitive when the same mismatch appears across multiple components.
- Prefer updating explicit feature wrappers when semantics differ by feature.
- Avoid adding many knobs to a shared component; split purpose-named wrappers instead.
- Keep behavior stable unless the user explicitly asks for behavior changes.
- Update accessibility labels only when visible action semantics change.

## Manual QA

Spot-check after component sync:

- light and dark mode.
- long text and localization expansion.
- loading, empty, error, disabled, pressed states.
- small and large device widths.
- affected tabs/screens that share the primitive.
