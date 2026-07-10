# NativeWind Setup Audit

Use this reference when NativeWind styles are missing, setup changed, the app upgraded Expo/RN/NativeWind, or the task is a release-readiness style audit.

## Files To Inspect

- `package.json`: confirm `nativewind`, `tailwindcss`, Expo, React Native, Babel, and Metro-related versions.
- `tailwind.config.*`: confirm `presets: [require("nativewind/preset")]`, content globs, theme extension, and plugins.
- CSS input file: confirm Tailwind layers/imports and any CSS variable declarations used by theme tokens.
- `metro.config.*`: confirm `withNativeWind(config, { input: "./global.css" })` or the project-specific CSS input path.
- `babel.config.*`: confirm the setup required by the installed NativeWind version, commonly Expo `jsxImportSource: "nativewind"` plus `nativewind/babel` for v4-era projects.
- TypeScript env file: confirm generated/nativewind env typings are present or intentionally disabled.
- App entrypoint: confirm the global CSS file is imported where the installed NativeWind version expects it.

## Setup Checks

- NativeWind and Tailwind major versions are compatible.
- Tailwind content globs include all app, src, component, and feature directories that contain `className` strings.
- Metro CSS input path matches the actual CSS file.
- Babel and Metro configs do not conflict with other required plugins such as Reanimated.
- Semantic tokens in Tailwind config point to real CSS variables or static theme values.
- NativeWind generated types are not stale or ignored if TypeScript checking depends on them.

## Common Failures

- Classes work in one folder but not another: content globs omit that folder.
- No classes work after setup: missing `withNativeWind`, wrong CSS input path, missing CSS import, or Babel setup mismatch.
- Custom colors do not work: token name mismatch, missing CSS variable, or Tailwind config not loaded.
- Classes on third-party components do nothing: component does not map `className` to the native `style` prop; use `cssInterop` or `remapProps`.
- Dark mode does not react: app color-scheme setup, userInterfaceStyle, or NativeWind dark-mode strategy is inconsistent with installed version.

## Verification

- Run typecheck and lint after config or type changes.
- Restart Metro with cache reset after Tailwind, Babel, Metro, or CSS input changes.
- Rebuild a dev client when native or plugin changes require native code regeneration.
- Verify at least one styled native component and one styled project primitive in-app.
