# Class Composition Rules

Use this reference when reviewing component `className` usage, cleaning up variants, or fixing classes that are not generated.

## Static Detection

NativeWind relies on Tailwind compilation. Keep full utility names visible in source.

Preferred:

```ts
const toneClasses = {
  success: "bg-success-surface text-success border-success",
  warning: "bg-warning-surface text-warning border-warning",
  danger: "bg-danger-surface text-danger border-danger",
};
```

Avoid:

```ts
const className = `bg-${tone}-surface text-${tone}`;
```

## Variant Maps

Use explicit maps for:

- tone: success, warning, danger, info, neutral.
- size: compact, default, large.
- status: active, paused, failed, skipped, completed.
- state: selected, disabled, pressed, loading, expanded.
- platform: ios, android, web only when behavior truly differs.

Keep maps close to the component unless shared reuse already exists.

## Utility Hygiene

- Prefer project semantic tokens over raw palette utilities.
- Avoid repeated long class strings across many call sites; extract a small purpose-named component or local constant.
- Avoid conflicting utilities in one string unless the override is intentional and variant-scoped.
- Keep layout classes separate enough to scan: shell, spacing, text, state, and token classes.
- Use arbitrary values sparingly for exact Figma geometry or one-off constraints.
- Do not move runtime-only values into fake Tailwind classes; use `style` for truly dynamic numeric values.

## React Native Caveats

- Not every web Tailwind utility has the same native effect.
- Text styling must usually be applied to `Text`, not only parent `View`.
- Shadows, filters, pseudo classes, group state, media queries, and container queries require version/platform support checks before relying on them.
- Gesture or animation state should not be encoded in brittle class-string construction.

## Review Output

When reviewing class usage, report:

- dynamic class risks.
- token/raw value mismatches.
- duplicated utility strings.
- unsupported or suspicious web-only utilities.
- safer explicit map or primitive extraction path.
