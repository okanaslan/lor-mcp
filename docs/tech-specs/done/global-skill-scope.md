# Global Skill Scope

## 1. Summary

Implemented. This tech spec defines how LOR adds a shared global scope for
skills while preserving workspace-scoped agents and workspace-local catalog
exports.

## 2. Context

LOR stores catalog records by resolved workspace. Agents remain
workspace-scoped, while skills can also live in a reusable global skill catalog
so common skills can be shared across projects without duplicating metadata in
every workspace.

## 3. Goals

- Add global skill records without adding global agents.
- Expose public scope as `scope: "workspace" | "global"`.
- Keep internal global storage representation hidden from MCP callers.
- Query workspace skills and global skills together for list and match flows.
- Keep workspace exports limited to workspace-local entries.
- Reuse existing skill context, health, update, remove, and local skill sync
  workflows for global skills.

## 4. Non-Goals

- Remote global registries.
- Hosted marketplace behavior.
- Cross-workspace agent sharing.
- Automatic local skill installation.
- Exporting global skills from normal workspace exports.

## 5. Design

Expose scope in the public MCP surface as:

- `workspace`: record belongs to the resolved caller workspace.
- `global`: record belongs to the shared global skill catalog.

The repository layer represents global scope with a reserved internal skill
workspace key. Callers never send or receive that internal value; returned
global skill entries expose `scope: "global"`.

Tool behavior:

- `introduce_skill` accepts optional `scope`; omitted scope means `workspace`.
- `promote_skill_to_global` copies one workspace skill into global scope.
- `list_catalog_entries` includes workspace-local entries and global skills by
  default.
- `find_matching_catalog_entry` scores workspace agents, workspace skills, and
  global skills by default.
- `get_catalog_entry_detail`, `update_catalog_entry`, `remove_catalog_entry`,
  `check_catalog_health`, `propose_skill_update`, `apply_skill_update`,
  `preview_skill_file_sync`, and `apply_skill_file_sync` support global skills.
- `export_catalog` excludes global skills from workspace exports.
- `import_catalog` remains workspace-local unless a future global import mode is
  explicitly added.

Duplicate behavior:

- A workspace skill and global skill may share the same `skillName`.
- Both entries may appear in list and match results.
- Exact detail/update/remove operations should use scope-aware identifiers or
  explicit scope to avoid accidental mutation.
- Duplicate global skill names are rejected with the standard `duplicate_entry`
  error.

## 6. Alternatives Considered

- Reusing a literal user-visible `workspace: "GLOBAL"` value was rejected
  because it leaks internal representation and can collide with real workspace
  aliases.
- Copying global skills into every workspace was rejected because it creates
  duplicate metadata and makes updates harder to keep consistent.
- Supporting global agents was rejected because Codex session IDs are
  workspace/task specific and not safely portable.

## 7. Implementation Notes

- Add shared `CatalogScope` types before changing tool handlers.
- Keep existing workspace alias resolution for workspace entries only.
- Add repository queries that can fetch workspace skills plus global skills in
  one call.
- Keep global skill removal explicitly scoped to avoid deleting shared records
  when the caller meant the workspace-local duplicate.
- Ensure local skill sync resolves the same `skillName/SKILL.md` path regardless
  of catalog scope.
- Preserve response envelope behavior and add scope fields to returned skill
  payloads where useful.

## 8. Risks and Tradeoffs

- Including global skills by default may increase match result noise.
- Same-name workspace and global skills can confuse callers unless scope is
  visible in results.
- Allowing global skills to be managed from any workspace is convenient but
  makes remove/update operations broader than normal workspace edits.
- Excluding global skills from workspace exports avoids accidental shared-state
  backups but requires a future explicit global export if needed.

## 9. Verification Plan

- Direct global skill introduction creates a global skill.
- Workspace skill promotion creates a global copy and keeps the workspace skill.
- Agents reject global scope.
- List includes global skills by default.
- Match includes global skills by default.
- Workspace and global skills with the same `skillName` can both be returned.
- Detail/update/remove can target global skills without mutating workspace-local
  duplicates.
- Skill context proposals and local skill sync work for global skills.
- Workspace export excludes global skills.
- Workspace import remains workspace-local.

## 10. V1 Decisions

- Global removal does not add `confirm: true` in v1, but ambiguous same-name
  workspace/global skills require explicit scope.
- Duplicate global promotion fails with `duplicate_entry`.
- List and match include global skills by default; there is no `includeGlobal`
  opt-out in v1.

## 11. Decision Log

- 2026-08-04: Model global catalog behavior as skills-only shared scope.
- 2026-08-04: Expose `scope: "global"` publicly and keep internal storage
  representation private.
- 2026-08-04: Include global skills in list and match by default.
- 2026-08-04: Keep workspace exports workspace-local.
- 2026-08-04: Implement with a reserved internal storage workspace for global
  skills and public `scope` fields on returned entries/candidates.
