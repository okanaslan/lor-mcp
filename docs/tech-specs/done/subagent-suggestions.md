# Subagent Suggestions

## 1. Summary

Implemented for v1. This tech spec defines how LOR stores and suggests subagent
prompt profiles as a third catalog entry type alongside agents and skills.

## 2. Context

LOR registers agents, skills, and subagent prompt profiles; supports global
skills and global subagents; and returns ranked matching agents, skills, and
subagents. Some work needs short-lived or focused delegation rather than a
registered Codex session. Subagent profiles fill that gap by storing reusable
prompt guidance that Codex-native subagent/task tooling can use.

## 3. Goals

- Add `subagent` as a catalog entry type.
- Support workspace and global subagent scopes.
- Include subagents in `find_matching_catalog_entry`.
- Return up to three subagent suggestions by default.
- Render ready-to-use prompts in introduce, detail, and match outputs.
- Support optional agent and skill references.
- Preserve unresolved references as metadata.
- Include workspace-local subagents in export/import and workspace sync.

## 4. Non-Goals

- Execute subagents inside LOR.
- Manage Codex task/thread lifecycle.
- Health-check subagent profiles.
- Score unresolved references.
- Add active/retired lifecycle state for subagents.

## 5. Proposed Design

Introduce a `SubagentProfile` domain model with the same public scope concept
used by global skills:

- `workspace`: stored under the resolved workspace.
- `global`: shared across workspaces.

Store subagents in durable catalog storage with a scope-aware unique constraint
on `name`. Workspace and global subagents may share the same `name`, but
duplicates within the same workspace scope or within global scope are rejected.

`find_matching_catalog_entry` should return:

- `agents`
- `skills`
- `subagents`

Subagent matching should use:

- `primarySpecialty`
- `specialtyTags`
- `displayName`
- `projectName`
- `purpose`
- `limitedScope`

Subagent matching should not use:

- `constraints`
- `expectedOutput`
- references
- unresolved references

The subagent list should default to three results. Multiple subagents are normal
ranked suggestions and must not create conflict results.

## 6. Prompt Rendering

Subagent prompt rendering should happen in:

- `introduce_subagent`
- `get_catalog_entry_detail` for subagents
- `find_matching_catalog_entry` subagent candidates

If `promptTemplate` exists, render from it. If no template exists, render a
deterministic generic prompt from:

- display name
- purpose
- limited scope
- project name
- expected output
- constraints
- referenced agents
- referenced skills

Prompt rendering must not imply that LOR can execute the subagent or contact
referenced entries.

## 7. Reference Model

Use a shared `CatalogReference` shape:

- `entryType`: `agent` or `skill`
- `name`
- optional `scope`
- optional `entryKey`
- optional `required`, default `false`

Reference behavior:

- Agent references target workspace agents only.
- Skill references may target workspace or global skills.
- References may remain unresolved.
- Unresolved references are returned as metadata or warnings.
- Unresolved references do not affect matching score.

## 8. Tool Surface

Add `introduce_subagent`:

- required `workspace`
- optional `scope`, default `workspace`
- required `name`
- required `displayName`
- required `projectName`
- required `purpose`
- required `limitedScope`
- required `primarySpecialty`
- required `specialtyTags`
- optional `agentReferences`
- optional `skillReferences`
- optional `promptTemplate`
- optional `constraints`
- optional `expectedOutput`

Do not add `suggest_subagents` in v1. Combined matching should own subagent
suggestions until there is evidence that a separate tool is needed.

## 9. Import Export And Sync

- Workspace export includes workspace-local subagents.
- Workspace import imports subagents into the target workspace.
- Workspace catalog sync copies workspace-local subagents by default along with
  skills.
- Workspace catalog sync does not copy agents.
- Workspace catalog sync does not copy global subagents.
- Global subagent export/sync is deferred.

## 10. Risks and Tradeoffs

- Adding a third catalog type broadens tool contracts and matching responses.
- Global subagents may increase result noise if too generic.
- Generic prompt rendering can become vague if stored profile fields are weak.
- Allowing unresolved references keeps introduction flexible but shifts
  responsibility to callers.

## 11. Verification Plan

- Introducing a workspace subagent stores and returns a rendered prompt.
- Introducing a global subagent stores and returns a rendered prompt.
- Duplicate names are rejected within the same scope.
- Same names are allowed across workspace and global scopes.
- List includes workspace and global subagents by default.
- Match returns up to three subagents by default.
- Subagent prompts render in match and detail results.
- Constraints, expected output, and references do not affect matching score.
- Export/import include workspace-local subagents.
- Workspace sync copies workspace-local subagents by default.
- Health checks do not report subagent profile health in v1.

## 12. Open Questions

- Should future versions add subagent prompt presets?
- Should a dedicated `suggest_subagents` tool be added after combined matching
  behavior is observed?

## 13. Decision Log

- 2026-08-04: Add `subagent` catalog entry type.
- 2026-08-04: Include subagents in `find_matching_catalog_entry`.
- 2026-08-04: Support workspace and global subagent scopes.
- 2026-08-04: Default subagent result limit is three.
- 2026-08-04: Keep subagent execution outside LOR.
- 2026-08-04: Implement subagent storage, `introduce_subagent`,
  list/detail/match integration, workspace export/import/sync, global scope, and
  removal support.
