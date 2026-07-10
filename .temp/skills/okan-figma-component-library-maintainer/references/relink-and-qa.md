# Relink And QA Workflow

Use this before moving component masters, replacing duplicates, or validating component cleanup.

## Safe Relinking

- Prefer moving the existing canonical master to `Components`; this preserves current instances.
- Replace duplicated local frames only when the global component match is visually and structurally unambiguous.
- Avoid deep replacement inside complex sheets, long flows, or one-off compositions unless explicitly requested.
- Keep product copy, layout, sizing, and visual treatment unchanged during cleanup.
- Archive or remove old local masters only after replacement is verified.

## Validation

Check after cleanup:

- Component masters live on the expected page and have clear names.
- Instances remain connected and do not unexpectedly detach.
- Variant properties are readable and selectable.
- Text is not clipped and fonts are not missing.
- Auto Layout is stable: rows/cards/chips hug content, full-width children fill only when intended.
- Product screens using updated components still render visually equivalent.
- Any skipped risky replacements are listed with the reason.

## Completion Notes

Report:

- Components promoted or renamed.
- Variant contracts normalized.
- Pages or frames with obvious usage relinked.
- Items intentionally left local or skipped.
- QA checks performed and any residual risks.
