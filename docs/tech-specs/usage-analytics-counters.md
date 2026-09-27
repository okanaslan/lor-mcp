# Usage Analytics Counters

## 1. Summary

Implemented. This tech spec defines local SQLite-backed aggregate usage counters
for LOR skills, subagents, and workspace notes, plus a read-only
`get_usage_analytics` MCP tool.

## 2. Context

LOR V2 focuses on skills, subagent prompt profiles, workspace diagnostics, and
workspace notes. Users need feedback about which entries are being listed,
matched, and opened in detail so catalog maintenance can be based on actual use.

The current runtime is a Deno TypeScript MCP server with local SQLite storage,
workspace alias resolution, type-specific public tools, and standard structured
tool response envelopes.

## 3. Goals

- Record aggregate entry-level usage without capturing sensitive content.
- Keep usage scoped to the resolved caller workspace.
- Support global skill and subagent entries while preserving caller-workspace
  attribution.
- Expose usage through one read-only reporting tool.
- Keep analytics write failures from breaking otherwise successful catalog or
  note reads.

## 4. Non-Goals

- Remote telemetry.
- User/session/device analytics.
- Prompt, query, generated prompt, or note-body capture.
- Usage-weighted matching.
- Analytics for hidden registered-agent or delegated-task compatibility code.
- A dashboard UI outside MCP responses.

## 5. Design

Add a SQLite table such as `usage_counters`:

- `workspace`
- `entryType`
- `entryScope`
- `entryKey`
- `projectName`
- `operation`
- `count`
- `first_seen_at`
- `last_seen_at`

Use a unique constraint on:

- `workspace`
- `entryType`
- `entryScope`
- `entryKey`
- `operation`

Add a second SQLite table for period reports:

- `usage_daily_counters`
- `day`: UTC date in `YYYY-MM-DD`
- `workspace`
- `entryType`
- `entryScope`
- `entryKey`
- `projectName`
- `operation`
- `count`
- `firstSeenAt`
- `lastSeenAt`

Use a unique constraint on:

- `day`
- `workspace`
- `entryType`
- `entryScope`
- `entryKey`
- `operation`

Every new usage write updates both `usage_counters` and `usage_daily_counters`.
Existing lifetime counters remain valid during migration, but no daily history
is fabricated from them.

Add request-level routing outcome tables:

- `usage_match_outcomes`
- `usage_daily_match_outcomes`

Fields:

- `workspace`
- `entryType`
- `matchRequests`
- `noMatchRequests`
- `recommendationCount`
- `firstSeenAt`
- `lastSeenAt`
- daily table only: `day`

Match outcome counters are written after successful match tool execution. A
successful match request with zero returned candidates increments
`matchRequests` and `noMatchRequests`, with `recommendationCount` set to `0`.
Failed validation, storage failures before a response, or thrown match requests
do not increment outcome counters. Raw task/query text is never stored.

Add recommendation attribution tables:

- `usage_recommendations`
- `usage_daily_attribution`
- `usage_daily_unattributed_opens`

`usage_recommendations` stores short-lived opaque recommendation ids for match
results. Fields:

- `recommendationId`
- `workspace`
- `entryType`
- `entryScope`
- `entryKey`
- `recommendedAt`
- `expiresAt`
- `attributedOpenAt`

Rows expire after 30 days and are used only to connect a later detail read to a
previous match result. The id is opaque and does not encode task/query content.

`usage_daily_attribution` stores retained UTC-day aggregates by recommendation
day:

- `day`
- `workspace`
- `entryType`
- `entryScope`
- `entryKey`
- `impressions`
- `attributedOpens`

`usage_daily_unattributed_opens` stores retained UTC-day aggregates by detail
read day for successful detail reads that omit a recommendation id or provide an
invalid/expired id:

- `day`
- `workspace`
- `entryType`
- `entryScope`
- `entryKey`
- `unattributedDetailOpens`

Supported values:

- `entryType`: `skill`, `subagent`, `note`
- `entryScope`: `workspace`, `global`
- `operation`: `listed`, `matched`, `detailed`

Record usage after successful service operations:

- `listSkills` increments `listed` for each returned skill.
- `listSubagents` increments `listed` for each returned subagent.
- `listWorkspaceNotes` increments `listed` for each returned note summary.
- `findMatchingSkill` increments `matched` for each returned skill candidate.
- `findMatchingSubagent` increments `matched` for each returned subagent
  candidate.
- `findMatchingWorkspaceNote` increments `matched` for each returned note
  preview.
- Successful match responses include one `recommendationId` for the returned
  candidate set and a manual attribution instruction.
- `getSkillDetail` increments `detailed` for the returned skill.
- `getSubagentDetail` increments `detailed` for the returned subagent.
- `getWorkspaceNote` increments `detailed` for the returned note.
- Detail tools accept optional `recommendationId`. A valid id increments
  `attributedOpens` once for the matching entry on the recommendation day.
  Repeated opens with the same id are ordinary detail reads but do not increment
  attribution again. Missing, invalid, or expired ids increment
  `unattributedDetailOpens` by detail read day.

Do not record failed lookups, validation failures, no-match responses, or empty
list results as entry-level usage. The reporting tool may still include empty
summary counts.

Add `get_usage_analytics`:

- input:
  - `workspace` required
  - optional `entryType`: `skill`, `subagent`, or `note`
  - optional `scope`: `workspace` or `global`
  - optional `entryKey`
  - optional `projectName`
  - optional `period`: `lifetime`, `last_7_days`, or `last_30_days`; default
    `lifetime`
- output:
  - standard `status: ok` envelope
  - `resolvedWorkspace`
  - `checkedAt`
  - `period`
  - optional `periodStart` and `periodEnd` for recent daily periods
  - `filters`
  - `metricDefinitions`
  - `summary`
  - `routingOutcomes`
  - `coverage`
  - `attribution`
  - `entries`
  - `recommendedActions`

Supported optional sorting:

- `sortBy: "listed" | "matched" | "detailed"`
- Sorting is descending by the requested counter.
- Ties are deterministic by scope, entry type, and entry key.
- When `sortBy` is omitted, preserve the legacy deterministic ordering by entry
  type, scope, resolved project name, and entry key.

Example most-used skills request:

```json
{
  "workspace": "/path/to/workspace",
  "entryType": "skill",
  "sortBy": "detailed"
}
```

Usage rows are grouped by stable entry identity:

- `workspace`
- `entryType`
- `entryScope`
- `entryKey`

`projectName` is mutable metadata and must not be part of the report grouping
identity. The repository may retain the last recorded project metadata on each
operation row, but the service report must aggregate all operation counters for
the stable entry identity and resolve one deterministic project name for display
and filtering. Use the project name from the newest recorded counter row for the
entry; if multiple project names share the same newest timestamp, choose the
lexicographically first project name. Project filters apply to that resolved
metadata and must not return partial operation counts for one entry.

Before applying `projectName` filters, the service must merge counter rows with
the current visible catalog by stable entry identity. Current catalog metadata
wins over stored counter metadata. This keeps renamed entries from splitting or
disappearing under their current project filter.

`lastDetailedAt` is derived only from the `detailed` operation row's
`lastSeenAt`. Omit it when there is no recorded detail read.

`period: "lifetime"` means retained local recorded history. It excludes activity
before tracking was introduced or enabled. Counter values are repeated tool
returns/detail reads, not unique tasks or proof that returned guidance was used
in code.

`period: "last_7_days"` and `period: "last_30_days"` read `usage_daily_counters`
by UTC calendar day. They include the current partial UTC day. `periodStart` is
the start of the first included UTC day, and `periodEnd` is the report
`checkedAt` timestamp. Daily reads return per-day rows to the service layer so
project metadata resolution follows the same newest-row deterministic rule as
lifetime reports.

`scope: "global"` is valid only for skills and subagents. Workspace notes are
always workspace-scoped.

`routingOutcomes` are request-level aggregates. They are scoped only by
workspace, optional `entryType`, and selected period. They intentionally do not
honor `entryKey`, `scope`, or `projectName` filters, because no-match requests
and recommendation counts cannot be attributed to a single entry.

`coverage` compares the current visible catalog with the selected period's
detail counters. It reports registered entries, entries opened through detail
tools, and entries with no recorded detail read. Deleted entries can remain in
historical usage rows with `registered: false`, but they are excluded from
coverage.

`attribution` reports aggregate match-to-detail attribution for the selected
period. Its daily rows are keyed by recommendation day, not detail read day, so
recent-period reports do not move old impressions forward when a user opens the
detail later. Unattributed detail opens are reported separately and should not
be derived from `detailed - attributedOpens`, because detail reads and
attributed opens use different cohort dates and duplicate detail reads are
deduplicated for attribution.

## 6. Alternatives Considered

- Tool-call counters only: rejected because users need to know which entries
  were used, not just which tools were called.
- Storing raw match queries for later analysis: rejected because it captures
  task context and raises privacy risk.
- Updating usage inside match ranking immediately: rejected for v1 because it
  would make deterministic matching harder to reason about.
- Reporting analytics only through `check_catalog_health`: rejected because
  health and usage answer different questions. A later compact health summary
  can reuse the same counters.

## 7. Implementation Notes

- Add a schema migration for `usage_counters`.
- Add an additive schema migration for `usage_daily_counters`.
- Add additive schema migrations for match outcome counters.
- Add additive schema migrations for short-lived recommendation ids and daily
  attribution aggregates.
- Add repository methods for batch counter increments and analytics reads.
- Prefer batch increments after list/match operations to avoid one write per
  entry when possible.
- Use timestamps generated by the service layer consistently with existing
  catalog code.
- Swallow and log counter-write failures after otherwise successful list, match,
  or detail operations.
- Do not include raw input task strings, note bodies, generated prompts, DB
  paths, or namespace internals in analytics rows or logs.
- Keep read-side analytics failures mapped to normal `storage_error` responses.
- Add schemas and tool registration in the existing type-specific tool style.

## 8. Risks and Tradeoffs

- Counting every returned entry can add write load to read-heavy tools.
- Suppressing counter-write failures avoids breaking routing, but analytics may
  be incomplete until diagnostics exposes the issue.
- Global entries need careful caller-workspace attribution so one workspace does
  not see another workspace's global-entry usage.
- Counters can make stale entries obvious, but they should not become automatic
  deletion signals.

## 9. Verification Plan

- Repository tests:
  - migration creates `usage_counters`
  - counters increment for listed skills, subagents, and notes
  - counters increment for matched skills, subagents, and notes
  - counters increment for detail reads
  - global skill/subagent usage is attributed to the caller workspace
  - workspace-local rows do not cross workspace boundaries
- Service tests:
  - empty analytics returns zero-count `status: ok`
  - filters by entry type, scope, entry key, and project name work
  - invalid note plus global scope filter returns `validation_error`
  - analytics write failure does not fail the original list/match/detail result
- MCP/schema tests:
  - `tools/list` includes `get_usage_analytics`
  - valid calls return the standard structured envelope
  - invalid filters return stable error codes
- Full verification:
  - `mise x deno@latest -- deno task check`
  - `mise x deno@latest -- deno task test`
  - `mise x deno@latest -- deno task lint`
  - `mise x deno@latest -- deno task fmt`
  - `mise x deno@latest -- deno fmt --check README.md CHANGELOG.md docs`
  - `git diff --check`

## 10. Open Questions

- Should a future reset operation archive old counts or hard reset them?
- Should usage analytics eventually feed health recommendations directly?
- Should analytics expose last-used timestamps in list/detail outputs, or only
  through `get_usage_analytics`?

## 11. Decision Log

- 2026-08-16: Use aggregate counters keyed by workspace, entry, and operation.
- 2026-08-16: Count returned entries for list and match operations, not just
  tool calls.
- 2026-08-16: Keep analytics maintenance-only for v1; do not alter matching
  score from usage.
- 2026-08-16: Suppress counter-write failures for normal read tools but make
  analytics report reads fail explicitly if storage cannot be read.
