# React Native Accessibility Checklist

Use this checklist for React Native code review and focused fixes.

## Names, Roles, And States

- Interactive `Pressable`, touchable, custom row, icon button, and gesture action controls have an accessible name.
- Controls use appropriate `accessibilityRole`: button, tab, switch, adjustable, imagebutton, header, link, search, text, etc. where appropriate.
- Controls expose `accessibilityState` for disabled, selected, checked, expanded, busy, and invalid when applicable.
- Hints explain non-obvious outcomes, not repeated labels.
- Decorative icons are hidden or not separately announced when the parent label covers them.

## Forms And Inputs

- Inputs have visible labels or clear accessibility labels.
- Placeholder text is not the only instruction for important fields.
- Validation errors are associated with fields where possible and visible text is understandable.
- Required, disabled, invalid, and busy states are represented.
- Keyboard type, return key behavior, submit, and dismissal remain usable.

## Navigation, Tabs, Modals, And Sheets

- Tabs and segmented controls expose selected state.
- Modal/sheet close buttons are labeled and reachable.
- Android back/onRequestClose works for modal dismissal.
- Hidden underlying content is not confusingly reachable when modal behavior makes that possible to control.
- Focus/traversal order follows visual and task order.
- Expanded/collapsed sections expose expanded state.

## Gestures And Custom Interactions

- Swipe actions have accessible names.
- Gesture-only actions have a reachable alternative when the action is important.
- Pull-to-create/refresh has visible and accessible fallback controls where practical.
- Drag-to-dismiss should not be the only way to close a critical sheet.

## Touch Targets And Text Scaling

- Small controls use adequate size or `hitSlop`.
- Dynamic type/larger text does not clip primary labels, buttons, form fields, or critical status.
- Important content remains scrollable when text grows.
- Avoid disabling font scaling unless there is a documented product/design reason.

## Status, Feedback, And Color

- Loading, saving, success, error, disabled, selected, failed, warning, and completed states are not communicated by color only.
- Important async status has visible text and, when needed, accessible announcement/live-region behavior.
- Error and destructive actions are named clearly.
- Contrast risk is flagged when token/color combinations appear low contrast; exact measurement may require tooling or design token values.

## Localization

- Accessibility labels and hints are localized with visible copy when the app supports localization.
- Do not hardcode English labels in localized flows.
- Keep labels concise so screen-reader output stays usable.
