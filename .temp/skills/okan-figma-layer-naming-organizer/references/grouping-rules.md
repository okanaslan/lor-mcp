# Grouping Rules

Use grouping to clarify meaning, not to decorate the layer tree.

## When To Group

- Group repeated UI units, such as rows, cards, chips, controls, or metric blocks.
- Group related text when it reads as one content unit, such as title plus subtitle or label plus helper text.
- Group icon and label pairs when they behave as one affordance.
- Group action clusters, trailing metadata, badges, or status indicators when they are scanned together.
- Group sections inside documentation or review frames when the section has a clear title and body.

## When Not To Group

- Do not group a single child unless it has a clear semantic role or preserves Auto Layout behavior.
- Do not add wrapper frames only to create visual symmetry in the layer tree.
- Do not create deep nesting for simple cards or rows.
- Do not group raw icon vectors unless the icon needs one named parent like `Status Icon`.
- Do not flatten component instances or detach masters just to rename internals.

## Practical Depth

- Level 1: screen or component root.
- Level 2: major regions, such as `Header`, `Content`, `Footer`, `Card`, or `Sheet Body`.
- Level 3: repeated or complex units, such as `Text Stack`, `Metadata Row`, `Action Group`, or `Icon Container`.
- Avoid level 4+ unless the UI is genuinely complex and repeated.

## Pattern Guidance

- Cards: root card, optional `Card Header`, `Card Body`, `Card Footer`, `Actions`, or `Metadata Row`.
- Rows: root row, `Leading Icon`, `Text Stack`, `Value`, `Trailing Icon`, or `Action`.
- Buttons: root button, optional `Icon`, `Label`; avoid extra wrappers.
- Inputs: root field, `Label`, `Input Surface`, `Value`, `Helper Text`, `Trailing Icon`.
- Sheets: root sheet, `Sheet Header`, `Sheet Body`, `Actions`; avoid wrappers around every field.
- Navigation: root nav, individual tab items, active indicator only if independently meaningful.
- Documentation boards: section cards and preview groups should be named by purpose, not by position.
