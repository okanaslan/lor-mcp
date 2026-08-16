# Inspect LOR Usage Analytics

## 1. Summary

A Codex user wants to understand which LOR skills, subagents, and workspace
notes are actually being used so they can improve weak metadata and remove stale
entries.

## 2. Actor

Codex user.

## 3. Scenario

The workspace has many registered skills, subagents, and notes. Some entries are
frequently listed, matched, or opened in detail, while others may never be used.
The user asks the current Codex agent to inspect LOR usage before deciding what
to improve.

## 4. Flow

1. The user asks the current agent to inspect LOR usage analytics for the
   current workspace.
2. The current agent calls `get_usage_analytics` with the repository workspace.
3. LOR resolves the workspace and reads aggregate usage counters.
4. LOR returns summary totals and per-entry counters for skills, subagents, and
   workspace notes.
5. The current agent identifies heavily used entries, unused entries, and
   entries that are often matched but rarely opened in detail.
6. The current agent recommends follow-up actions, such as improving skill
   context, adding subagent profiles, pruning stale notes, or leaving healthy
   entries alone.

## 5. Expected Outcome

The user can make catalog maintenance decisions from observed LOR usage instead
of guessing which skills, subagents, or notes matter.

## 6. Related Feature Specs

- [Usage Analytics](../feature-specs/usage-analytics.md)
- [Workspace Diagnostics](../feature-specs/workspace-diagnostics.md)
- [V2 Skill And Subagent Coverage Health](../feature-specs/v2-skill-and-subagent-coverage-health.md)
- [Workspace Memory Primitives](../feature-specs/workspace-memory-primitives.md)
- [Registered Skill Context Updates](../feature-specs/registered-skill-context-updates.md)

## 7. Open Questions

- Should future versions support resetting counters after a cleanup cycle?
- Should diagnostics include only a small analytics summary, or should all usage
  analytics remain behind `get_usage_analytics`?
