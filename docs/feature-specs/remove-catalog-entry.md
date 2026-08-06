# Remove Catalog Entry

## 1. Summary

Implemented for v1 agents, skills, and subagent profiles, including explicitly
targeted shared global skills and global subagents.

Current public MCP tools are `remove_agent`, `remove_skill`, and
`remove_subagent`; the generic `remove_catalog_entry` tool name is no longer
registered.

## 2. Goals

- Allow users to delete catalog entries they no longer want routed.
- Keep removal scoped to the requested workspace.
- Allow global skill removal from any workspace context when global scope is
  explicitly targeted.
- Allow global subagent removal from any workspace context when global scope is
  explicitly targeted.
- Preserve simple behavior for missing entries.

## 3. Non-Goals

- Delete the underlying Codex agent session.
- Delete the underlying Codex skill from disk.
- Delete any Codex-native subagent task or chat.
- Remove entries from other workspaces.
- Clear the entire workspace catalog.
- Implement restore or archival behavior.

## 4. Functional Requirements

- The server must accept the typed entry identifier for the selected tool.
- The request must include the client workspace path, registered alias, or
  stable workspace slug.
- The server must remove only entries scoped to the requested workspace.
- The server must support removing global skills when global scope is explicitly
  targeted.
- The server must support removing introduced agents, introduced skills, and
  subagent profiles.
- The server must allow removing workspace-local subagents and explicitly
  targeted global subagents.
- The server must return a success result when an entry is removed.
- The server must return a not-found result when the entry does not exist in the
  active session.
- Removing a global skill must remove it from results in every workspace.
- Removing a global subagent must remove it from results in every workspace.
- Removed entries must no longer appear in list, detail, or matching results.
- Removing a catalog entry must not affect the underlying external Codex agent
  or skill.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user introduced an
agent or skill by mistake and wants to remove it from future recommendations.

## 6. Data Model

Conceptual `CatalogEntryRemoval` fields:

- `entryType`: identifies `agent`, `skill`, or `subagent`.
- `entryKey`: identifies the entry to remove.
- `scope`: optionally identifies `workspace` or `global` for skill and subagent
  removal.

## 7. Error Handling

- Missing entry type or identifier must return a validation error.
- Unknown entry type must return a validation error.
- Missing or invalid workspace must return a validation error.
- Missing entries must return a not-found result.
- Storage failures must return a storage error.

## 8. Security and Permissions

- Removal must only affect entries in the requested workspace.
- Removal may affect explicitly targeted global skills.
- Removal may affect explicitly targeted global subagents.
- Not-found responses must not reveal whether the same identifier exists in
  another workspace.
- Removing a global skill or global subagent is intentionally visible to all
  workspaces that used that entry.

## 9. Open Questions

- Should removed entries be soft-deleted for audit or undo?

## 10. Decision Log

- 2026-07-11: Removing a catalog entry does not delete the underlying Codex
  agent or skill.
- 2026-07-11: Restore behavior is out of scope.
- 2026-07-17: V1 remove is not idempotent; missing entries return `not_found`.
- 2026-08-04: Implement explicit global skill removal support.
- 2026-08-04: Implement explicit workspace/global subagent removal without a
  separate retirement lifecycle.
