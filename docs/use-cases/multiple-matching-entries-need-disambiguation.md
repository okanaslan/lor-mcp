# Multiple Matching Entries Need Disambiguation

## 1. Summary

A Codex agent asks Local Orchestration Router (LOR) for relevant catalog entries
and receives multiple useful skill or subagent candidates.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

The workspace/global catalog contains multiple skills or subagents with similar
project, specialty, or tag metadata. The current Codex agent asks Local
Orchestration Router (LOR) for relevant context and receives ranked candidates
rather than a single forced winner.

## 4. Flow

1. The current Codex agent receives a task from the Codex user.
2. The current agent calls `find_matching_skill` and `find_matching_subagent`.
3. Local Orchestration Router (LOR) returns ranked candidates with inline
   explanations and next-step guidance.
4. The current agent reviews the candidates and chooses the entries that fit the
   task.
5. When candidates are too close to choose safely, the current agent asks the
   user to choose or refines the matching request with a more specific project
   name or specialty hints.
6. The current agent continues only after the ambiguity is resolved.

## 5. Expected Outcome

The current Codex agent avoids overclaiming a single best answer and has enough
candidate information to choose, combine, or ask for clarification.

## 6. Related Feature Specs

- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)
- [Get Catalog Entry Detail](../feature-specs/get-catalog-entry-detail.md)

## 7. Open Questions

None for V2.
