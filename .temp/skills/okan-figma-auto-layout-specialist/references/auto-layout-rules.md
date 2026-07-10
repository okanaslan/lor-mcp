# Auto Layout Rules

Use these rules when choosing sizing and structure in Figma.

## Sizing Modes

- `Hug contents`: use when content determines size, especially vertical height.
- `Fill container`: use when the parent owns available space and the child should stretch to it.
- `Fixed`: use only when the object must stay a specific size for viewport, device, icon, or deliberately locked preview reasons.

## Common Patterns

- Vertical screen content: fixed phone frame, full-width content column, stacked sections set to Hug height.
- Cards: Fill width inside the column, Hug height, internal padding, and content-driven rows.
- Rows: Fill width, Hug height, horizontal Auto Layout, centered cross-axis alignment, text body allowed to Fill when trailing metadata or actions exist.
- Buttons and chips: Hug width and height unless they are intentionally full-width CTAs.
- Forms: field groups Hug height; fields Fill width inside the card; helper text Hug height.
- Sheets: fixed or Fill width to the viewport, Hug or deliberate height based on content, body column Fill width and Hug height unless scroll behavior is being demonstrated.
- Tab bars: fixed viewport position/height is acceptable when it is a stable navigation component.
- Documentation boards: cards and sections Hug height; board or frame can be taller than a real viewport for review clarity.

## Avoid

- Fixed card heights when text or rows determine height.
- Fixed row heights that clip longer labels, metadata, or translated strings.
- Fill children inside non-Auto Layout parents.
- Nested Auto Layout stacks where every child is Fixed by accident.
- Hidden clipping that masks missing content during review.
- Using visual redesign to solve a sizing issue when Auto Layout repair is enough.
