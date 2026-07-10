# Notification Routing And Preferences

Use this reference when implementing tap handling or preferences UI.

## Payload Routing

- Define a narrow local union/type for supported notification payloads.
- Parse defensively from `unknown`; ignore missing, malformed, or unsupported payloads.
- Route through the app's existing navigation abstraction, not direct screen imports from feature helpers.
- Handle both cold-start last notification response and future response listener events.
- Deduplicate responses by notification/request identifier when possible.
- Preserve payload IDs in route params when future detail focusing may use them.
- Unknown payload types should no-op without throwing.

## Navigation Targets

- Prefer existing tab/stack route names and typed params.
- If the destination screen does not exist yet, route to the nearest useful parent or explicitly no-op, based on product decision.
- If navigation is not ready, queue the action and flush when the root navigator is ready.

## Preferences

- Inspect backend preference shape before creating local models.
- Use query keys scoped to notification preferences.
- Treat backend defaults as enabled only if that is the API contract.
- Patch partial updates when the API supports partial preference changes.
- Disable only the row/field currently saving when possible.
- Keep load/save errors visible without blocking unrelated settings.
- Do not request OS permission from preference toggles unless product explicitly wants that coupling.

## Tests

Add focused non-API tests for:

- Payload-to-navigation mapping.
- Unknown payload no-op behavior.
- Cold-start/listener dedupe helpers if extracted.
- Preference patch payload creation.
- Missing preference fallback values.
