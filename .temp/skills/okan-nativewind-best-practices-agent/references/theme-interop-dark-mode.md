# Theme, Interop, And Dark Mode

Use this reference for NativeWind theme tokens, CSS variables, dark mode, and third-party component interop.

## Theme Tokens

- Prefer semantic tokens already present in the app: surface, panel, text, muted, line, success, warning, danger, info, and brand tokens.
- Use raw colors only when no semantic token exists and the value is genuinely one-off.
- If adding a token, add it at the stable design-system layer and keep naming consistent with existing tokens.
- Keep direct JavaScript token usage and Tailwind token usage aligned when both exist.

## CSS Variables

NativeWind supports CSS variables and helpers such as `vars`. Use them when values must change at runtime or come from a theme provider.

Use static Tailwind tokens when:

- the value is stable at build time.
- the app already exposes a semantic utility.
- runtime theme switching is not needed for that value.

Use variables when:

- a theme provider sets values dynamically.
- light/dark or user-selected themes are resolved through CSS variables.
- a third-party component needs a runtime value not expressible as a static utility.

## Dark Mode

- Verify the NativeWind major version and documented dark-mode strategy before changing behavior.
- Keep surface/text/border pairs readable in both light and dark modes.
- Prefer semantic tokens that already encode light/dark values over scattered `dark:` overrides.
- If using `dark:` variants, include both the base and dark value intentionally.
- Check app-level color-scheme settings, theme provider behavior, and navigation theme integration.

## Third-Party Component Interop

Use `cssInterop` when a component needs `className` mapped to a native style prop.

Use `remapProps` when a component has multiple style-like props, such as container, label, pressed, selected, or indicator styles.

Before adding interop:

- Inspect the component API and confirm which prop accepts React Native styles.
- Prefer a feature-local wrapper when only one feature needs the mapping.
- Prefer a shared primitive when the same third-party component is used widely.
- Verify the styled prop reaches the underlying native element.

## Platform Caveats

- Validate iOS and Android when changing shadows, text rendering, safe-area-adjacent surfaces, or dark mode.
- Do not assume web-only Tailwind behavior is supported on native.
- If behavior depends on current NativeWind docs, cite that the implementation was based on the installed version's docs.
