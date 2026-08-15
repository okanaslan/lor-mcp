# Follow Up On Delegated Agent Task

## 1. Summary

Historical/internal V2 note. LOR no longer exposes public follow-up or result
collection tools for normal use.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

A Codex task is already running outside LOR. The user provides additional
requirements or the current agent discovers missing context. In V2, the current
agent uses Codex-native task behavior for follow-up and may use LOR workspace
notes only for durable local memory.

## 4. Flow

1. The current agent has an external Codex task or manual coordination context.
2. The user provides follow-up context.
3. The current agent sends follow-up through Codex-native task behavior, not
   LOR.
4. If the context should be remembered for the workspace, the current agent
   calls `remember_workspace_note`.
5. The current agent summarizes any result received through the external Codex
   workflow.

## 5. Expected Outcome

Follow-up stays in the owning Codex workflow, while durable workspace notes can
capture useful summaries without turning LOR into a task tracker.

## 6. Related Feature Specs

- [Delegated Agent Task Lifecycle](../feature-specs/delegated-agent-task-lifecycle.md)
- [Agent Task Follow-Up And Result Collection](../feature-specs/agent-task-follow-up-and-result-collection.md)
- [Workspace Memory Primitives](../feature-specs/workspace-memory-primitives.md)
- [V2 Tool Surface Simplification](../feature-specs/v2-tool-surface-simplification.md)

## 7. Open Questions

None for the public V2 surface.
