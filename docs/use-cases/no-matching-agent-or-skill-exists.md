# No Matching Skill Or Subagent Exists

## 1. Summary

A Codex agent asks Local Orchestration Router (LOR) for a relevant skill or
subagent, but no catalog entry matches the task.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

The current Codex agent is working on a task and asks LOR MCP for a related
skill or subagent. The active catalog does not contain a relevant entry.

## 4. Flow

1. The current Codex agent receives a task from the Codex user.
2. The current agent calls `find_matching_skill` and `find_matching_subagent`.
3. Local Orchestration Router (LOR) searches visible workspace/global skills and
   subagents for the requested workspace.
4. Local Orchestration Router (LOR) returns a no-match result.
5. The current agent does not invent unavailable agents or skills.
6. The current agent continues the task using its own capabilities.
7. The current agent may tell the user that no matching catalog entry was found.

## 5. Expected Outcome

The current Codex agent continues safely without relying on a non-existent
skill, subagent, or callable agent, and the user can decide whether to register
new catalog context later.

## 6. Related Feature Specs

- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)
- [Introducing Skill](../feature-specs/introducing-skill.md)
- [Subagent Suggestions](../feature-specs/subagent-suggestions.md)

## 7. Open Questions

- Should no-match results include near misses from visible skills and subagents?
