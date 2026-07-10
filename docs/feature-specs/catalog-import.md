# Catalog Import

## 1. Summary

Draft. This feature lets a user bulk-load catalog entries into the active
initialized MCP session from an approved import source.

## 2. Goals

- Reduce repeated manual introduction of agents and skills.
- Import multiple catalog entries in one operation.
- Validate imported entries before storing them.

## 3. Non-Goals

- Install missing agents or skills.
- Import entries into other initialized MCP sessions.
- Define a public marketplace or remote registry.
- Export catalog entries.

## 4. Functional Requirements

- The server must accept an approved import source.
- The server must parse import data into agent and skill catalog entries.
- Imported entries must follow the same required metadata rules as manual
  introduction.
- Imported entries must be scoped to the active initialized MCP session.
- Duplicate entries within the active session must be rejected or reported.
- The server must return a summary of imported, skipped, and failed entries.
- The server must not import entries into another initialized MCP session.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user has a local
set of known skills or agents and wants to load them into Agentic Router without
introducing each one manually.

## 6. Data Model

Conceptual `CatalogImportResult` fields:

- `source`: identifies the import source.
- `importedCount`: counts accepted entries.
- `skippedCount`: counts duplicate or intentionally skipped entries.
- `failedCount`: counts invalid entries.
- `errors`: lists entry-level validation failures.

## 7. Error Handling

- Missing import source must return a validation error.
- Unsupported import source must return a validation error.
- Invalid entries must be reported without accepting partial invalid data for
  those entries.
- Missing or invalid initialized MCP session context must return a session
  error.
- Storage failures must return a storage error.

## 8. Security and Permissions

- Import sources must be restricted to approved local or configured locations.
- Imported entries must be scoped only to the active initialized MCP session.
- Import errors must not expose sensitive filesystem paths or unrelated session
  data.

## 9. Open Questions

- What import formats should be supported first?
- Should imports be all-or-nothing or partial success?
- Should imports verify skill and agent existence during import?

## 10. Decision Log

- 2026-07-11: Treat import as session-scoped bulk introduction.
- 2026-07-11: Keep remote registry behavior out of scope.
