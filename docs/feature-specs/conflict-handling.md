# Conflict Handling

## 1. Summary

Implemented internally for registered-agent matching in v1, but not part of the
normal public V2 tool surface. Public V2 skill and subagent matching returns
ranked candidates instead of conflict results.

## 2. Goals

- Preserve the historical conflict model for older registered-agent matching.
- Keep public V2 skill and subagent matching ranked without treating multiple
  useful candidates as conflicts.

## 3. Non-Goals

- Define the complete matching algorithm.
- Automatically modify catalog metadata to resolve conflicts.
- Ask the user through a UI flow.
- Include entries from other workspaces.
- Persist conflict feedback or learn from conflict outcomes.

## 4. Functional Requirements

- Historical registered-agent matching must detect when multiple top agents have
  near-equivalent match strength.
- Conflict detection must only consider agent candidates.
- Near-equal top agent scores are scores within 10 percent of the top agent
  score.
- Conflict detection must only consider entries in the requested workspace.
- The server must return a conflict result instead of choosing randomly.
- The conflict result must include ambiguous candidates and each candidate's
  explanation.
- The conflict result must include matched signals, differentiating fields,
  differentiating signals, a suggested clarification question, and a recommended
  next action.
- The server may auto-select deterministically when the top agent has a
  meaningful stronger signal, such as exact project-name match or stronger
  primary-specialty strength.
- Multiple matching skills must remain a ranked list and must not force
  `status: "conflict"` in the public V2 surface.
- Multiple matching subagents must remain a ranked list and must not force
  `status: "conflict"` in the public V2 surface.
- The caller may resolve the conflict by making a more specific request or by
  choosing one candidate.

## 5. User Stories / Use Cases

Historical use case: two backend-focused registered agents match a task with
near-equal strength and Local Orchestration Router (LOR) asks the caller to
disambiguate instead of guessing. Public V2 matching should usually combine or
rank skill/subagent results.

## 6. Data Model

Conceptual `CatalogConflictResult` fields:

- `reason`: describes why the match is ambiguous.
- `candidates`: lists the near-equivalent agent candidates.
- `matchedSignals`: lists matching tokens or signals across candidates.
- `differentiatingFields`: lists fields that distinguish the candidates.
- `differentiatingSignals`: lists signals that distinguish the candidates.
- `suggestedClarificationQuestion`: gives the caller a ready question to ask.
- `recommendedNextAction`: tells the caller how to proceed safely before
  preparing a handoff.
- `resolutionHint`: suggests how the caller can refine the request.

## 7. Error Handling

- Missing match context must return a validation error.
- Missing or invalid initialized MCP session context must return a session
  error.
- Storage failures must return a storage error.

## 8. Security and Permissions

- Conflict candidates must only come from the requested workspace.
- Conflict responses must not reveal entries from other workspaces.

## 9. Open Questions

- Should recent usage become a tie-breaker later?
- Should future versions persist conflict feedback after the caller resolves an
  ambiguity?

## 10. Decision Log

- 2026-07-11: Equal matches return conflict instead of random selection.
- 2026-07-11: Initial draft considered conflict handling for both agents and
  skills.
- 2026-07-26: Implement v1 conflict handling for agents only, using a 10 percent
  near-equal threshold while keeping skills ranked.
- 2026-07-26: Allow deterministic auto-selection when the top agent has exact
  project-name or stronger primary-specialty evidence.
- 2026-08-04: Plan subagent recommendations to behave like skills for conflict
  handling: ranked results, not ambiguity conflicts.
- 2026-08-15: Keep conflict handling out of the normal public V2 surface because
  registered-agent matching is no longer public.
