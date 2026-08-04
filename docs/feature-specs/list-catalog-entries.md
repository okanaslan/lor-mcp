# List Catalog Entries

## 1. Summary

Implemented for v1 agents, skills, and subagent prompt profiles, including
shared global skills and global subagents by default.

## 2. Goals

- Show what agents, skills, and subagent profiles have been introduced in the
  workspace catalog.
- Show shared global skills alongside workspace-local entries by default.
- Show workspace-local and global subagents alongside agents and skills.
- Support simple filtering by entry type and project.
- Provide a compact view suitable for catalog inspection.

## 3. Non-Goals

- Find the best entry for a task.
- Return full detail for every entry.
- List workspace-local entries from other workspaces.
- Modify or remove catalog entries.

## 4. Functional Requirements

- The request must include the client workspace path, registered alias, or
  stable workspace slug.
- The server must list catalog entries scoped to the requested workspace.
- The server must include global skills by default.
- The list must include both introduced agents and introduced skills by default.
- The list must include workspace-local and global subagents by default.
- The caller may filter by entry type.
- The caller may filter by project name.
- Each list item must include the entry type, identifier, display name, project
  name, primary specialty, and specialty tags.
- The server must return an empty list when no entries exist in the requested
  workspace.
- The server must not include entries from another workspace.
- The server may include global skills because they are intentionally shared.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user wants to see
which agents and skills are currently available before asking for routing.

## 6. Data Model

Conceptual `CatalogListItem` fields:

- `entryType`: identifies `agent`, `skill`, or `subagent`.
- `entryKey`: identifies the catalog entry within the workspace.
- `scope`: identifies `workspace` or `global` for skill and subagent entries.
- `displayName`: provides the human-readable catalog name.
- `projectName`: names the focused project.
- `primarySpecialty`: names the primary capability.
- `specialtyTags`: lists additional routing tags.

## 7. Error Handling

- Missing or invalid MCP readiness context must return a session error.
- Invalid filters must return a validation error.
- Storage failures must return a storage error.

## 8. Security and Permissions

- Listing must only return entries from the requested workspace.
- Listing may also return global skills.
- Empty responses must not reveal whether other workspaces have entries.

## 9. Open Questions

- Should list results be paginated?
- Should list results include created or updated timestamps?
- Should filters support specialty tags in the first implementation?

## 10. Decision Log

- 2026-07-11: List both agents and skills by default.
- 2026-07-11: Keep full entry detail in a separate feature spec.
- 2026-07-13: Implement list lookup against the client-supplied workspace.
- 2026-08-04: Implement list results to include global skills by default.
- 2026-08-04: Implement list results to include workspace-local and global
  subagents by default.
