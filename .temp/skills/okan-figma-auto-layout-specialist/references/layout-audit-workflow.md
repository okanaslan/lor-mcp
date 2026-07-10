# Layout Audit Workflow

Use this workflow for Figma layout audits and repairs.

## 1. Inspect

- Identify the target frame, component, or selected node.
- Inspect parent frame dimensions, Auto Layout direction, padding, gap, alignment, and clipping.
- Inspect child resizing modes, text auto-resize, fixed dimensions, constraints, and instance boundaries.
- Compare against nearby approved examples before deciding a fix.

## 2. Diagnose

- Find whether the issue is caused by the parent, child, text resizing, clipping, wrong Fill usage, or unnecessary fixed height.
- Separate layout defects from intentional locked preview dimensions.
- Preserve component instances where possible; avoid detaching just to edit layout unless the user explicitly asks.

## 3. Repair

- Fix from outside in: viewport or board, content column, section, card, row, text/icon group.
- Set content-driven vertical stacks to Hug height.
- Set full-width children to Fill only inside an Auto Layout parent that should control width.
- Remove arbitrary fixed heights from rows/cards when content and padding should determine height.
- Keep viewport frames, device previews, fixed icons, and intentionally locked examples fixed.

## 4. Recheck

- Confirm content is visible and no text is clipped.
- Confirm frames do not collapse after resizing.
- Confirm repaired frames still look visually equivalent unless a visual change was requested.
- Confirm any intentionally fixed sizes are explainable.
