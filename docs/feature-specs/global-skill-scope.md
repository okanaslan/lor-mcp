# Global Skill Scope

## 1. Summary

Implemented. This feature adds a shared global catalog scope for skills so
useful Codex skills can be reused across all workspaces. The public contract
exposes this as `scope: "global"` for skills, while agents remain
workspace-scoped only.

## 2. Goals

- Let users create global skill catalog entries directly.
- Let users promote an existing workspace skill into global scope.
- Include global skills in listing and matching by default.
- Support the same stored skill metadata, skill context updates, health checks,
  and local `SKILL.md` sync behavior for global skills.
- Keep agents unavailable in global scope.

## 3. Non-Goals

- Support global agents.
- Define global subagent scope; that is covered by the planned Subagent
  Suggestions feature.
- Copy or move Codex agent sessions between workspaces.
- Export global skills as part of a normal workspace export.
- Create a remote public marketplace or hosted registry.
- Automatically install missing local skills.

## 4. Functional Requirements

- Skill-facing tools must expose skill scope as `scope: "workspace" | "global"`.
- The internal global storage representation must be hidden from callers.
- `introduce_skill` must allow direct global skill creation with
  `scope: "global"`.
- `introduce_skill` must default to workspace scope when `scope` is omitted.
- The server must expose `promote_skill_to_global`.
- `promote_skill_to_global` must copy a workspace skill's metadata and
  `skillContext` into a new global skill without removing the workspace skill.
- Agents must reject `scope: "global"` and must never be promoted globally.
- `list_catalog_entries` must include global skills by default.
- `find_matching_catalog_entry` must include global skills by default.
- Workspace skills and global skills with the same `skillName` may coexist and
  may both appear in listing, detail, matching, health, and sync workflows.
- Global skills must be manageable from any workspace context.
- Updating, removing, health-checking, proposing skill context updates, applying
  skill context updates, previewing local skill sync, and applying local skill
  sync must support global skills.
- Workspace exports must include only workspace-local entries and must exclude
  global skills.
- Workspace imports must remain workspace-local unless a later global import
  behavior is explicitly added.

## 5. User Stories / Use Cases

- [Share Skill Across Workspaces](../use-cases/share-skill-across-workspaces.md)

## 6. Data Model

Conceptual `CatalogScope` values:

- `workspace`: the entry belongs to the requested resolved workspace.
- `global`: the entry belongs to the shared skill scope.

Conceptual global skill fields match workspace skill fields:

- `scope`: `global`
- `skillName`
- `projectName`
- `displayName`
- `primarySpecialty`
- `specialtyTags`
- optional `skillContext`
- verification metadata
- `createdAt`
- `updatedAt`

Global skill entries must have stable identifiers that do not collide with
workspace skill identifiers in caller-facing results.

## 7. Error Handling

- `scope: "global"` on agent tools must return a validation error.
- Promoting a missing workspace skill must return `not_found`.
- Promoting a workspace skill that already exists globally must return the
  standard `duplicate_entry` error.
- Ambiguous detail/update/remove targets must require scope-aware input rather
  than silently choosing between a workspace and global skill with the same
  `skillName`.
- Storage failures must return the standard `storage_error` envelope.

## 8. Security and Permissions

- Global skills are intentionally visible across all workspaces.
- Global skill operations must not reveal workspace-local skills from unrelated
  workspaces.
- Workspace-scoped agents must remain isolated and must never be returned from
  global scope.
- Removing a global skill is a broad action and should require explicit scope in
  the request shape.

## 9. V1 Decisions

- Direct global skill creation requires explicit `scope: "global"` and no extra
  confirmation flag.
- `promote_skill_to_global` fails duplicate global skill names with the standard
  `duplicate_entry` error.
- List and match return scope on entries/candidates instead of visually grouping
  global skills separately.
- Global skill removal requires explicit `scope: "global"` when a workspace
  skill with the same name exists. `remove_catalog_entry` does not add a
  separate confirmation flag in v1.

## 10. Decision Log

- 2026-08-04: Add global scope for skills only; agents remain workspace-scoped.
- 2026-08-04: Expose public scope as `scope: "global"` while hiding internal
  storage representation.
- 2026-08-04: Allow both direct global skill creation and promotion from a
  workspace skill.
- 2026-08-04: Include global skills in list and match by default.
- 2026-08-04: Keep workspace exports workspace-local and exclude global skills.
- 2026-08-04: Implement global skill scope in v1 with duplicate promotion
  failure and scope-aware exact skill operations.
- 2026-08-04: Keep this spec skill-only; global subagent behavior is tracked
  separately in Subagent Suggestions.
