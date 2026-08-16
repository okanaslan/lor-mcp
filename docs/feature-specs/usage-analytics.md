# Usage Analytics

## 1. Summary

Implemented for V2. This feature adds local aggregate usage analytics for LOR
skills, subagents, and workspace notes. LOR records how often visible entries
are returned from list and match tools, and how often their detail tools are
used, so users can improve catalog quality over time.

## 2. Goals

- Track real usage of registered skills, subagent profiles, and workspace notes.
- Help users identify useful, stale, or under-described entries.
- Keep analytics local, deterministic, and workspace-aware.
- Avoid storing task text, prompt text, note bodies, or other sensitive content.
- Expose usage through a read-only MCP tool that gives clear next actions.

## 3. Non-Goals

- Track user identity or cross-device user analytics.
- Send analytics to a remote service.
- Store raw task prompts, match queries, note bodies, or generated prompts.
- Rank matching results by usage in v1.
- Automatically remove or rewrite entries based on usage.
- Track hidden registered-agent or delegated-task compatibility behavior.

## 4. Functional Requirements

- LOR must record aggregate counters for public V2 usage of:
  - skills
  - subagent profiles
  - workspace notes
- LOR must count when an entry is returned by a list tool:
  - `list_skills`
  - `list_subagents`
  - `list_workspace_notes`
- LOR must count when an entry is returned by a match tool:
  - `find_matching_skill`
  - `find_matching_subagent`
  - `find_matching_workspace_note`
- LOR must count when an entry is retrieved by a detail tool:
  - `get_skill_detail`
  - `get_subagent_detail`
  - `get_workspace_note`
- LOR must expose a read-only `get_usage_analytics` tool.
- `get_usage_analytics` input must require `workspace`.
- `get_usage_analytics` input may filter by `entryType`, `scope`, `entryKey`,
  and `projectName` when those fields apply.
- `get_usage_analytics` must return:
  - resolved workspace
  - checked timestamp
  - applied filters
  - summary totals by entry type and operation
  - per-entry usage rows
  - recommended next actions
- Skill and subagent analytics must distinguish `workspace` and `global` scope.
- Global skill and subagent usage must be attributed to the caller workspace
  while preserving the entry's global scope.
- Workspace note analytics must remain workspace-scoped only.
- Analytics writes must not change catalog entry metadata, note content, or
  matching scores in v1.

## 5. User Stories / Use Cases

- [Inspect LOR Usage Analytics](../use-cases/inspect-lor-usage-analytics.md)

## 6. Data Model

Conceptual `UsageCounter` fields:

- `workspace`
- `entryType`: `skill`, `subagent`, or `note`
- `entryScope`: `workspace` or `global`
- `entryKey`
- `operation`: `listed`, `matched`, or `detailed`
- `count`
- `firstSeenAt`
- `lastSeenAt`

Conceptual `UsageAnalyticsReport` fields:

- `workspace`
- `checkedAt`
- `filters`
- `summary`
- `entries`
- `recommendedActions`

## 7. Error Handling

- Missing or invalid `workspace` must return `validation_error`.
- Invalid filter combinations must return `validation_error`.
- Storage failures while recording usage must not hide the original successful
  list, match, or detail result; they should be logged and surfaced later
  through diagnostics if needed.
- Storage failures while reading analytics must return `storage_error`.
- Empty analytics must return `status: ok` with zero counts and setup guidance,
  not `not_found`.

## 8. Security and Permissions

- Usage analytics must not store raw prompts, task text, match queries, note
  bodies, generated prompts, absolute DB paths, stack traces, or secrets.
- Reports must not reveal workspace-local entries from other workspaces.
- Global skill and subagent analytics may be reported for the caller workspace
  only when those global entries were visible to that workspace.
- Tool text output should summarize usage and next actions; agents should rely
  on structured content for exact counters.

## 9. Open Questions

- Should future versions support configurable retention or counter resets?
- Should usage affect ranking after enough data exists, or should it remain
  maintenance-only?
- Should health reports include a compact usage summary once analytics exists?

## 10. Decision Log

- 2026-08-16: Plan analytics as local aggregate counters instead of remote
  telemetry.
- 2026-08-16: Track skill, subagent, and workspace note list/match/detail usage
  because those are the V2 objects users actively maintain.
- 2026-08-16: Do not store raw query, prompt, task, or note body content.
- 2026-08-16: Add `get_usage_analytics` as the read-only reporting surface.
