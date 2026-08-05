# Agent Task Follow-Up And Result Collection

## 1. Summary

Implemented. This feature defines how callers add context to an already
delegated agent task and collect its final or intermediate result.

## 2. Goals

- Let callers append follow-up instructions or missing context to delegated
  tasks.
- Collect task results through LOR after Codex-native execution completes.
- Preserve follow-up and result history with the delegated task record.
- Keep follow-up and result access workspace-scoped.

## 3. Non-Goals

- Create the initial delegated task.
- Replace the delegated task lifecycle state machine.
- Add chat-style multi-agent discussion rooms.
- Store general workspace notes unrelated to a delegated task.

## 4. Functional Requirements

- The server must expose `append_agent_context`.
- `append_agent_context` must require `workspace`, `taskId`, and `message`.
- The server must reject follow-up for completed, failed, cancelled, or missing
  tasks.
- The server must send follow-up context through the Codex-native task channel
  when supported.
- The server must store every accepted follow-up message.
- The server must expose `get_agent_task_result`.
- `get_agent_task_result` must return result metadata when the task is
  completed.
- `get_agent_task_result` must return current status when no result is available
  yet.

## 5. User Stories / Use Cases

- [Follow Up On Delegated Agent Task](../use-cases/follow-up-on-delegated-agent-task.md)

## 6. Data Model

Conceptual `DelegatedTaskMessage` fields:

- `messageId`
- `taskId`
- `workspace`
- `direction`: `caller_to_agent` or `agent_to_caller`.
- `message`
- `createdAt`

Conceptual result fields:

- `taskId`
- `status`
- `summary`
- `result`
- `completedAt`

## 7. Error Handling

- Missing input must return `validation_error`.
- Missing delegated tasks must return `not_found`.
- Closed tasks must reject follow-up with a stable task-state error.
- Dispatch-channel failures must be sanitized and recorded.

## 8. Security and Permissions

- Follow-up and result access must be scoped to the requested workspace.
- Result data may contain user-authored or agent-authored content and must not
  be logged as raw request data.
- Errors must not reveal delegated tasks from other workspaces.

## 9. Open Questions

- Should result collection store full task output or only a summary plus
  optional raw payload?
- Should follow-up messages support structured attachments later?

## 10. Decision Log

- 2026-08-06: Split follow-up and result collection from initial task dispatch
  so the lifecycle model stays clear.
- 2026-08-06: Implement durable follow-up messages and result retrieval, with
  status-only responses while no result is recorded.
