# List Catalog Entries

## 1. Summary

Draft. This feature lets a user list introduced agents and skills available in
the active initialized MCP session.

## 2. Goals

- Show what agents and skills have been introduced in the current session.
- Support simple filtering by entry type and project.
- Provide a compact view suitable for catalog inspection.

## 3. Non-Goals

- Find the best entry for a task.
- Return full detail for every entry.
- List entries from other initialized MCP sessions.
- Modify or remove catalog entries.

## 4. Functional Requirements

- The server must list catalog entries scoped to the active initialized MCP
  session.
- The list must include both introduced agents and introduced skills by default.
- The caller may filter by entry type.
- The caller may filter by project name.
- Each list item must include the entry type, identifier, display name, project
  name, primary specialty, and specialty tags.
- The server must return an empty list when no entries exist in the active
  session.
- The server must not include entries from another initialized MCP session.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user wants to see
which agents and skills are currently available before asking for routing.

## 6. Data Model

Conceptual `CatalogListItem` fields:

- `entryType`: identifies `agent` or `skill`.
- `entryKey`: identifies the catalog entry within the session.
- `displayName`: provides the human-readable catalog name.
- `projectName`: names the focused project.
- `primarySpecialty`: names the primary capability.
- `specialtyTags`: lists additional routing tags.

## 7. Error Handling

- Missing or invalid initialized MCP session context must return a session
  error.
- Invalid filters must return a validation error.
- Storage failures must return a storage error.

## 8. Security and Permissions

- Listing must only return entries from the active initialized MCP session.
- Empty responses must not reveal whether other sessions have entries.

## 9. Open Questions

- Should list results be paginated?
- Should list results include created or updated timestamps?
- Should filters support specialty tags in the first implementation?

## 10. Decision Log

- 2026-07-11: List both agents and skills by default.
- 2026-07-11: Keep full entry detail in a separate feature spec.
