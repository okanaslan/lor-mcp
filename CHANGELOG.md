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

- Document planned Subagent Suggestions catalog feature, including use cases,
  feature behavior, future technical design, and related catalog spec updates.

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
