# Clear Workspace Catalog

## 1. Summary

Implemented for v1. This feature lets a caller clear introduced catalog entries
from one requested workspace.

## 2. Goals

- Let users reset a workspace catalog without deleting Codex agents or skill
  files.
- Keep clearing strictly scoped to the client-supplied workspace.
- Require explicit confirmation before deleting catalog records.
- Support clearing all entries, only agents, or only skills.

## 3. Non-Goals

- Delete underlying Codex agent sessions.
- Delete underlying Codex skill files.
- Clear entries from other workspaces.
- Remove one specific catalog entry.
- Add restore, archive, or undo behavior.

## 4. Functional Requirements

- The tool name is `clear_workspace_catalog`.
- The request must include `workspace`.
- The request must include `confirm: true`.
- The request may include `entryType: "agent"` or `entryType: "skill"`.
- Missing, false, or invalid `confirm` must return the normal structured
  validation error response.
- When `entryType` is omitted, the server must delete introduced agents and
  introduced skills for the requested workspace.
- When `entryType` is `agent`, the server must delete only introduced agents for
  the requested workspace.
- When `entryType` is `skill`, the server must delete only introduced skills for
  the requested workspace.
- Clearing an empty workspace must succeed with zero deleted counts.
- Cleared entries must no longer appear in list, detail, or matching results.
- The operation must never delete catalog entries from another workspace.

## 5. User Stories / Use Cases

A user is experimenting with Agentic Router and wants to reset the current
workspace catalog. They ask an agent to call `clear_workspace_catalog` with the
current workspace and explicit confirmation, then re-register the desired agents
and skills.

## 6. Data Model

Input:

- `workspace`: client workspace folder name or stable workspace slug.
- `confirm`: literal `true`.
- `entryType`: optional `agent` or `skill` filter.

Output data:

- `workspace`
- `entryType`, when supplied.
- `deletedAgents`
- `deletedSkills`
- `deletedTotal`

## 7. Error Handling

- Missing or empty workspace must return a validation error.
- Missing or false confirmation must return a validation error.
- Unknown entry type must return a validation error.
- Storage failures must return a storage error.

## 8. Security and Permissions

- Clearing must filter every delete by the requested workspace.
- Clearing must delete only catalog rows, not files or external Codex state.
- The response must report only counts for the requested workspace.

## 9. Open Questions

- Should a future UI require typing the workspace name for additional
  confirmation?
- Should bulk clear later support project-level filtering?

## 10. Decision Log

- 2026-07-13: Add `clear_workspace_catalog` as the first destructive catalog
  maintenance tool.
- 2026-07-13: Require `confirm: true` and keep single-entry removal as a
  separate future feature.
