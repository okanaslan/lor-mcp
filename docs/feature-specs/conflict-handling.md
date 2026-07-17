# Conflict Handling

## 1. Summary

Draft. This feature defines how Local Orchestration Router (LOR) handles cases where multiple
introduced agents or skills match a request equally well.

## 2. Goals

- Avoid silently choosing between equally strong matches.
- Return clear conflict results for ambiguous recommendations.
- Provide enough candidate metadata for the caller to choose or refine.

## 3. Non-Goals

- Define the complete matching algorithm.
- Automatically modify catalog metadata to resolve conflicts.
- Ask the user through a UI flow.
- Include entries from other initialized MCP sessions.

## 4. Functional Requirements

- The server must detect when multiple entries have equivalent match strength.
- Conflict detection must only consider entries in the active initialized MCP
  session.
- The server must return a conflict result instead of choosing randomly.
- The conflict result must include the conflicting entries' type, identifier,
  display name, project name, primary specialty, and specialty tags.
- The conflict result should include the matching signals shared by the
  candidates.
- The caller may resolve the conflict by making a more specific request or by
  choosing one candidate.
- Conflict handling must support both introduced agents and introduced skills.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that two backend-focused
entries match a task and Local Orchestration Router (LOR) asks the caller to disambiguate instead
of guessing.

## 6. Data Model

Conceptual `CatalogConflictResult` fields:

- `reason`: describes why the match is ambiguous.
- `candidates`: lists the equally matched entries.
- `matchedSignals`: lists shared matching fields.
- `resolutionHint`: suggests how the caller can refine the request.

## 7. Error Handling

- Missing match context must return a validation error.
- Missing or invalid initialized MCP session context must return a session
  error.
- Storage failures must return a storage error.

## 8. Security and Permissions

- Conflict candidates must only come from the requested workspace.
- Conflict responses must not reveal entries from other sessions.

## 9. Open Questions

- Should same-score conflicts always require caller resolution?
- Should one entry type be preferred over another when scores tie?
- Should recent usage become a tie-breaker later?

## 10. Decision Log

- 2026-07-11: Equal matches return conflict instead of random selection.
- 2026-07-11: Conflict handling covers both agents and skills.
