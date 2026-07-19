# Register Workspace Alias

## 1. Summary

Implemented for v1. `register_workspace_alias` maps an alternate workspace
string to a canonical workspace so equivalent client inputs use the same
workspace catalog.

## 2. Goals

- Prevent split catalogs caused by path, trailing-slash, or folder-name
  workspace variants.
- Keep catalog isolation workspace-scoped and caller-driven.
- Let callers explicitly repair historical or ambiguous workspace names.
- Require confirmation before reassigning an existing alias to another canonical
  workspace.

## 3. Non-Goals

- Merge, rewrite, or delete historical catalog rows.
- Infer arbitrary folder names from unrelated paths.
- Depend on server cwd or static server workspace configuration.
- Add global catalog clearing or cross-workspace search.

## 4. Functional Requirements

- The tool name is `register_workspace_alias`.
- Input:
  - `workspace`: canonical workspace, required, trimmed, non-empty.
  - `alias`: alternate workspace string, required, trimmed, non-empty.
  - `confirm`: optional literal `true`, required only when reassigning an alias
    that already points to another canonical workspace.
- Output data:
  - `workspace`: resolved canonical workspace.
  - `alias`: normalized alias.
  - `created`: whether a new alias row was created.
  - `reassigned`: whether an existing alias was reassigned.
- Aliasing a workspace to itself is valid and idempotent.
- A conflicting alias without `confirm: true` returns `validation_error`.
- All catalog tools resolve `workspace` through aliases before reading or
  writing catalog entries.

## 5. Workspace Normalization

Workspace normalization must:

- Trim whitespace.
- Collapse repeated path separators for path-shaped values.
- Remove trailing slashes from path-shaped values.
- Preserve case.
- Preserve non-path slugs.
- Avoid globally mapping arbitrary folder names to paths.

When an absolute path workspace is used, LOR should ensure a self-alias for that
path. If the path basename is unclaimed, LOR should also create a basename
alias. If the basename is already claimed, LOR must not auto-reassign it.

## 6. User Flow

A caller introduces entries with an absolute workspace path:

```json
{
  "workspace": "/Users/me/project",
  "codexSessionId": "session-1",
  "projectName": "project",
  "displayName": "Backend Agent",
  "primarySpecialty": "Backend implementation",
  "specialtyTags": ["backend"]
}
```

Later, another caller can list the same catalog with the folder-name alias when
that alias is registered or safely auto-created:

```json
{
  "workspace": "project"
}
```

If the alias is ambiguous or historically split, the caller can register it
explicitly:

```json
{
  "workspace": "/Users/me/project",
  "alias": "project"
}
```

## 7. Error Handling

- Missing or empty `workspace` returns `validation_error`.
- Missing or empty `alias` returns `validation_error`.
- `confirm` values other than literal `true` return `validation_error`.
- Reassigning a claimed alias without `confirm: true` returns
  `validation_error`.
- Storage failures return `storage_error`.

## 8. Decision Log

- 2026-07-19: Add workspace alias registration and canonical workspace
  resolution to prevent split catalogs for equivalent workspace inputs.
