# Workspace Diagnostics

## 1. Summary

Implemented. This tech spec defines `get_workspace_diagnostics`, a read-only
tool for workspace resolution and sanitized setup visibility.

## 2. Context

Usage logs show multiple workspace values for the same project, including full
paths and aliases. LOR already resolves aliases, but users need a direct way to
inspect what happened without listing catalog entries.

## 3. Proposed Design

`get_workspace_diagnostics` returns:

- `inputWorkspace`
- `resolvedWorkspace`
- `aliases`
- `catalogCounts`
- `storageStatus`
- `runtimeStatus`
- `checkedAt`

Storage status should be sanitized:

- configured/reachable boolean
- schema version if safe
- no absolute DB path
- no environment variable values

Runtime status may include active session count when available, but should not
return active session IDs by default.

The current implementation returns sanitized runtime status with
`transport:
"mcp"` and does not expose HTTP session IDs or counts.

## 4. Verification Plan

- Path and alias inputs resolve to the expected canonical workspace.
- Diagnostics include counts without full entries.
- Diagnostics do not expose DB path or env values.
- Missing workspace returns `validation_error`.
- Storage failures return sanitized setup status.

## 5. Decision Log

- 2026-08-06: Implement `get_workspace_diagnostics` with alias lookup, safe
  schema version reporting, catalog counts, and sanitized closed-storage
  fallback behavior.
- 2026-08-06: Plan workspace diagnostics as read-only resolution and setup
  reporting.
