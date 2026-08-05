# Workspace Diagnostics

## 1. Summary

Implemented. This feature adds a read-only diagnostics tool that explains how
LOR resolved a workspace input and summarizes catalog/runtime setup without
exposing catalog data from unrelated workspaces.

## 2. Goals

- Help users understand path, alias, and canonical workspace resolution.
- Report current workspace catalog counts.
- Report configured local storage and runtime health in sanitized form.
- Make setup/debugging easier when multiple workspace identifiers are used.

## 3. Non-Goals

- Mutate workspace aliases.
- List full catalog entries.
- Reveal database paths, secrets, or unrelated workspace data.
- Replace `check_catalog_health`.

## 4. Functional Requirements

- The server must expose `get_workspace_diagnostics`.
- The request must require `workspace`.
- The response must include the input workspace value and resolved workspace.
- The response must include matching aliases for the resolved workspace.
- The response must include catalog counts by entry type.
- The response must include whether storage is configured and reachable.
- The response may include active HTTP session count when available.
- The response must not expose full catalog entries.

## 5. User Stories / Use Cases

- [Inspect Workspace Diagnostics](../use-cases/inspect-workspace-diagnostics.md)

## 6. Data Model

Conceptual `WorkspaceDiagnostics` fields:

- `inputWorkspace`
- `resolvedWorkspace`
- `aliases`
- `catalogCounts`
- `storageStatus`
- `runtimeStatus`
- `checkedAt`

## 7. Error Handling

- Missing workspace must return `validation_error`.
- Storage read failures must return sanitized diagnostics with setup/storage
  status rather than hidden stack traces.

## 8. Security and Permissions

- Diagnostics must not expose catalog entries from unrelated workspaces.
- Diagnostics must not reveal absolute database paths or environment variable
  values.
- Alias data must only describe the resolved workspace.

## 9. Open Questions

- Should diagnostics include active MCP session IDs, or only counts?
- Should diagnostics include suggested alias repair commands?

## 10. Decision Log

- 2026-08-06: Implement `get_workspace_diagnostics` with sanitized storage
  status, aliases for the resolved workspace, and catalog counts only.
- 2026-08-06: Plan workspace diagnostics as read-only setup and resolution
  reporting, separate from catalog health.
