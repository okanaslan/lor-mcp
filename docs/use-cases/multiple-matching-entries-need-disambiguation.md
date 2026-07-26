# Multiple Matching Entries Need Disambiguation

## 1. Summary

A Codex agent asks Local Orchestration Router (LOR) for a relevant catalog
entry, but multiple agents match the task with near-equal strength.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

The workspace catalog contains multiple agents with similar project, specialty,
or tag metadata. The current Codex agent asks Local Orchestration Router (LOR)
for the best match and receives a conflict result instead of a random handoff
target. Matching skills remain ranked and do not create conflicts in v1.

## 4. Flow

1. The current Codex agent receives a task from the Codex user.
2. The current agent asks LOR MCP to find a matching catalog entry.
3. Local Orchestration Router (LOR) finds multiple near-equal agent candidates
   in the requested workspace.
4. Local Orchestration Router (LOR) returns a conflict result with candidate
   explanations, differentiating fields/signals, a suggested clarification
   question, and a recommended next action.
5. The current agent reviews the candidates and conflict metadata.
6. The current agent asks the user to choose or refines the matching request
   with a more specific project name or specialty hints.
7. The current agent continues only after the ambiguity is resolved.

## 5. Expected Outcome

The current Codex agent avoids silently choosing between near-equal agent
matches and has enough candidate information to resolve the ambiguity.

## 6. Related Feature Specs

- [Conflict Handling](../feature-specs/conflict-handling.md)
- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)
- [Get Catalog Entry Detail](../feature-specs/get-catalog-entry-detail.md)

## 7. Open Questions

- Should the current agent ask the user before choosing among conflict
  candidates?
- Should Local Orchestration Router (LOR) persist resolved conflict feedback
  later?
