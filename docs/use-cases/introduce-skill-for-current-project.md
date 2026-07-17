# Introduce Skill For Current Project

## 1. Summary

A Codex user registers an existing Codex skill for the current project so
Local Orchestration Router (LOR) can recommend it for future tasks in the requested workspace.

## 2. Actor

Codex user.

## 3. Scenario

The user knows an existing Codex skill is useful for the current project. The
user asks the current Codex agent to introduce that skill to Local Orchestration Router (LOR) with
project, display, and specialty metadata.

## 4. Flow

1. The Codex user opens a workspace where LOR MCP is configured.
2. The user identifies an existing Codex skill to add to the catalog.
3. The user provides the skill name and project-focused metadata.
4. The current Codex agent calls LOR MCP to introduce the skill.
5. Local Orchestration Router (LOR) validates the required metadata.
6. Local Orchestration Router (LOR) stores the skill in the requested workspace.
7. The current Codex agent reports that the skill is available for future
   recommendations.

## 5. Expected Outcome

The existing Codex skill is available in the workspace catalog and can be
matched, inspected, or recommended by later Local Orchestration Router (LOR) workflows.

## 6. Related Feature Specs

- [Introducing Skill](../feature-specs/introducing-skill.md)
- [MCP Initialization Session](../feature-specs/mcp-initialization-session.md)
- [Skill / Agent Existence Verification](../feature-specs/existence-verification.md)

## 7. Open Questions

- Should the user provide all skill metadata manually, or can Local Orchestration Router (LOR)
  infer any fields from skill files?
- Should a future catalog health workflow report whether the skill name still
  appears usable?
