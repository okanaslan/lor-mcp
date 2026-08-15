# Delegate Task To Reachable Agent

## 1. Summary

Historical/internal V2 note. LOR no longer exposes public delegated-task tools
for normal use; task delivery belongs to Codex-native behavior outside LOR.

## 2. Actor

Codex user.

## 3. Scenario

The user wants to split work across Codex chats. In V2, the current agent uses
LOR to prepare context, skill metadata, subagent profiles, and a starter prompt,
then the user or Codex-native workflow owns the actual chat creation and
follow-up.

## 4. Flow

1. The user gives the current agent a task.
2. The current agent calls `find_matching_skill` and `find_matching_subagent`.
3. LOR returns relevant context and prompt profiles.
4. The current agent calls `generate_agent_prompt` when a fresh Codex chat is
   useful.
5. The user or Codex-native workflow creates and manages the new task.
6. The current agent does not claim that LOR dispatched or tracked the work.

## 5. Expected Outcome

The user gets a ready-to-use manual prompt and clear next steps without LOR
pretending to own Codex task dispatch or tracking.

## 6. Related Feature Specs

- [Agent Reachability And Dispatch Model](../feature-specs/agent-reachability-and-dispatch-model.md)
- [Delegated Agent Task Lifecycle](../feature-specs/delegated-agent-task-lifecycle.md)
- [V2 Tool Surface Simplification](../feature-specs/v2-tool-surface-simplification.md)

## 7. Open Questions

None for the public V2 surface.
