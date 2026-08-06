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
