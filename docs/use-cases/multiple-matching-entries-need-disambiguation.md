# Multiple Matching Entries Need Disambiguation

## 1. Summary

A Codex agent asks Agentic Router for a relevant catalog entry, but multiple
agents or skills match the task equally well.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

The active catalog contains multiple agents or skills with similar project,
specialty, or tag metadata. The current Codex agent asks Agentic Router for the
best match and receives a conflict result instead of a random recommendation.

## 4. Flow

1. The current Codex agent receives a task from the Codex user.
2. The current agent asks Agentic Router MCP to find a matching catalog entry.
3. Agentic Router finds multiple equally relevant candidates in the active
   session.
4. Agentic Router returns a conflict result with candidate summaries.
5. The current agent reviews the candidates and matching signals.
6. The current agent asks the user to choose, chooses based on task context, or
   refines the matching request.
7. The current agent continues only after the ambiguity is resolved.

## 5. Expected Outcome

The current Codex agent avoids silently choosing between equally strong matches
and has enough candidate information to resolve the ambiguity.

## 6. Related Feature Specs

- [Conflict Handling](../feature-specs/conflict-handling.md)
- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)
- [Get Catalog Entry Detail](../feature-specs/get-catalog-entry-detail.md)

## 7. Open Questions

- Should the current agent ask the user before choosing among conflict
  candidates?
- Should Agentic Router provide a preferred tie-breaker later?
