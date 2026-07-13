# Catalog Export

## 1. Summary

Draft. This feature lets a user export catalog entries from the active
initialized MCP session into a portable representation.

## 2. Goals

- Let users back up or reuse catalog entries.
- Export introduced agents and skills from the active session.
- Provide a format that can later be used by Catalog Import.

## 3. Non-Goals

- Export entries from other initialized MCP sessions.
- Export secrets, credentials, or private runtime state.
- Define remote sync behavior.
- Import catalog entries.

## 4. Functional Requirements

- The server must export catalog entries scoped to the active initialized MCP
  session.
- The export must include introduced agents and introduced skills by default.
- The caller may filter export by entry type or project name.
- The export must include stored catalog metadata needed to recreate entries.
- The export must not include session-private runtime identifiers unless needed
  for import.
- The server must return an empty export when no entries exist in the active
  session.
- The server must not export entries from another initialized MCP session.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user wants to save
the current session catalog and reload it later.

## 6. Data Model

Conceptual `CatalogExport` fields:

- `version`: identifies the export format version.
- `exportedAt`: records when the export was generated.
- `entries`: lists exported agents and skills.
- `filters`: records filters used to produce the export.

## 7. Error Handling

- Invalid filters must return a validation error.
- Missing or invalid initialized MCP session context must return a session
  error.
- Storage failures must return a storage error.
- Export serialization failures must return an export error.

## 8. Security and Permissions

- Export must only include entries from the active workspace catalog namespace.
- Export must not include secrets, credentials, or sensitive host metadata.
- Export output must avoid leaking entries from other sessions through counts or
  errors.

## 9. Open Questions

- What export format should be supported first?
- Should exported entries include verification status?
- Should exported files include enough metadata to preserve original session
  context?

## 10. Decision Log

- 2026-07-11: Treat export as session-scoped catalog backup.
- 2026-07-11: Keep remote sync behavior out of scope.
