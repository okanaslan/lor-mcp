# Organization QA Checklist

Run this checklist before reporting naming or hierarchy cleanup complete.

## Naming Checks

- Important frames, groups, and layers have semantic names.
- Generic names remain only where they are harmless raw internals, such as icon vectors.
- Names match nearby approved conventions when those conventions exist.
- State, direction, or product area names are included only when they add clarity.

## Grouping Checks

- Groups represent meaningful UI units.
- Single-child groups are removed unless they clarify role, protect an instance boundary, or preserve Auto Layout.
- Nesting depth is practical and not excessive.
- No wrapper frames were added only for visual symmetry.

## Preservation Checks

- Rendered visual design is unchanged.
- Product copy is unchanged.
- Token bindings and fills/strokes are unchanged.
- Component instances remain connected unless the user explicitly requested detaching.
- Auto Layout direction, resizing, padding, and gaps are preserved unless a layout fix was explicitly requested.

## Final Report

- Name the cleaned frame or component.
- Summarize the naming/grouping changes at a high level.
- Mention intentionally unchanged areas, such as locked instances or raw icon vectors.
- Call out any issues that should be routed to component-library maintenance or Auto Layout repair.
