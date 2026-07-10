# Introducing Skill

## 1. Summary

Draft. This feature lets a user introduce an existing Codex skill to the
Agentic Router MCP Server by recording its skill name and routing metadata in
storage scoped to the active initialized MCP session.

## 2. Goals

- Allow users to introduce an existing Codex skill by skill name.
- Store introduced skills in durable storage scoped to the active initialized
  MCP session.
- Capture enough metadata to support later skill routing and catalog lookup.

## 3. Non-Goals

- Introduce agents.
- Fetch, list, or search introduced skills.
- Choose a concrete database or storage technology.
- Support non-Codex skills.
- Define MCP lifecycle initialization behavior.

## 4. Functional Requirements

- The server must accept an introduce-skill request for an existing Codex skill.
- The request must include the skill name for the existing Codex skill.
- The request must include the project name the skill is focused on.
- The request must include a human-readable display name.
- The request must include one primary specialty.
- The request must include specialty tags.
- The server must reject requests missing any required field.
- The server must associate the introduced skill with the active initialized
  MCP session.
- The server must reject a duplicate skill name within the same MCP session.
- The server may allow the same skill name to be introduced in different MCP
  sessions.
- The server must persist accepted skill records in durable storage.
- The server must scope persisted skill records by initialized MCP session.
- The server must prevent one MCP session from accessing another session's
  introduced skill records.
- Fetching, listing, searching, and routing introduced skills must be handled by
  separate feature specs.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user has an
existing Codex skill and wants to make it available to the Agentic Router
catalog for future routing decisions.

## 6. Data Model

Conceptual `IntroducedSkill` fields:

- `mcpSessionKey`: identifies the initialized MCP session that owns the record.
- `skillName`: identifies the existing Codex skill.
- `projectName`: names the project the skill is focused on.
- `displayName`: provides a human-readable name for catalog display.
- `primarySpecialty`: names the skill's primary specialty.
- `specialtyTags`: lists additional specialties or routing tags.
- `createdAt`: records when the skill was introduced.
- `updatedAt`: records when the stored record was last changed, if updates are
  added later.

The feature spec does not require a specific database schema, storage engine,
or persistence implementation.

## 7. Error Handling

- Missing required fields must return a validation error.
- Missing or invalid initialized MCP session context must return a session
  error.
- Duplicate skill names within the same MCP session must return a duplicate
  error.
- Durable storage failures must return a storage error and must not report the
  skill as introduced.

## 8. Security and Permissions

- Introduced skill records must be isolated by initialized MCP session.
- A user must only be able to introduce records into the active initialized MCP
  session.
- A user must not be able to see, overwrite, or infer another MCP session's
  introduced skill records through duplicate checks or error responses.

## 9. Open Questions

- What is the exact request and response shape for the introduce-skill MCP
  operation?
- Should specialty tags be free-form strings or validated against a controlled
  taxonomy?
- Should the server verify that a Codex skill exists before accepting the
  introduction?
- If skill existence is verified, should verification use local skill inventory,
  configured skill roots, or another source?

## 10. Decision Log

- 2026-07-11: Scope this first skill feature to introducing Codex skills only.
- 2026-07-11: Store skill name as the skill reference.
- 2026-07-11: Require display name, project name, primary specialty, and
  specialty tags.
- 2026-07-11: Use primary specialty plus tags to mirror introduced agents.
- 2026-07-11: Reject duplicate skill names within the same initialized MCP
  session.
- 2026-07-11: Keep persistent storage abstract and defer database selection.
- 2026-07-11: Keep fetching, listing, searching, and routing skills as separate
  feature specs.
