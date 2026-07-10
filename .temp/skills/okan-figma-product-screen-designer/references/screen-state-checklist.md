# Screen State Checklist

Use this checklist when planning or reviewing in-app product screen work.

## Common States

- Default: normal populated screen.
- Empty: first-use or no-data state with a clear primary path.
- Loading: skeleton or placeholder state without real content claims.
- Error: recoverable failure state with clear next action.
- Success: completion or confirmation state when useful.
- Validation: field-level or form-level invalid input state.
- Submitting: disabled or busy state for save/create flows.
- Locked: gated or Pro-only state with clear upgrade path.
- Unauthenticated or guest: signed-out access and conversion path.
- Detail, edit, and create: existing entity review, update, and creation variants.
- Interaction examples: swipe, pull-to-create, expanded/collapsed, selected, or action-revealed states.

## State Selection Rules

- Include only states needed for the requested flow or feature.
- Keep state names explicit: `Area / Screen / State`.
- Do not invent backend behavior, billing behavior, or lifecycle actions unless the request establishes them.
- Preserve existing approved frames unless an in-place update is explicitly requested.
