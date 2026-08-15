# Find Related Skills And Subagents For A Task

## 1. Summary

A Codex user asks a Codex agent to complete a task in a workspace where LOR MCP
is installed and configured. The task explicitly instructs the agent to use LOR
MCP to find related skills or subagent prompt profiles, inspect their details,
and use them when relevant.

## 2. Actor

Codex user.

## 3. Scenario

The Codex user opens Codex in a workspace where LOR MCP is available. The user
gives an arbitrary Codex agent a task and includes instructions to find related
skills or subagents for that task through LOR MCP. The current agent uses the
MCP tools to discover relevant catalog entries, inspect their details, and
decide whether to apply skill guidance, use a subagent prompt profile, generate
a fresh-chat prompt, or continue without additional help.

## 4. Flow

1. The Codex user opens a workspace where LOR MCP is installed and configured.
2. The Codex user gives the current Codex agent a task.
3. The task description instructs the current agent to find related subagents or
   skills for the task using LOR MCP.
4. The current agent calls `find_matching_skill` and `find_matching_subagent`.
5. Local Orchestration Router (LOR) returns relevant skill or subagent
   candidates, or a no-match result.
6. The current agent fetches detailed metadata for promising candidates.
7. The current agent reviews returned metadata, recommendation explanation, and
   any prompt guidance.
8. The current agent decides whether to use skill context, use a subagent
   profile, generate a fresh-chat prompt, or continue alone.
9. If another Codex chat is useful, the current agent uses
   `generate_agent_prompt` for a task-specific manual prompt.
10. The current agent continues the original task using the selected support, or
    continues without additional entries when no useful entry exists.

## 5. Expected Outcome

The current Codex agent can identify relevant skill and subagent catalog entries
and understand enough detail to use them. If no useful entry exists, the current
agent continues without inventing unavailable agents, skills, or subagents.

## 6. Related Feature Specs

- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)
- [Get Catalog Entry Detail](../feature-specs/get-catalog-entry-detail.md)
- [Routing Recommendation Explanation](../feature-specs/routing-recommendation-explanation.md)
- [Introducing Skill](../feature-specs/introducing-skill.md)
- [Subagent Suggestions](../feature-specs/subagent-suggestions.md)
- [Generate Agent Prompt](../feature-specs/generate-agent-prompt.md)

## 7. Open Questions

None for V2.
