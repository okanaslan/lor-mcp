# V2 Agent Initialization Context

## 1. Summary

Superseded for the current V2 public MCP surface. This feature shifted LOR from
long-lived, skill-oriented agents toward short-lived, task-oriented agent
initialization, but the dedicated initialization tool has since been removed in
favor of skill/subagent matching plus generic prompt generation.

## 2. Goals

- Generate task-oriented startup context for short-lived Codex agents.
- Include relevant LOR skills and subagents in generated prompts.
- Explain what the new agent should do next.
- Explain what the new agent should do if a recommended skill, subagent, or
  local instruction is unavailable.
- Reduce reliance on long-lived specialist agent sessions.

## 3. Non-Goals

- Create Codex chats automatically.
- Dispatch work to other agents.
- Track task execution status.
- Replace local Codex skills.

## 4. Functional Requirements

- V2 should support an agent initialization workflow centered on `task` through
  remaining prompt and matching tools.
- The workflow must find relevant registered skills and subagents.
- The workflow must return a ready-to-paste prompt for a short-lived Codex
  agent.
- The prompt must include:
  - task framing
  - relevant skills
  - relevant subagents
  - local instruction guidance
  - next steps
  - failure guidance
- The workflow must prefer skills and subagents over long-lived agent routing.
- The workflow must not claim that LOR created or messaged a Codex agent.

## 5. User Stories / Use Cases

Optional. The primary use case is a user starting a fresh Codex task and asking
LOR to initialize the new agent with the right local context.

## 6. Data Model

Conceptual `AgentInitializationContext` fields:

- `workspace`
- `task`
- `recommendedSkills`
- `recommendedSubagents`
- `localInstructionSources`
- `prompt`
- `nextSteps`
- `failureGuidance`

## 7. Error Handling

- If no skills match, return guidance to inspect or improve skill registration.
- If no subagents match, return guidance to continue without inventing
  unavailable subagents.
- If local instructions cannot be inspected, return manual fallback guidance.

## 8. Security and Permissions

- Generated prompts must not include hidden catalog entries from other
  workspaces.
- Generated prompts must not claim unavailable skills or subagents exist.

## 9. Open Questions

- Should richer initialization behavior be folded into `generate_agent_prompt`
  instead of reintroducing a dedicated initialization tool?
- Should it require an explicit `task` field, or support generic role prompts?
- Should local instruction extraction read `AGENTS.md`, or only reference it?

## 10. Decision Log

- 2026-08-14: Plan V2 around short-lived task-oriented agents.
- 2026-08-14: Prefer initialization with skills and subagents over long-lived
  skill-oriented agents.
- 2026-08-14: Implement a dedicated read-only initialization prompt helper
  separate from role-preset `generate_agent_prompt`.
- 2026-08-14: Reference `AGENTS.md` as local instruction guidance without
  reading, storing, or rewriting local instruction file contents in this pass.
- 2026-08-14: Remove the dedicated initialization helper from the public MCP
  surface. Use skill/subagent matching plus `generate_agent_prompt` instead.
