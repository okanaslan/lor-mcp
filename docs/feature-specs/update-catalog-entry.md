# Update Catalog Entry

## 1. Summary

Implemented for v1, including explicitly targeted shared global skills. This
feature lets a user update editable metadata for an introduced agent or skill in
the requested workspace, or for a shared global skill.

Current public MCP tools are `update_agent`, `update_skill`, and
`update_subagent`; the generic `update_catalog_entry` tool name is no longer
registered.

## 2. Goals

- Allow correction of catalog metadata after introduction.
- Preserve stable entry identity while editing display and routing fields.
- Keep updates isolated to the requested workspace.
- Allow global skills to be managed from any workspace context.

## 3. Non-Goals

- Change the underlying Codex session ID for an agent.
- Change the underlying skill name for a skill.
- Move entries between initialized MCP sessions.
- Move workspace entries into global scope; promotion is handled by Global Skill
  Scope.
- Verify external agent or skill existence.

## 4. Functional Requirements

- The server must accept the typed entry identifier for the selected tool.
- The server must update only entries scoped to the requested workspace or
  explicitly selected global scope.
- The server must support updates for explicitly targeted global skills.
- The server must allow updating project name, display name, primary specialty,
  and specialty tags.
- The server must not allow changing the stable entry reference.
- The server must reject updates that remove required metadata.
- The server must update the entry timestamp when a change is accepted.
- The server must return the updated entry metadata.
- The server must return a not-found result when the target entry does not exist
  in the active session.
- Updating a global skill must use the same editable metadata and `skillContext`
  rules as updating a workspace skill.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user introduces an
agent or skill and later corrects its project, display name, or specialty tags.

## 6. Data Model

Conceptual `CatalogEntryUpdate` fields:

- `entryType`: identifies `agent` or `skill`.
- `entryKey`: identifies the entry to update.
- `scope`: optionally identifies `workspace` or `global` for skill updates.
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
- Updates may affect explicitly targeted global skills.
- Not-found responses must not reveal whether the same identifier exists in
  another session.
- Updating a global skill is intentionally visible to all workspaces that use
  that skill.

## 9. Open Questions

- Should update history be retained?

## 10. Decision Log

- 2026-07-11: Stable entry references are not editable.
- 2026-07-11: Editable fields are limited to display and routing metadata.
- 2026-07-17: V1 supports partial field patching and rejects empty update
  patches.
- 2026-08-04: Implement update support for explicitly targeted global skills.
