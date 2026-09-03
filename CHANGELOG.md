# Changelog

All notable changes to Local Orchestration Router (LOR) MCP Server are tracked
in this file starting from version `1.0.0`.

The project follows Semantic Versioning:

- `MAJOR`: incompatible MCP tool contract, storage, or runtime changes.
- `MINOR`: backward-compatible MCP tools, catalog behavior, or documented
  workflows.
- `PATCH`: backward-compatible fixes, docs corrections, and internal
  maintenance.

## [Unreleased]

### Added

- Add `find_matching_workspace_note` for deterministic workspace-memory note
  retrieval with ranked previews and optional tag filtering.
- Add structured skill/subagent routing metadata for intents, positive and
  negative keywords, required signals, domain, output need, field weights, and
  debug match evidence.

### Changed

- Route skill/subagent matches through normalized aliases, stop-word filtering,
  hard pre-ranking exclusions, weighted structured scores, and separate
  negative evidence.
- Clean up README, roadmap, changelog, and active tool-surface documentation
  ahead of the next planning cycle.
- Align V2 direction docs for task-oriented agents, tool-surface simplification,
  skill/subagent coverage, and local skill/AGENTS.md integration.
- Hide delegated task lifecycle tools from the normal public MCP surface while
  keeping manual prompt helpers available.
- Remove the registered-agent public MCP tools from the V2 surface:
  `introduce_agent`, `list_agents`, `get_agent_detail`, `update_agent`,
  `retire_agent`, `remove_agent`, `clear_workspace_agents`,
  `find_matching_agent`, `prepare_agent_handoff`,
  `prepare_agent_initialization`, and `prepare_agent_regeneration`.
- Extend `check_catalog_health` with skill/subagent coverage metrics, status,
  and recommended actions.
- Extend `get_workspace_diagnostics` with local `AGENTS.md` status and local
  Codex skill/LOR skill alignment reporting.
- Default new `introduce_skill` and `introduce_subagent` registrations to global
  scope when `scope` is omitted; callers use `scope: "workspace"` for
  workspace-local entries. Workspace notes remain workspace-scoped.
- Align the advertised MCP server version with the `VERSION` file and keep
  stdio startup from reading HTTP-only `LOR_HOST`/`LOR_PORT` environment vars.

## [2.0.0] - 2026-08-06

### Added

- Subagent profile support for reusable scoped delegation prompts, including
  workspace/global scope, matching, detail, import/export, and workspace sync
  behavior.
- Agent reachability metadata and dispatch outcome tracking for registered Codex
  agents.
- Delegated agent task lifecycle tools for sending, queuing, listing, and
  checking workspace-scoped agent tasks.
- Delegated task follow-up and result retrieval tools for task-scoped context
  and recorded outcomes.
- Workspace diagnostics for resolved aliases, catalog counts, and sanitized
  storage/runtime status.
- Workspace memory primitives for durable workspace notes outside the routing
  catalog.
- Lower-noise HTTP logging for expected OAuth/OIDC discovery probe `404`
  responses without adding fake authorization metadata.

### Changed

- Expanded the active MCP tool surface to include orchestration, diagnostics,
  and workspace memory workflows.
- Updated README, roadmap, feature specs, use cases, and completed tech specs to
  reflect the implemented 2.0.0 server state.

## [1.0.0] - 2026-08-04

Initial tracked version for the runnable local LOR MCP server.

### Added

- Deno TypeScript MCP server with local Streamable HTTP transport and stdio
  fallback.
- SQLite-backed durable catalog storage with workspace alias resolution.
- Workspace-scoped agent and skill catalog registration.
- Shared global skill scope through `scope: "global"` and
  `promote_skill_to_global`.
- Catalog listing, detail lookup, update, removal, clearing, import, export,
  workspace sync, and health reporting.
- Deterministic matching with skill context scoring, structured explanations,
  and agents-only conflict handling.
- Agent handoff, regeneration, and retirement workflows.
- Deterministic agent prompt generation.
- Approval-gated skill context proposals and local `SKILL.md` managed-section
  sync.
- Feature specs, use cases, technical specs, roadmap, and README documentation.
