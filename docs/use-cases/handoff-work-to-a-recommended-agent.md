# Handoff Work To A Recommended Agent

## 1. Summary

A Codex agent finds relevant skills or subagent prompt profiles for part of a
task and prepares a manual prompt for a fresh short-lived Codex chat when that
is useful.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

The current Codex agent is working on a task and uses LOR MCP to find relevant
skill metadata and reusable subagent profiles. If the work should be split, the
current agent asks LOR to generate a prompt for a fresh Codex chat rather than
dispatching to a long-lived registered agent.

## 4. Flow

1. The current Codex agent receives a task from the Codex user.
2. The current agent calls `find_matching_skill` and `find_matching_subagent`.
3. Local Orchestration Router (LOR) returns relevant skills, subagent prompts,
   explanations, and next-step guidance.
4. The current agent calls `generate_agent_prompt` when a fresh short-lived
   Codex chat should own part of the work.
5. The current agent reviews the prompt and explains manual delivery.
6. The user or Codex-native workflow starts the new chat.
7. The current agent incorporates the other chat's result when continuing the
   original task.

## 5. Expected Outcome

The current Codex agent can split work manually without implying LOR can create,
message, or track other Codex chats.

## 6. Related Feature Specs

- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)
- [Get Catalog Entry Detail](../feature-specs/get-catalog-entry-detail.md)
- [Routing Recommendation Explanation](../feature-specs/routing-recommendation-explanation.md)
- [Generate Agent Prompt](../feature-specs/generate-agent-prompt.md)
- [Subagent Suggestions](../feature-specs/subagent-suggestions.md)

## 7. Open Questions

None for V2.
