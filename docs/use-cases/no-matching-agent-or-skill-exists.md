# No Matching Agent Or Skill Exists

## 1. Summary

A Codex agent asks Local Orchestration Router (LOR) for a relevant agent or skill, but no catalog
entry matches the task.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

The current Codex agent is working on a task and asks LOR MCP for a
related agent or skill. The active catalog does not contain a relevant entry.

## 4. Flow

1. The current Codex agent receives a task from the Codex user.
2. The current agent asks LOR MCP to find a matching catalog entry.
3. Local Orchestration Router (LOR) searches introduced agents and skills in the requested workspace
   workspace.
4. Local Orchestration Router (LOR) returns a no-match result.
5. The current agent does not invent unavailable agents or skills.
6. The current agent continues the task using its own capabilities.
7. The current agent may tell the user that no matching catalog entry was found.

## 5. Expected Outcome

The current Codex agent continues safely without relying on a non-existent agent
or skill, and the user can decide whether to introduce a new catalog entry later.

## 6. Related Feature Specs

- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)
- [Introducing Agent](../feature-specs/introducing-agent.md)
- [Introducing Skill](../feature-specs/introducing-skill.md)

## 7. Open Questions

- Should Local Orchestration Router (LOR) suggest metadata for a future agent or skill when no
  match exists?
- Should no-match results include near misses from the requested workspace?
