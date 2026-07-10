# Mobile Token Sync

## Token Intake

Collect from Figma or user-provided values:

- canonical token names.
- light and dark values.
- intended semantic use.
- deprecated or renamed tokens.
- required aliases for existing code compatibility.

## Mobile Inspection

Inspect likely files:

- theme token module.
- theme provider/runtime variable mapping.
- NativeWind/Tailwind config.
- token tests.
- direct `tokens.colors.*` usage.
- raw hex color usage.
- semantic component helper mappings.

## Sync Rules

- Figma canonical semantic names should be primary in new code.
- Keep old aliases when removing them would require broad risky churn.
- Alias values must point to canonical values, not duplicate independent literals.
- NativeWind class names should expose canonical kebab-case variables.
- Legacy class names may remain mapped to aliases for compatibility.
- Avoid raw hex literals in components unless no token exists and the value is explicitly one-off.

## Theme Modes

For light/dark themes:

- Update both modes together.
- Verify opposite/inverse text tokens remain readable on filled controls.
- Verify surface hierarchy: shell, panel, raised panel, text opposite, lines.
- Verify feedback and urgency surfaces in both modes.
- Update tests for exact token values and alias equivalence.

## Migration Order

1. Update canonical token definitions.
2. Update aliases.
3. Update NativeWind/Tailwind mappings.
4. Update runtime theme variables.
5. Update direct JS token usage where runtime color matters.
6. Update shared component classes/helpers.
7. Update tests.
8. Run typecheck, lint, focused token tests.

## Validation

Run available checks, typically:

```bash
npm run test -- src/lib/theme --runInBand
npm run typecheck
npm run lint
```

Adjust paths to the project structure.
