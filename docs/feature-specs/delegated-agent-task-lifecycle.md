# Delegated Agent Task Lifecycle

## 1. Summary

Implemented internally in 2.0.0, then removed from the normal public V2 MCP
surface. This feature defines how LOR creates and tracks delegated work sent to
a reachable registered Codex agent.

The public V2 direction no longer makes LOR responsible for delegated task
dispatch, status tracking, follow-up, or result collection.

## 2. Goals

- Add a task record for work delegated to a registered agent.
- Dispatch work only to agents that are reachable or explicitly allowed by the
  future dispatch rules.
- Track delegated task status from creation through completion or failure.
- Keep delegated tasks scoped to the requested workspace.
- Preserve enough task metadata for later follow-up and result collection.

## 3. Non-Goals

- Replace Codex-native task execution.
- Dispatch to skills or subagent profiles.
- Add workspace memory notes.
- Implement remote queue infrastructure.
- Hide manual handoff flows.

## 4. Functional Requirements

- The internal compatibility implementation exposed `send_agent_task` outside
  the normal public V2 surface.
- `send_agent_task` required `workspace`, `agentEntryKey`, and `task`.
- `send_agent_task` accepted optional `context`.
- The target must be a registered active agent in the requested workspace.
- The target must not be known unreachable.
- The server must create a durable delegated task record before or during
  dispatch.
- The server must update the task status when Codex-native dispatch succeeds or
  fails.
- If no Codex-native dispatcher is configured in the host runtime, the server
  must create a queued task and return manual delivery instructions without
  claiming dispatch happened.
- The server must update agent reachability metadata from dispatch outcomes.
- The internal compatibility implementation exposed `get_agent_task_status` and
  `list_active_tasks` outside the normal public V2 surface.
- Delegated task records must never cross workspace boundaries.

## 5. User Stories / Use Cases

- [Delegate Task To Reachable Agent](../use-cases/delegate-task-to-reachable-agent.md)

## 6. Data Model

Conceptual `DelegatedAgentTask` fields:

- `taskId`
- `workspace`
- `agentEntryKey`
- `codexSessionId`
- `status`: `queued`, `sent`, `running`, `needs_input`, `completed`, `failed`,
  or `cancelled`.
- `task`
- `context`
- `createdAt`
- `sentAt`
- `updatedAt`
- `completedAt`
- `failureMessage`

## 7. Error Handling

- Missing required input must return `validation_error`.
- Missing agents must return `not_found`.
- Retired, unreachable, or unsupported agents must return a dispatch error.
- Codex-native dispatch failure must update task and reachability metadata.
- Storage failures must return `storage_error`.

## 8. Security and Permissions

- Task records must be workspace-scoped.
- Dispatch responses must not expose hidden Codex-native internals.
- Failure details must be sanitized before storage and response.
- Task listing must not reveal tasks from other workspaces.

## 9. Open Questions

- Should `send_agent_task` allow explicit dispatch to `unknown` agents?
- Should delegated tasks support cancellation in the first implementation?
- Should task status be updated by polling or only by native task callbacks?

## 10. Decision Log

- 2026-08-06: Implement delegated tasks as durable records scoped by workspace.
- 2026-08-06: Require the reachability model before dispatch lifecycle tools.
- 2026-08-06: Dispatch targets are registered agents identified by
  `codexSessionId`.
- 2026-08-06: Keep Codex-native delivery behind an adapter boundary; the local
  runtime queues tasks with manual delivery instructions when no dispatcher is
  configured.
- 2026-08-15: Remove delegated-task tools from the normal public V2 surface;
  Codex-native task behavior owns dispatch and tracking.
