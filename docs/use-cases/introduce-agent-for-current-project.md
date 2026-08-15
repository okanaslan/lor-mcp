# Introduce Agent For Current Project

## 1. Summary

Historical/internal V2 note. A Codex user registers an existing Codex agent for
the current project so Local Orchestration Router (LOR) can recommend it for
future tasks in the requested workspace.

The normal public V2 surface no longer exposes registered-agent catalog tools.
Use `generate_agent_prompt`, registered skills, and subagent profiles for
short-lived task-oriented Codex chats.

## 2. Actor

Codex user.

## 3. Scenario

The user knows an existing Codex agent is useful for the current project. The
user asks the current Codex agent to introduce that agent to Local Orchestration
Router (LOR) with project, display, and specialty metadata.

## 4. Flow

1. The Codex user opens a workspace where LOR MCP is configured.
2. The user identifies an existing Codex agent to add to the catalog.
3. The user provides the Codex session ID and project-focused metadata.
4. The current Codex agent calls LOR MCP to introduce the agent.
5. Local Orchestration Router (LOR) validates the required metadata.
6. Local Orchestration Router (LOR) stores the agent in the requested workspace.
7. The current Codex agent reports that the agent is available for future
   recommendations.

## 5. Expected Outcome

In the historical/internal workflow, the existing Codex agent is available in
the workspace catalog. In the public V2 workflow, the user should prefer fresh
short-lived Codex chats initialized with relevant LOR skills and subagents.

## 6. Related Feature Specs

- [Introducing Agent](../feature-specs/introducing-agent.md)
- [V2 Tool Surface Simplification](../feature-specs/v2-tool-surface-simplification.md)
- [MCP Initialization Session](../feature-specs/mcp-initialization-session.md)
- [Skill / Agent Existence Verification](../feature-specs/existence-verification.md)

## 7. Open Questions

- Should the user provide all agent metadata manually, or can Local
  Orchestration Router (LOR) infer any fields?
- Should a future catalog health workflow report whether the Codex session ID
  still appears usable?
