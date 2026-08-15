# Agent Task Follow-Up And Result Collection

## 1. Summary

Implemented internally in 2.0.0, then removed from the codebase and the normal
public V2 MCP surface. This historical feature defined how callers added context
to an already delegated agent task and collected its final or intermediate
result.

The public V2 direction keeps follow-up and result collection in Codex-native
task workflows outside LOR.

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

- `append_agent_context` and `get_agent_task_result` are no longer implemented
  or registered.
- LOR must not store delegated task follow-up messages or delegated task
  results.
- Codex-native task workflows own follow-up and result collection.

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
- 2026-08-15: Remove follow-up and result tools from the normal public V2
  surface; Codex-native task workflows own follow-up and result collection.
- 2026-08-15: Delete follow-up/result service, repository, schema, and test
  code.
