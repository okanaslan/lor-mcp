# Remember Workspace Note

## 1. Summary

A Codex agent stores a concise workspace note for future coordination.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

The user wants LOR to remember a branch plan, review summary, migration note, or
reapply instruction that is not a catalog entry and not tied to one delegated
task.

## 4. Flow

1. The user asks the current agent to remember a workspace-specific note.
2. The current agent calls `remember_workspace_note`.
3. LOR stores the note under the resolved workspace.
4. Later, another agent calls `list_workspace_notes`.
5. The agent fetches the relevant note with `get_workspace_note`.

## 5. Expected Outcome

Small coordination context survives across Codex sessions without polluting
agent, skill, subagent, or delegated task records.

## 6. Related Feature Specs

- [Workspace Memory Primitives](../feature-specs/workspace-memory-primitives.md)
- [Workspace Memory Primitives](../tech-specs/done/workspace-memory-primitives.md)

## 7. Open Questions

- Should notes support updates, or should the first version require remove plus
  remember?
