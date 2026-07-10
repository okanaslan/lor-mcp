# Translation Quality Checklist

Use this reference for reviewing mobile translation changes.

## Parity

- Every key added to the default locale exists in every supported locale.
- Nested object shape matches across locale files.
- Interpolation variables use the same names in every locale.
- No translation value is accidentally left as a placeholder unless intentionally marked.

## English And Turkish Notes

For EN/TR apps:

- Turkish UI copy should be natural and concise, not literal word-by-word English.
- Watch for longer Turkish labels in buttons, tabs, cards, and bottom sheets.
- Avoid inconsistent formality; keep tone aligned with existing Turkish copy.
- Preserve product names and technical terms when the app already uses them consistently.

## Runtime Formatting

- Use locale-aware formatting for dates, times, durations, counts, percentages, currency, and decimals when user-visible.
- Do not assemble translated sentences from fragments when grammar differs by locale.
- Use plural/count patterns when the app's i18n library supports them; otherwise choose concise count labels that work safely.

## Accessibility And UI States

Localize:

- Accessibility labels and hints.
- Empty, loading, error, offline, disabled, and success states.
- Toasts, alerts, confirmation dialogs, and validation messages.
- Input labels, placeholders, picker labels, section headers, and navigation titles.

Check:

- Long text wraps without hiding important actions.
- Sheets and modals remain scrollable.
- Buttons still meet touch target requirements.
- Tab labels and compact cards do not truncate critical meaning.

## Non-Translatable Content

Do not translate unless explicitly requested:

- User-created names, notes, descriptions, messages, and comments.
- Backend-generated report or AI content shown as content.
- API enum values, IDs, product IDs, route names, file paths, URLs, email addresses, and code-like constants.
- Legal, privacy, subscription, or regulated copy without user-approved source text.
