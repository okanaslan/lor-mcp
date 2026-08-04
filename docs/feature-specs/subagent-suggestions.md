# Subagent Suggestions

## 1. Summary

Implemented for v1. This feature adds subagents as a third catalog entry type in
Local Orchestration Router (LOR). Subagents are reusable prompt profiles for
temporary or focused delegation, not registered Codex sessions. LOR can suggest
up to three matching subagents through `find_matching_catalog_entry` and return
ready-to-use prompts for suggested or detailed subagent entries.

## 2. Goals

- Let users manually introduce reusable subagent profiles.
- Support workspace and global subagent scopes.
- Include global subagents in list and match results by default.
- Include subagents in `find_matching_catalog_entry` alongside agents and
  skills.
- Return rendered prompts for subagent matches, details, and introduction
  results.
- Let subagents reference optional agents and skills.
- Allow unresolved references as metadata without blocking introduction.

## 3. Non-Goals

- Create, start, message, or manage Codex subagent tasks directly.
- Treat subagents as registered Codex sessions.
- Add active or retired lifecycle states for subagents.
- Health-check subagent profiles in v1.
- Let subagent references affect matching score.
- Copy agents through workspace catalog sync.

## 4. Functional Requirements

- The server must support `subagent` as a catalog entry type.
- The server must expose `introduce_subagent`.
- `introduce_subagent` must require:
  - `workspace`
  - `name`
  - `displayName`
  - `projectName`
  - `purpose`
  - `limitedScope`
  - `primarySpecialty`
  - `specialtyTags`
- `introduce_subagent` may accept:
  - `scope`, defaulting to `workspace`
  - `agentReferences`
  - `skillReferences`
  - `promptTemplate`
  - `constraints`
  - `expectedOutput`
- The server must reject duplicate subagent `name` values within the same
  workspace scope.
- The server must reject duplicate subagent `name` values within global scope.
- Workspace and global subagents with the same `name` may coexist and may both
  appear in list and match results.
- If `promptTemplate` is missing, LOR must render a deterministic generic prompt
  from stored subagent fields.
- `find_matching_catalog_entry` must return a separate ranked `subagents` list.
- Matching must include global subagents by default.
- Matching must return up to three subagents by default.
- Multiple subagent suggestions must not create conflict results.
- `get_catalog_entry_detail` must return a rendered prompt for subagent entries.
- Workspace export must include workspace-local subagents.
- Workspace import must import subagent profiles into the target workspace.
- Workspace catalog sync must copy workspace-local subagents by default along
  with skills.
- Workspace catalog sync must not copy agents or global subagents.
- Removing a subagent profile must be supported through normal catalog removal.

## 5. User Stories / Use Cases

- [Introduce Subagent Profile](../use-cases/introduce-subagent-profile.md)
- [Suggest Subagents For Scoped Work](../use-cases/suggest-subagents-for-scoped-work.md)

## 6. Data Model

Conceptual `SubagentProfile` fields:

- `entryType`: `subagent`
- `scope`: `workspace` or `global`
- `name`
- `displayName`
- `projectName`
- `purpose`
- `limitedScope`
- `primarySpecialty`
- `specialtyTags`
- `agentReferences`
- `skillReferences`
- optional `promptTemplate`
- `constraints`
- `expectedOutput`
- `createdAt`
- `updatedAt`

Conceptual `CatalogReference` fields:

- `entryType`: `agent` or `skill`
- `name`: human-readable reference name.
- `scope`: optional `workspace` or `global`.
- `entryKey`: optional exact catalog entry pointer.
- `required`: optional boolean, default `false`.

Unresolved references must be preserved and returned as metadata or warnings.

## 7. Error Handling

- Missing required fields must return `validation_error`.
- Duplicate subagent names within the same scope must return `duplicate_entry`.
- Invalid scope must return `validation_error`.
- Unresolved agent or skill references must not reject introduction.
- Missing subagent entries must return `not_found` for detail, update, or
  removal.
- Storage failures must return `storage_error`.

## 8. Security and Permissions

- Workspace subagents must remain isolated by resolved workspace.
- Global subagents are intentionally visible across workspaces.
- Agent references must not expose agents from unrelated workspaces.
- Subagent prompts must not invent access to referenced agents or skills.
- LOR stores and renders prompt guidance only; Codex-native subagent/task tools
  remain responsible for execution.

## 9. V1 Decisions

- Subagents are a third catalog entry type.
- Subagents support `scope: "workspace" | "global"`.
- Global subagents are included by default in list and match.
- `find_matching_catalog_entry` returns subagents; no separate
  `suggest_subagents` tool is planned for v1.
- Subagent result limit defaults to three.
- `promptTemplate` is optional because LOR can render a generic prompt from
  stored fields.
- `constraints`, `expectedOutput`, references, and unresolved references do not
  affect matching score.
- Subagent profiles are not health-checked in v1.
- Remove is enough; no subagent retirement lifecycle is planned for v1.

## 10. Decision Log

- 2026-08-04: Add subagents as a third catalog type, not Codex sessions.
- 2026-08-04: Include subagents in `find_matching_catalog_entry` instead of
  adding a separate suggestion tool.
- 2026-08-04: Support workspace and global subagent scopes.
- 2026-08-04: Return ready-to-use prompts for subagent introduction, detail, and
  match results.
- 2026-08-04: Allow unresolved agent and skill references as metadata only.
- 2026-08-04: Implement `introduce_subagent`, subagent list/detail/match,
  workspace export/import/sync, global subagent visibility, and remove support.
