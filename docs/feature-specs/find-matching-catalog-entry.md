# Find Matching Catalog Entry

## 1. Summary

Implemented for v1 agents, skills, and subagent prompt profiles, including
shared global skills and global subagents by default.

Current public MCP tools are `find_matching_agent`, `find_matching_skill`, and
`find_matching_subagent`; the generic `find_matching_catalog_entry` tool name is
no longer registered.

## 2. Goals

- Match task intent against introduced agents, skills, and subagent profiles.
- Return ranked available catalog candidates for a request.
- Provide enough matching metadata for later recommendation explanation.
- Expose agent reachability metadata without hiding useful catalog matches.

## 3. Non-Goals

- Introduce new agents, skills, or subagent profiles.
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
- The server must return ranked matching agents, skills, and subagents when
  relevant entries exist.
- The server must return a separate ranked `subagents` list.
- Subagent matching must include workspace-local and global subagents by
  default.
- Subagent matching must limit subagent results to 3 by default.
- Subagent matching must not score references, unresolved references,
  `constraints`, or `expectedOutput`.
- The server must return a no-match result when no introduced entry is relevant.
- The server must return a conflict result when top agent recommendations are
  ambiguous under the Conflict Handling feature.
- Reachability behavior must keep unknown and unreachable agents in matching
  results by default.
- Reachability behavior must include compact reachability metadata on agent
  candidates.
- Reachability behavior must not use reachability as a scoring signal.
- Skills must remain ranked and must not create conflicts in v1.
- Subagents must remain ranked and must not create conflicts in v1.
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
- `preferredType`: optionally narrows matching to `agent`, `skill`, or
  `subagent`.
- `specialtyHints`: optional tags or specialties supplied by the caller.

Conceptual `CatalogMatchResult` fields:

- `entryType`: identifies whether the result is an agent, skill, or subagent.
- `entryKey`: identifies the matched catalog entry.
- `matchedFields`: lists fields that contributed to the match.
- `confidence`: describes the match strength.
- `reachability`: compact reachability metadata for agent candidates.

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
- 2026-08-04: Plan matching support for subagents as a separate ranked result
  list with global subagents included by default and a default limit of 3.
- 2026-08-06: Implement matching to expose agent reachability metadata while
  keeping unknown and unreachable agents visible by default.
