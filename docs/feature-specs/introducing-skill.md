# Introducing Skill

## 1. Summary

Implemented for v1, including workspace scope by default and direct global skill
creation with `scope: "global"`. This feature lets a user introduce an existing
Codex skill to the Local Orchestration Router (LOR) MCP Server by recording its
skill name and routing metadata in durable storage.

## 2. Goals

- Allow users to introduce an existing Codex skill by skill name.
- Store introduced skills in durable storage scoped to the workspace by default.
- Support direct global skill creation when `scope: "global"` is supplied.
- Capture enough metadata to support later skill routing and catalog lookup.

## 3. Non-Goals

- Introduce agents.
- Fetch, list, or search introduced skills.
- Support non-Codex skills.
- Define MCP lifecycle initialization behavior.

## 4. Functional Requirements

- The server must accept an introduce-skill request for an existing Codex skill.
- The request must include the skill name for the existing Codex skill.
- The request must include the client workspace path, registered alias, or
  stable workspace slug.
- The request must include the project name the skill is focused on.
- The request must include a human-readable display name.
- The request must include one primary specialty.
- The request must include specialty tags.
- The request may include `scope: "workspace" | "global"`.
- The server must default omitted scope to `workspace`.
- The server must reject requests missing any required field.
- The server must associate the introduced skill with the client-supplied
  workspace when scope is `workspace`.
- The server must associate the introduced skill with shared global skill scope
  when scope is `global`.
- The server must reject a duplicate skill name within the same workspace.
- The server may allow the same skill name to be introduced in different
  workspaces.
- The server may allow a workspace skill and global skill to share the same
  skill name.
- The server must persist accepted skill records in durable storage.
- The server must scope persisted skill records by workspace or global scope.
- The server must prevent one workspace from accessing another workspace's
  introduced skill records.
- Global skill records are intentionally visible from all workspaces.
- Fetching, listing, searching, and routing introduced skills must be handled by
  separate feature specs.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user has an
existing Codex skill and wants to make it available to the Local Orchestration
Router (LOR) catalog for future routing decisions.

## 6. Data Model

Conceptual `IntroducedSkill` fields:

- `workspace`: identifies the client workspace that owns the record.
- `scope`: identifies `workspace` or `global`.
- `skillName`: identifies the existing Codex skill.
- `projectName`: names the project the skill is focused on.
- `displayName`: provides a human-readable name for catalog display.
- `primarySpecialty`: names the skill's primary specialty.
- `specialtyTags`: lists additional specialties or routing tags.
- `createdAt`: records when the skill was introduced.
- `updatedAt`: records when the stored record was last changed, if updates are
  added later.

The feature spec does not require a specific database schema, storage engine, or
persistence implementation.

## 7. Error Handling

- Missing required fields must return a validation error.
- Missing or invalid MCP readiness context must return a session error.
- Duplicate skill names within the same workspace must return a duplicate error.
- Duplicate skill names within global scope must return a duplicate error.
- Durable storage failures must return a storage error and must not report the
  skill as introduced.

## 8. Security and Permissions

- Introduced skill records must be isolated by workspace.
- A user must only be able to introduce records into the requested workspace.
- A user must not be able to see, overwrite, or infer another workspace's
  introduced skill records through duplicate checks or error responses.
- Global skill records are shared intentionally and may be created from any
  workspace context.

## 9. Open Questions

- Should specialty tags be free-form strings or validated against a controlled
  taxonomy?
- Should a future catalog health workflow verify introduced skills without
  blocking introduction?

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
- 2026-07-13: Use the client-supplied workspace as the durable storage scope and
  keep MCP session state as protocol readiness context.
- 2026-07-13: Implement `introduce_skill` as non-blocking registration with
  `mcp_introduction` verification metadata.
- 2026-08-04: Implement `scope: "global"` support so users can directly create
  shared global skills while keeping workspace scope as the default.
