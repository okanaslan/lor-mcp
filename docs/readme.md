# Local Orchestration Router (LOR) MCP Server Docs

This folder is the planning, specification, and implementation-status home for
the LOR MCP Server.

LOR is currently a runnable local 2.0.0 Deno TypeScript MCP server with
Streamable HTTP, SQLite-backed workspace catalog storage, deterministic
matching, agent handoff and regeneration prompt preparation, agent retirement,
workspace catalog sync, shared global skill scope, registered skill context
updates, and approval-gated local `SKILL.md` sync. Subagent support adds
reusable workspace/global prompt profiles for small, scoped delegation without
requiring a registered Codex agent session.

Reachability metadata distinguishes catalog-only registered agents from agents
known reachable through Codex-native dispatch outcomes. This is the foundation
for later delegated task lifecycle tools.

Delegated task lifecycle tools now create durable task records, store
task-scoped follow-up messages, return results when recorded, and can use a
host-provided dispatcher when one is available. Workspace diagnostics reports
resolved aliases, catalog counts, and sanitized setup status without listing
catalog entries. Workspace memory stores small durable notes outside the routing
catalog. Expected HTTP auth discovery probe `404` responses are logged below
warning severity while unrelated `4xx` responses remain warnings.

## Contents

- `../CHANGELOG.md`: version history.
- `../VERSION`: current project version.
- `versioning.md`: versioning and changelog rules.
- `roadmap.md`: high-level feature roadmap and current implementation status.
- `feature-specs/`: product behavior specs for implemented and planned features.
- `use-cases/`: workflow and scenario documents linked from feature specs.
- `tech-specs/`: technical design notes, implementation decisions, and
  architecture discussions.
- `tech-specs/done/`: completed tech specs for implemented behavior.
- `tech-specs/future/`: future-facing tech specs that are not active
  implementation scope.

## Current Operating Model

Use LOR with a caller-supplied `workspace`. The server resolves aliases and
canonical workspace paths before reading or writing catalog records.

The main user flows are:

- Register agents, skills, and subagent profiles with routing metadata.
- Share selected skills globally across workspaces with `scope: "global"` or
  `promote_skill_to_global`.
- Find matching agents, skills, and subagent prompt profiles for a task.
- Fetch details and prepare handoff or regeneration prompts for registered Codex
  agents.
- Use agent reachability metadata before direct delegated task dispatch.
- Use delegated task lifecycle, follow-up/result, diagnostics, and workspace
  memory tools.
- Retire replaced agents while keeping their catalog records inspectable.
- Improve stored skill context through approval-gated proposals.
- Optionally sync approved skill context into a local `SKILL.md` managed
  section.
- Export, import, sync, inspect, update, remove, clear, and health-check
  workspace catalog entries.
- Introduce subagent prompt profiles for limited-scope work when no existing
  registered agent is appropriate.

Local skill-file sync is intentionally separate from stored catalog updates:
preview first, then apply with `confirm: true`.

## Working Notes

- Keep feature planning documents under this `docs/` folder.
- Add one focused feature spec per major feature.
- Add detailed use cases under `use-cases/` and link them from related feature
  specs.
- Add active technical design discussions under `tech-specs/`; move completed
  specs to `tech-specs/done/` and future-only specs to `tech-specs/future/`.
- Update the roadmap when a feature spec is added, changed, or completed.
- Update `VERSION` and `CHANGELOG.md` when cutting a version.
- Keep root `README.md`, this docs index, and `roadmap.md` aligned whenever the
  public MCP tool surface changes.
- Keep planned-tool language explicit so future docs do not imply unimplemented
  MCP tools are available.
