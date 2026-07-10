# Foundation Checklist

Use this checklist when auditing or updating app design foundations.

## Coverage

- Color tokens: brand, shell, text, support, feedback, semantic surfaces, urgency surfaces, loading, borders.
- Typography: primary font family, title, section label, body, metadata, button, chip, and helper styles.
- Spacing: page margins, content columns, card padding, row gaps, section gaps, form spacing.
- Radius: screen shells, cards, sheets, buttons, chips, inputs, badges, icons.
- Elevation and surfaces: page background, primary panels, raised surfaces, inset controls, overlays.
- Interaction rules: primary/secondary/destructive actions, visible controls, gestures, disabled/loading states.
- Layout rules: fixed viewport frames, Hug contents, Fill container, scroll documentation frame height.
- Naming: explicit page/frame/layer names and selected-direction labels.

## Audit Output

A useful audit should identify:

- What is already consistent.
- What is inconsistent or duplicated.
- Which token or documentation changes are safe.
- Which changes require user approval before migration.
- Any layout hygiene issues such as clipped text, collapsed frames, or unexpected fixed sizing.
