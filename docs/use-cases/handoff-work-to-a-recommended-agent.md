# Handoff Work To A Recommended Agent

## 1. Summary

A Codex agent finds another introduced Codex agent that is better suited for
part of a task and prepares a focused handoff prompt for that agent.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

The current Codex agent is working on a task and uses Agentic Router MCP to find
a specialized agent. Agentic Router recommends an introduced Codex agent, and
the current agent needs enough detail to coordinate work with it.

## 4. Flow

1. The current Codex agent receives a task from the Codex user.
2. The current agent asks Agentic Router MCP for a matching catalog entry.
3. Agentic Router recommends an introduced Codex agent.
4. The current agent asks Agentic Router to prepare a handoff prompt for the
   recommended agent.
5. Agentic Router renders a task-specific prompt from stored handoff metadata or
   a generic fallback.
6. The current agent reviews the prompt.
7. The current agent sends or presents the handoff prompt using the available
   Codex workflow.
8. The current agent incorporates the other agent's result when continuing the
   original task.

## 5. Expected Outcome

The current Codex agent can coordinate with a better-suited introduced agent
without losing task context or inventing unsupported handoff behavior.

## 6. Related Feature Specs

- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)
- [Get Catalog Entry Detail](../feature-specs/get-catalog-entry-detail.md)
- [Routing Recommendation Explanation](../feature-specs/routing-recommendation-explanation.md)
- [Introducing Agent](../feature-specs/introducing-agent.md)
- [Prepare Agent Handoff](../feature-specs/prepare-agent-handoff.md)

## 7. Open Questions

- Should a later version support a documented Codex app-server bridge for
  optional dispatch?
