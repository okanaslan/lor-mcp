# Delegate Task To Reachable Agent

## 1. Summary

A Codex user asks the current agent to delegate work to a registered LOR agent
that is known reachable.

## 2. Actor

Codex user.

## 3. Scenario

The current agent finds a strong registered agent match for a task. The target
agent has reachability metadata that permits dispatch, so the current agent asks
LOR to send and track the delegated work.

## 4. Flow

1. The user gives the current agent a task.
2. The current agent calls `find_matching_catalog_entry`.
3. LOR returns a reachable agent candidate.
4. The current agent calls `send_agent_task`.
5. LOR creates a delegated task record and dispatches through Codex-native
   tooling.
6. LOR returns `taskId` and initial task status.
7. The current agent tracks status with `get_agent_task_status` or
   `list_active_tasks`.

## 5. Expected Outcome

The user can delegate work through LOR without manually copying a handoff
prompt, and the delegated task remains trackable.

## 6. Related Feature Specs

- [Agent Reachability And Dispatch Model](../feature-specs/agent-reachability-and-dispatch-model.md)
- [Delegated Agent Task Lifecycle](../feature-specs/delegated-agent-task-lifecycle.md)

## 7. Open Questions

- Should dispatch to `unknown` agents require an explicit user approval flag?
