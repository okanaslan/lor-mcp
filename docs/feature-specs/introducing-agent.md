# Introducing Agent

## 1. Summary

Implemented for v1. This feature lets a user introduce an existing Codex agent
to the Local Orchestration Router (LOR) MCP Server by recording its Codex
session ID and routing metadata in durable storage scoped to the workspace.

## 2. Goals

- Allow users to introduce an existing Codex agent by Codex session ID.
- Store introduced agents in durable storage scoped to the workspace.
- Capture enough metadata to support later agent routing and catalog lookup.
- Initialize reachability metadata without claiming the agent is live.

## 3. Non-Goals

- Introduce skills.
- Fetch, list, or search introduced agents.
- Support non-Codex agents.
- Define MCP lifecycle initialization behavior.

## 4. Functional Requirements

- The server must accept an introduce-agent request for an existing Codex agent.
- The request must include the Codex session ID for the existing Codex agent.
- The request must include the client workspace path, registered alias, or
  stable workspace slug.
- The request must include the project name the agent is focused on.
- The request must include a human-readable display name.
- The request must include one primary specialty.
- The request must include specialty tags.
- The request may include `replacesAgentEntryKey` when this agent is a
  replacement for a retired or soon-to-be-retired agent.
- The server must reject requests missing any required field.
- The server must associate the introduced agent with the client-supplied
  workspace.
- The server must reject a duplicate Codex session ID within the same workspace.
- The server may allow the same Codex session ID to be introduced in different
  workspaces.
- The server must persist accepted agent records in durable storage.
- The server must default newly introduced agents to `agentStatus: "active"`.
- Reachability metadata must default newly introduced agents to
  `reachabilityStatus: "unknown"` and `dispatchMode: "manual"`.
- The server must scope persisted agent records by workspace.
- The server must prevent one workspace from accessing another workspace's
  introduced agent records.
- Fetching, listing, and searching introduced agents must be handled by a
  separate feature spec.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user has an
existing Codex agent session and wants to make it available to the LOR catalog
for future routing decisions.

## 6. Data Model

Conceptual `IntroducedAgent` fields:

- `workspace`: identifies the client workspace that owns the record.
- `codexSessionId`: identifies the existing Codex agent session.
- `projectName`: names the project the agent is focused on.
- `displayName`: provides a human-readable name for catalog display.
- `primarySpecialty`: names the agent's primary specialty.
- `specialtyTags`: lists additional specialties or routing tags.
- `agentStatus`: tracks whether the agent is active or retired.
- `reachabilityStatus`: metadata that starts as `unknown` and is updated only
  from Codex-native dispatch outcomes.
- `dispatchMode`: metadata that starts as `manual`.
- `replacesAgentEntryKey`: optionally links a replacement agent to an older
  agent entry.
- `createdAt`: records when the agent was introduced.
- `updatedAt`: records when the stored record was last changed, if updates are
  added later.

The feature spec does not require a specific database schema, storage engine, or
persistence implementation.

## 7. Error Handling

- Missing required fields must return a validation error.
- Missing or invalid MCP readiness context must return a session error.
- Duplicate Codex session IDs within the same workspace must return a duplicate
  error.
- Durable storage failures must return a storage error and must not report the
  agent as introduced.

## 8. Security and Permissions

- Introduced agent records must be isolated by workspace.
- A user must only be able to introduce records into the requested workspace.
- A user must not be able to see, overwrite, or infer another workspace's
  introduced agent records through duplicate checks or error responses.

## 9. Open Questions

- Should specialty tags be free-form strings or validated against a controlled
  taxonomy?
- Should a future catalog health workflow verify introduced Codex session IDs
  without blocking introduction?

## 10. Decision Log

- 2026-07-10: Scope this first feature to introducing Codex agents only.
- 2026-07-10: Store Codex session ID as the agent reference.
- 2026-07-10: Require display name, project name, primary specialty, and
  specialty tags.
- 2026-07-10: Use primary specialty plus tags instead of a single specialty.
- 2026-07-10: Reject duplicate Codex session IDs within the same initialized MCP
  session.
- 2026-07-10: Keep persistent storage abstract and defer database selection.
- 2026-07-10: Keep fetching, listing, and searching agents as a separate feature
  spec.
- 2026-07-10: Use the initialized MCP session as the catalog session boundary
  instead of requiring a custom session identifier in the tool input.
- 2026-07-13: Use the client-supplied workspace as the durable storage scope and
  keep MCP session state as protocol readiness context.
- 2026-07-13: Implement `introduce_agent` as non-blocking registration with
  `mcp_introduction` verification metadata.
- 2026-07-26: Default introduced agents to active and allow optional replacement
  linkage through `replacesAgentEntryKey`.
- 2026-08-06: Implement new and existing agents to default to unknown
  reachability; introduction must not claim that a registered agent is live.
