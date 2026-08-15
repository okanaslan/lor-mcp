# Agent Task Follow-Up And Result Collection

## 1. Summary

Implemented internally in 2.0.0, then removed from the normal public V2 MCP
surface. This tech spec defines message and result storage for delegated agent
tasks after `send_agent_task` exists.

## 2. Context

Delegated tasks needed more than initial dispatch in the internal compatibility
model. In the public V2 direction, callers append instructions, inspect task
state, and collect final results through Codex-native task workflows instead of
LOR.

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
- 2026-08-15: Remove follow-up and result tools from the normal public V2
  surface.
