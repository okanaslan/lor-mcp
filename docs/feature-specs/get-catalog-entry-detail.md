# Get Catalog Entry Detail

## 1. Summary

Implemented for v1 agents, skills, and subagent profiles, including explicit
shared global skill and subagent lookup. Subagent detail returns full metadata
and a rendered starter prompt for one reusable subagent profile.

## 2. Goals

- Retrieve one catalog entry by type and identifier.
- Return all stored metadata for the entry.
- Return rendered prompt text for subagent detail lookups.
- Return full reachability metadata for agent detail lookups.
- Keep detail lookup separate from listing and matching.

## 3. Non-Goals

- Search for entries by task.
- Update catalog entry metadata.
- Return workspace-local entries from other workspaces.
- Verify whether an external agent or skill still exists.
- Actively probe agent reachability during detail lookup.

## 4. Functional Requirements

- The server must accept an entry type and entry identifier.
- The request must include the client workspace path, registered alias, or
  stable workspace slug.
- The server must search only entries scoped to the requested workspace.
- The server must allow detail lookup for global skills.
- The server must return the full stored metadata for the matching entry.
- The server must return a not-found result when the entry does not exist in the
  requested workspace.
- The server must support introduced agents, introduced skills, and subagent
  profiles.
- The server must allow detail lookup for workspace-local and global subagents.
- Subagent detail must include the rendered prompt, stored references, and
  unresolved reference metadata.
- Agent detail must include full reachability metadata.
- The server must not return entries from another workspace.
- The server may return global skill entries because they are intentionally
  shared.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user selects a
catalog entry from a list or match result and wants to inspect its stored
metadata.

## 6. Data Model

Conceptual `CatalogEntryDetail` fields:

- `entryType`: identifies `agent`, `skill`, or `subagent`.
- `entryKey`: identifies the entry within the workspace.
- `scope`: identifies `workspace` or `global` for skill and subagent entries.
- `metadata`: contains the stored fields for the entry type.
- `renderedPrompt`: contains ready-to-use prompt text for subagent detail
  results.
- `reachability`: full reachability metadata for agent entries.
- `createdAt`: records when the entry was introduced.
- `updatedAt`: records when the entry was last changed, if updates exist.

## 7. Error Handling

- Missing entry type or identifier must return a validation error.
- Unknown entry type must return a validation error.
- Missing or invalid MCP readiness context must return a session error.
- Missing entries must return a not-found result.
- Storage failures must return a storage error.

## 8. Security and Permissions

- Detail lookup must only inspect entries in the requested workspace.
- Not-found responses must not reveal whether the same identifier exists in
  another workspace.
- When a workspace skill and global skill share the same `skillName`, callers
  must be able to target the intended scope.
- When a workspace subagent and global subagent share the same `name`, callers
  must be able to target the intended scope.

## 9. Open Questions

- Should entry identifiers be type-prefixed in responses?
- Should detail responses include recommendation history when that exists?

## 10. Decision Log

- 2026-07-11: Support detail lookup for agents and skills.
- 2026-07-11: Require entry type plus identifier to avoid cross-type ambiguity.
- 2026-07-13: Implement detail lookup against the client-supplied workspace.
- 2026-08-04: Implement detail lookup for shared global skills.
- 2026-08-04: Implement subagent detail lookup with rendered prompt text and
  reference metadata.
- 2026-08-06: Implement agent detail lookup to expose reachability metadata
  without actively checking liveness.
