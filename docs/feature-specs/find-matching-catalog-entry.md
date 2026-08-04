# Find Matching Catalog Entry

## 1. Summary

Implemented for v1, including shared global skills by default. This feature lets
Local Orchestration Router (LOR) evaluate a user request and return matching
introduced agents and skills from the requested workspace plus shared global
skills.

## 2. Goals

- Match task intent against introduced agents and skills.
- Return the best available catalog entry for a request.
- Provide enough matching metadata for later recommendation explanation.

## 3. Non-Goals

- Introduce new agents or skills.
- Modify catalog entries.
- Define final ranking weights for every possible specialty.
- Search agents outside the requested workspace.

## 4. Functional Requirements

- The server must accept a matching request that describes the user task.
- The request must include the client workspace path, registered alias, or
  stable workspace slug.
- The server must match agents only from the requested workspace.
- The server must match skills from the requested workspace and shared global
  skill scope by default.
- The server must consider project name, display name, primary specialty, and
  specialty tags.
- The server must consider registered skill context when present, including
  `whenToUse`, `usageNotes`, and `examplePrompts`.
- The server must not score `skillContext.constraints` in v1.
- The server must return ranked matching agents and skills when relevant entries
  exist.
- The server must return a no-match result when no introduced entry is relevant.
- The server must return a conflict result when top agent recommendations are
  ambiguous under the Conflict Handling feature.
- Skills must remain ranked and must not create conflicts in v1.
- The server must not return entries from another workspace.
- The server may return global skill entries because they are intentionally
  shared across workspaces.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user asks which
introduced agent or skill should handle a task, and Local Orchestration Router
(LOR) chooses the best matching catalog entry.

## 6. Data Model

Conceptual `CatalogMatchRequest` fields:

- `task`: describes what the user wants to do.
- `projectName`: optionally narrows matching to a project.
- `preferredType`: optionally narrows matching to `agent` or `skill`.
- `specialtyHints`: optional tags or specialties supplied by the caller.

Conceptual `CatalogMatchResult` fields:

- `entryType`: identifies whether the result is an agent or skill.
- `entryKey`: identifies the matched catalog entry.
- `matchedFields`: lists fields that contributed to the match.
- `confidence`: describes the match strength.

## 7. Error Handling

- Missing task input must return a validation error.
- Missing or invalid MCP readiness context must return a session error.
- Storage failures must return a storage error.
- Ambiguous top agent matches must return a conflict result instead of silently
  choosing.

## 8. Security and Permissions

- Matching must only inspect catalog entries in the requested workspace.
- No-match and conflict responses must not reveal entries from other workspaces.
- No-match and conflict responses may include global skill absence or matches,
  but must not reveal workspace-local entries from unrelated workspaces.

## 9. Open Questions

- Should matching be exact, keyword-based, embedding-based, or hybrid?
- What confidence values should be exposed to clients?
- Should callers be able to request agent-only or skill-only matching?

## 10. Decision Log

- 2026-07-11: Scope matching to the active catalog boundary.
- 2026-07-11: Match both introduced agents and introduced skills.
- 2026-07-11: Keep detailed ranking policy open for later implementation.
- 2026-07-13: Implement deterministic local fuzzy matching against the
  client-supplied workspace.
- 2026-07-19: Implement skill-context-aware matching for registered skills.
- 2026-07-26: Implement agents-only conflict handling for near-equal top agent
  recommendations.
- 2026-08-04: Implement matching to include global skills by default while
  keeping agents workspace-only.
