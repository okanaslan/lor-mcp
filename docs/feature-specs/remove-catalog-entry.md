# Remove Catalog Entry

## 1. Summary

Implemented for v1. This feature lets a user remove an introduced agent or skill
from the requested workspace.

## 2. Goals

- Allow users to delete catalog entries they no longer want routed.
- Keep removal scoped to the requested workspace.
- Preserve simple behavior for missing entries.

## 3. Non-Goals

- Delete the underlying Codex agent session.
- Delete the underlying Codex skill from disk or global skill storage.
- Remove entries from other workspaces.
- Clear the entire workspace catalog.
- Implement restore or archival behavior.

## 4. Functional Requirements

- The server must accept an entry type and entry identifier.
- The request must include the client workspace path, registered alias, or
  stable workspace slug.
- The server must remove only entries scoped to the requested workspace.
- The server must support removing introduced agents and introduced skills.
- The server must return a success result when an entry is removed.
- The server must return a not-found result when the entry does not exist in the
  active session.
- Removed entries must no longer appear in list, detail, or matching results.
- Removing a catalog entry must not affect the underlying external Codex agent
  or skill.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user introduced an
agent or skill by mistake and wants to remove it from future recommendations.

## 6. Data Model

Conceptual `CatalogEntryRemoval` fields:

- `entryType`: identifies `agent` or `skill`.
- `entryKey`: identifies the entry to remove.

## 7. Error Handling

- Missing entry type or identifier must return a validation error.
- Unknown entry type must return a validation error.
- Missing or invalid workspace must return a validation error.
- Missing entries must return a not-found result.
- Storage failures must return a storage error.

## 8. Security and Permissions

- Removal must only affect entries in the requested workspace.
- Not-found responses must not reveal whether the same identifier exists in
  another workspace.

## 9. Open Questions

- Should removed entries be soft-deleted for audit or undo?

## 10. Decision Log

- 2026-07-11: Removing a catalog entry does not delete the underlying Codex
  agent or skill.
- 2026-07-11: Restore behavior is out of scope.
- 2026-07-17: V1 remove is not idempotent; missing entries return `not_found`.
