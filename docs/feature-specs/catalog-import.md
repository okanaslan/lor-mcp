# Catalog Import

## 1. Summary

Implemented for v1. This feature lets a user bulk-load catalog entries into the
requested workspace from a versioned structured JSON export.

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

- The server must accept a versioned catalog export object as the import source.
- The server must parse import data into agent and skill catalog entries.
- Imported entries must follow the same required metadata rules as manual
  introduction.
- Imported entries must be scoped to the requested workspace, regardless of the
  source export workspace.
- Duplicate entries within the requested workspace must be skipped by default or
  reported as failures when `conflictStrategy` is `fail`.
- The server must return a summary of imported, skipped, and failed entries.
- The server must not import entries into another workspace.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user has a local
set of known skills or agents and wants to load them into Local Orchestration
Router (LOR) without introducing each one manually.

## 6. Data Model

Conceptual `CatalogImportResult` fields:

- `version`: identifies the import format version.
- `conflictStrategy`: records duplicate handling behavior.
- `importedCount`: counts accepted entries.
- `skippedCount`: counts duplicate or intentionally skipped entries.
- `failedCount`: counts invalid entries.
- `errors`: lists entry-level validation failures.

## 7. Error Handling

- Missing import data must return a validation error.
- Unsupported import format version must return a validation error.
- Invalid entries must be reported without accepting partial invalid data for
  those entries.
- Missing or invalid initialized MCP session context must return a session
  error.
- Storage failures must return a storage error.

## 8. Security and Permissions

- Import sources must be restricted to approved local or configured locations.
- Imported entries must be scoped only to the requested workspace.
- Import errors must not expose sensitive filesystem paths or unrelated session
  data.

## 9. Open Questions

- Should imports verify skill and agent existence during import?
- Should a later version support overwrite conflict behavior?

## 10. Decision Log

- 2026-07-11: Treat import as session-scoped bulk introduction.
- 2026-07-11: Keep remote registry behavior out of scope.
- 2026-07-17: V1 imports the `export_catalog` JSON object through
  `import_catalog`; duplicate existing entries are skipped by default or
  reported when `conflictStrategy` is `fail`.
