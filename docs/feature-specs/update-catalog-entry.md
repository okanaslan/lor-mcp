# Update Catalog Entry

## 1. Summary

Draft. This feature lets a user update editable metadata for an introduced
agent or skill in the requested workspace.

## 2. Goals

- Allow correction of catalog metadata after introduction.
- Preserve stable entry identity while editing display and routing fields.
- Keep updates isolated to the requested workspace.

## 3. Non-Goals

- Change the underlying Codex session ID for an agent.
- Change the underlying skill name for a skill.
- Move entries between initialized MCP sessions.
- Verify external agent or skill existence.

## 4. Functional Requirements

- The server must accept an entry type and entry identifier.
- The server must update only entries scoped to the active initialized MCP
  session.
- The server must allow updating project name, display name, primary specialty,
  and specialty tags.
- The server must not allow changing the stable entry reference.
- The server must reject updates that remove required metadata.
- The server must update the entry timestamp when a change is accepted.
- The server must return the updated entry metadata.
- The server must return a not-found result when the target entry does not
  exist in the active session.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user introduces an
agent or skill and later corrects its project, display name, or specialty tags.

## 6. Data Model

Conceptual `CatalogEntryUpdate` fields:

- `entryType`: identifies `agent` or `skill`.
- `entryKey`: identifies the entry to update.
- `projectName`: optional replacement project name.
- `displayName`: optional replacement display name.
- `primarySpecialty`: optional replacement primary specialty.
- `specialtyTags`: optional replacement specialty tags.

## 7. Error Handling

- Missing entry type or identifier must return a validation error.
- Unknown entry type must return a validation error.
- Empty updates must return a validation error.
- Updates that remove required fields must return a validation error.
- Missing or invalid initialized MCP session context must return a session
  error.
- Missing entries must return a not-found result.
- Storage failures must return a storage error.

## 8. Security and Permissions

- Updates must only affect entries in the requested workspace.
- Not-found responses must not reveal whether the same identifier exists in
  another session.

## 9. Open Questions

- Should updates support partial field patching or require complete replacement
  of editable metadata?
- Should update history be retained?

## 10. Decision Log

- 2026-07-11: Stable entry references are not editable.
- 2026-07-11: Editable fields are limited to display and routing metadata.
