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
- LOR must count successful match requests for skills, subagents, and workspace
  notes, including requests that return no recommendations.
- LOR must report request-level routing outcomes:
  - match request count
  - no-match request count
  - no-match rate
  - recommendation count
  - average recommendations per successful request
- LOR must compare the current visible catalog with the selected period's
  counters and report coverage:
  - registered entries
  - opened entries with recorded detail reads
  - entries with no recorded detail reads
- LOR must return an opaque `recommendationId` from match tools and accept it on
  the corresponding detail tools so opened recommendations can be attributed
  without storing raw queries or prompt text.
- LOR must report recommendation attribution:
  - impressions for entries returned by match tools
  - attributed opens when a detail read includes a valid recommendation id
  - attribution rate
  - detail opens without a valid recommendation id
- LOR must count when an entry is retrieved by a detail tool:
  - `get_skill_detail`
  - `get_subagent_detail`
  - `get_workspace_note`
- LOR must expose a read-only `get_usage_analytics` tool.
- `get_usage_analytics` input must require `workspace`.
- `get_usage_analytics` input may filter by `entryType`, `scope`, `entryKey`,
  and resolved `projectName` when those fields apply.
- `get_usage_analytics` input may choose `period: "lifetime"`,
  `period: "last_7_days"`, or `period: "last_30_days"`. If omitted, the period
  defaults to `lifetime`.
- `get_usage_analytics` input may sort rows by `listed`, `matched`, or
  `detailed` counters in descending order. If omitted, the legacy deterministic
  type/scope/project/key order is preserved.
- `get_usage_analytics` must return:
  - resolved workspace
  - checked timestamp
  - period and explicit period bounds for recent daily reports
  - metric definitions
  - applied filters
  - summary totals by entry type and operation
  - request-level routing outcomes by entry type
  - coverage for current visible catalog entries
  - recommendation attribution summaries
  - per-entry usage rows
  - recommended next actions
- Usage rows must be grouped by stable entry identity: workspace, entry type,
  scope, and entry key. `projectName` is mutable metadata and must not split
  counters.
- `lastDetailedAt` must be included per row only when there is a recorded detail
  read for that entry.
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
- `period`: `lifetime`
- `filters`
- `metricDefinitions`
- `summary`
- `routingOutcomes`
- `coverage`
- `attribution`
- `entries`
- `recommendedActions`

`lifetime` means the retained local counter history since usage tracking was
enabled. It does not include activity before tracking existed. Counters record
tool returns and detail reads; repeated calls are counted separately and are not
unique tasks, executions, or proof that returned guidance was applied.

`last_7_days` and `last_30_days` use UTC calendar days, include the current
partial UTC day, and return explicit `periodStart` and `periodEnd` bounds. Daily
reports are based only on daily counters recorded after daily tracking was
introduced; historical lifetime counters are preserved but are not converted
into fabricated daily history.

`projectName` filtering applies to the resolved per-entry metadata selected from
recorded usage rows, not to the counter identity itself. If an entry's project
metadata changes, its counters remain grouped under the same stable entry key.

Reports include current visible catalog entries with zero counters as coverage
rows, plus historical rows with recorded usage. A missing entry means it is not
visible in the current catalog and has no retained list, match, or detail
counter for the requested workspace/filter, not proof that the underlying
catalog entry is unused forever.

Routing outcomes are request-level aggregates by workspace, entry type, and
period. They do not apply `entryKey`, `scope`, or `projectName` filters because
no-match requests and whole-result recommendation counts cannot be assigned to a
single catalog entry. Failed match requests do not increment outcome counters.

Coverage is based on the current visible catalog after resolving workspace and
global scope rules. Current entries with no counters are included in report rows
with zero counts. Historical rows for deleted entries remain visible as usage
history but are marked as not currently registered and excluded from coverage.
Project filters are applied after usage rows are merged with current catalog
metadata, so renamed entries are filtered by their current project name.

Recommendation attribution is local and aggregate. Match responses may include
`recommendationId` plus manual guidance to pass that id to the matching detail
tool. Valid ids expire after 30 days. An attributed open is counted once per
recommended entry and remains attached to the UTC day the recommendation was
shown, even if the detail read happens later. Repeated detail reads still
increment normal `detailed` counters but do not create extra attributed opens.
Missing, invalid, or expired ids are counted separately as unattributed detail
opens by the day of the detail read.

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
- 2026-08-16: Add opaque recommendation ids for aggregate match-to-detail
  attribution without storing raw task or query content.
