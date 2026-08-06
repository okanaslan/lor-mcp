# Clear Workspace Catalog

## 1. Summary

Implemented for v1. This feature lets a caller clear introduced workspace-local
catalog entries from one requested workspace.

Current public MCP tools are `clear_workspace_agents`, `clear_workspace_skills`,
and `clear_workspace_subagents`; the generic `clear_workspace_catalog` tool name
is no longer registered.

## 2. Goals

- Let users reset a workspace catalog without deleting Codex agents or skill
  files.
- Keep clearing strictly scoped to the client-supplied workspace.
- Require explicit confirmation before deleting catalog records.
- Support clearing agents, skills, or subagent profiles through explicit typed
  tools.

## 3. Non-Goals

- Delete underlying Codex agent sessions.
- Delete underlying Codex skill files.
- Clear entries from other workspaces.
- Clear shared global skills.
- Remove one specific catalog entry.
- Add restore, archive, or undo behavior.

## 4. Functional Requirements

- The tool names are `clear_workspace_agents`, `clear_workspace_skills`, and
  `clear_workspace_subagents`.
- The request must include `workspace`.
- The request must include `confirm: true`.
- Missing, false, or invalid `confirm` must return the normal structured
  validation error response.
- `clear_workspace_agents` must delete only introduced agents for the requested
  workspace.
- `clear_workspace_skills` must delete only workspace-local introduced skills
  for the requested workspace.
- `clear_workspace_subagents` must delete only workspace-local introduced
  subagent profiles for the requested workspace.
- Clearing a workspace must not delete global skills.
- Clearing an empty workspace must succeed with zero deleted counts.
- Cleared entries must no longer appear in list, detail, or matching results.
- The operation must never delete catalog entries from another workspace.

## 5. User Stories / Use Cases

A user is experimenting with Local Orchestration Router (LOR) and wants to reset
the current workspace catalog. They ask an agent to call
`clear_workspace_agents`, `clear_workspace_skills`, or
`clear_workspace_subagents` with the current workspace and explicit
confirmation, then re-register the desired agents, skills, and subagent
profiles.

## 6. Data Model

Input:

- `workspace`: client workspace path, registered alias, or stable workspace
  slug.
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
- Clearing must not delete global skill records.
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
- 2026-08-04: Keep workspace clear scoped to workspace-local entries even after
  global skills are added.
