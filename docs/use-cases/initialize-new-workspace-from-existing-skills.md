# Initialize New Workspace From Existing Skills

## 1. Summary

A Codex user starts work in a new workspace where LOR MCP is reachable, but the
workspace catalog has no registered skills or subagents yet. The user wants to
copy useful skills and subagents from an existing workspace, then bootstrap new
short-lived task agents with generated starter prompts.

## 2. Actor

Codex user starting a new workspace.

## 3. Scenario

The Codex user opens a new project workspace and asks whether LOR MCP is
available. LOR responds successfully, but `list_skills` returns an empty catalog
for the new workspace. The user knows another workspace already has useful
registered skills and wants a quick way to initialize the new workspace without
copying registered agents.

## 4. Flow

1. The user asks the active Codex agent to initialize the new workspace from
   useful skills in a source workspace.
2. The agent calls `preview_workspace_catalog_sync` for the source and target
   workspaces.
3. LOR returns the skills and subagents that would be copied, duplicate entries
   that would be skipped, missing requested entries, and any generated starter
   prompt metadata.
4. The user reviews the preview.
5. After approval, the agent calls `apply_workspace_catalog_sync` with
   `confirm: true`.
6. LOR copies selected workspace-local skill and subagent catalog entries into
   the target workspace.
7. The agent uses `generate_agent_prompt` for requested agent roles.
8. The user starts new Codex chats with those prompts.

## 5. Expected Outcome

The new workspace has useful registered skills and subagents immediately, while
agents are created fresh as short-lived Codex chats outside LOR.

## 6. Related Feature Specs

- [Workspace Catalog Sync](../feature-specs/workspace-catalog-sync.md)
- [Catalog Export](../feature-specs/catalog-export.md)
- [Catalog Import](../feature-specs/catalog-import.md)
- [Generate Agent Prompt](../feature-specs/generate-agent-prompt.md)
- [Introducing Skill](../feature-specs/introducing-skill.md)
- [Subagent Suggestions](../feature-specs/subagent-suggestions.md)

## 7. Open Questions

- Should a later version support named workspace templates in addition to
  copying from an existing workspace?
- Should role presets for generated agent prompts be selected manually or
  inferred from copied skills?
