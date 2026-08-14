# V2 Skill And Subagent Coverage Health

## 1. Summary

Implemented for V2. This feature improves workspace health by measuring whether
a workspace has enough registered skills and subagents to support useful
task-oriented agent initialization.

## 2. Goals

- Encourage active registration of skills and subagents.
- Add workspace health metrics for skill and subagent coverage.
- Identify low-coverage workspaces before routing quality suffers.
- Provide concrete suggestions for improving the catalog.

## 3. Non-Goals

- Force users to register a fixed number of skills.
- Automatically install local skills.
- Automatically create subagents without user approval.
- Use global skills to hide poor workspace-local coverage without explanation.

## 4. Functional Requirements

- Workspace health must include skill count and subagent count.
- Workspace health must distinguish workspace-local and global entries.
- Workspace health must report coverage by project and specialty where possible.
- Workspace health must return a coverage status such as `healthy`,
  `needs_attention`, or `low_coverage`.
- Workspace health must include recommended next actions when coverage is low.
- Health results must not block normal tool usage, but should strongly guide
  callers to improve registration.

## 5. User Stories / Use Cases

Optional. The main use case is a Codex agent starting in a workspace and seeing
that too few skills or subagents are registered to make LOR useful.

## 6. Data Model

Conceptual `CoverageHealth` fields:

- `workspaceSkillCount`
- `globalSkillCount`
- `workspaceSubagentCount`
- `globalSubagentCount`
- `projectCoverage`
- `specialtyCoverage`
- `coverageStatus`
- `recommendedActions`

## 7. Error Handling

- Empty catalogs must return a successful health response with low coverage
  guidance, not a tool error.
- Storage failures must return a storage error.

## 8. Security and Permissions

- Health metrics must not reveal workspace-local entries from other workspaces.
- Global entries may be counted because they are intentionally shared.

## 9. Open Questions

- What thresholds should define low, medium, and healthy coverage?
- Should thresholds be configurable per workspace?
- Should local installed skills count separately from LOR-registered skills?

## 10. Decision Log

- 2026-08-14: Plan V2 health around skill and subagent coverage metrics.
- 2026-08-14: Health should guide registration, not block usage.
- 2026-08-14: Extend `check_catalog_health` with a non-blocking `coverage` block
  for skills and subagents instead of adding a separate health tool.
- 2026-08-14: Use deterministic thresholds: `low_coverage` when either skills or
  subagents are absent, `needs_attention` when coverage exists only through
  global entries for a family, and `healthy` when the workspace has at least one
  workspace-local skill and subagent.
