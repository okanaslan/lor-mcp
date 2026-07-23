# Initialize New Workspace From Existing Skills

## 1. Summary

A Codex user starts work in a new workspace where LOR MCP is reachable, but the
workspace catalog has no registered agents or skills yet. The user wants to copy
useful skills from an existing workspace, then bootstrap new workspace-specific
agents with generated starter prompts.

## 2. Actor

Codex user starting a new workspace.

## 3. Scenario

The Codex user opens a new project workspace and asks whether LOR MCP is
available. LOR responds successfully, but `list_catalog_entries` returns an
empty catalog for the new workspace. The user knows another workspace already
has useful registered skills and wants a quick way to initialize the new
workspace without copying registered agents.

## 4. Flow

1. The user asks the active Codex agent to initialize the new workspace.
2. The agent asks LOR to preview skills from a source workspace.
3. LOR returns the skills that would be copied, duplicate skills that would be
   skipped, missing requested skills, and any generated starter prompt metadata.
4. The user reviews the preview.
5. After approval, the agent asks LOR to apply the workspace initialization.
6. LOR copies selected skill catalog entries into the target workspace.
7. The agent uses `generate_agent_prompt` for requested agent roles.
8. The user starts new Codex chats with those prompts.
9. After each new Codex chat has a real session ID, the user registers it with
   `introduce_agent`.

## 5. Expected Outcome

The new workspace has useful registered skills immediately, while agents are
created fresh for the new workspace and registered only after real Codex session
IDs exist.

## 6. Related Feature Specs

- [Initialize Workspace](../feature-specs/initialize-workspace.md)
- [Catalog Export](../feature-specs/catalog-export.md)
- [Catalog Import](../feature-specs/catalog-import.md)
- [Generate Agent Prompt](../feature-specs/generate-agent-prompt.md)
- [Introducing Agent](../feature-specs/introducing-agent.md)
- [Introducing Skill](../feature-specs/introducing-skill.md)

## 7. Open Questions

- Should a later version support named workspace templates in addition to
  copying from an existing workspace?
- Should role presets for generated agent prompts be selected manually or
  inferred from copied skills?
