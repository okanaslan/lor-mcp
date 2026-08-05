# Inspect Workspace Diagnostics

## 1. Summary

A Codex user asks LOR to explain how a workspace value resolves and whether the
local catalog setup is healthy enough for routing.

## 2. Actor

Codex user.

## 3. Scenario

The same project has been referenced by multiple workspace values, such as a
full path, another cloned path, or a short alias. The user wants to understand
which canonical workspace LOR is using before catalog operations continue.

## 4. Flow

1. The user asks the current agent to inspect LOR workspace diagnostics.
2. The current agent calls `get_workspace_diagnostics`.
3. LOR resolves the workspace input.
4. LOR returns the resolved workspace, matching aliases, catalog counts, and
   sanitized runtime/storage status.
5. The current agent reports whether the workspace appears correctly resolved.

## 5. Expected Outcome

The user can debug workspace alias and setup issues without listing or exposing
full catalog entries.

## 6. Related Feature Specs

- [Workspace Diagnostics](../feature-specs/workspace-diagnostics.md)
- [Register Workspace Alias](../feature-specs/register-workspace-alias.md)

## 7. Open Questions

- Should diagnostics suggest alias repairs automatically?
