# Agent Task Follow-Up And Result Collection

## 1. Summary

Implemented. This tech spec defines message and result storage for delegated
agent tasks after `send_agent_task` exists.

## 2. Context

Delegated tasks need more than initial dispatch. Callers must be able to append
instructions, inspect task state, and collect final results without losing the
history of what was sent.

## 3. Proposed Design

Add `delegated_agent_task_messages`:

- `messageId`
- `taskId`
- `workspace`
- `direction`
- `message`
- `createdAt`

Add result fields to `delegated_agent_tasks` or a separate
`delegated_agent_task_results` table:

- `taskId`
- `workspace`
- `summary`
- `result`
- `completedAt`

`append_agent_context` stores a message and returns manual delivery metadata
when no host adapter is available. `get_agent_task_result` returns current task
status until a result is recorded, then returns summary/result metadata.

## 4. Verification Plan

- Follow-up messages persist in order.
- Closed tasks reject follow-up.
- Results are only visible within the owning workspace.
- Incomplete tasks return status without a fake result.
- Raw result payloads are not written to operational logs.

## 5. Decision Log

- 2026-08-06: Plan follow-up and result collection as task-scoped message/result
  records.
- 2026-08-06: Implement task-scoped follow-up messages and result retrieval.
