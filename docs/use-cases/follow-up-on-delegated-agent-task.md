# Follow Up On Delegated Agent Task

## 1. Summary

A Codex agent adds follow-up context to a delegated task and later collects the
task result.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

A delegated agent task is already running. The user provides additional
requirements or the current agent discovers missing context. The current agent
adds that context to the delegated task and later asks LOR for the result.

## 4. Flow

1. The current agent has a `taskId` from a delegated task.
2. The user provides follow-up context.
3. The current agent calls `append_agent_context`.
4. LOR stores and forwards the follow-up when supported.
5. The current agent calls `get_agent_task_status`.
6. When complete, the current agent calls `get_agent_task_result`.
7. The current agent summarizes the delegated result to the user.

## 5. Expected Outcome

Delegated work can receive additional context without losing task history, and
the final result can be collected through LOR.

## 6. Related Feature Specs

- [Delegated Agent Task Lifecycle](../feature-specs/delegated-agent-task-lifecycle.md)
- [Agent Task Follow-Up And Result Collection](../feature-specs/agent-task-follow-up-and-result-collection.md)

## 7. Open Questions

- Should follow-up messages support structured attachments in a later version?
