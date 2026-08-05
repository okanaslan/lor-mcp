# Delegated Agent Task Lifecycle

## 1. Summary

Implemented. This tech spec defines the backend model for `send_agent_task`,
`get_agent_task_status`, and `list_active_tasks`.

## 2. Context

LOR currently prepares handoff prompts but does not dispatch them. The
reachability model will distinguish catalog agents from known reachable dispatch
targets. Delegated task lifecycle builds on that model by adding durable task
records and status transitions.

## 3. Proposed Design

Add a `delegated_agent_tasks` table scoped by resolved workspace:

- `taskId`
- `workspace`
- `agentEntryKey`
- `codexSessionId`
- `status`
- `task`
- `context`
- `createdAt`
- `sentAt`
- `updatedAt`
- `completedAt`
- `failureMessage`

Task state transitions:

- `queued` -> `sent`
- `sent` -> `running`
- `running` -> `needs_input`
- `running` -> `completed`
- `running` -> `failed`
- any open state -> `cancelled` if cancellation is later supported

Tool handlers remain thin and delegate dispatch to a Codex-native adapter
boundary when the host runtime provides one. The adapter reports success or
failure; the service records task and reachability updates transactionally where
possible. When the local runtime has no dispatcher, `send_agent_task` creates a
durable `queued` task and returns manual delivery instructions without claiming
that native dispatch happened.

## 4. Verification Plan

- `send_agent_task` creates a task record.
- Dispatch success moves task to `sent` or `running`.
- Dispatch failure records `failed` and updates agent reachability.
- `get_agent_task_status` returns only workspace-local task data.
- `list_active_tasks` excludes completed, failed, and cancelled tasks by
  default.
- Unknown workspace tasks return `not_found`.

## 5. Decision Log

- 2026-08-06: Implement delegated task records as workspace-scoped SQLite data.
- 2026-08-06: Keep Codex-native dispatch behind an adapter boundary.
- 2026-08-06: Queue tasks with manual delivery instructions when no dispatcher
  is configured.
