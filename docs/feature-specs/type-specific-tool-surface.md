# Type-Specific Tool Surface

## Summary

LOR exposes explicit MCP tools for agents, skills, and subagent prompt profiles
instead of generic catalog tools that require callers to provide `entryType`.

## Status

Implemented for the local 2.0.0 server.

## Goals

- Make the public MCP surface easier for Codex agents and users to call.
- Remove day-to-day generic catalog tools from public registration.
- Preserve shared internal service and repository helpers where they reduce
  duplication.
- Keep structured response envelopes and stable error codes unchanged.

## Non-Goals

- Rename `export_catalog`, `import_catalog`, or workspace catalog sync tools in
  this pass.
- Change SQLite table names or stored catalog row shape.
- Remove `entryType` from response data or import/export payloads.
- Add compatibility aliases for removed generic public tool names.

## Functional Requirements

- `tools/list` must expose typed list tools:
  - `list_agents`
  - `list_skills`
  - `list_subagents`
- `tools/list` must expose typed detail tools:
  - `get_agent_detail`
  - `get_skill_detail`
  - `get_subagent_detail`
- `tools/list` must expose typed update tools:
  - `update_agent`
  - `update_skill`
  - `update_subagent`
- `tools/list` must expose typed removal tools:
  - `remove_agent`
  - `remove_skill`
  - `remove_subagent`
- `tools/list` must expose typed clear tools:
  - `clear_workspace_agents`
  - `clear_workspace_skills`
  - `clear_workspace_subagents`
- `tools/list` must expose typed matching tools:
  - `find_matching_agent`
  - `find_matching_skill`
  - `find_matching_subagent`
- Removed public tools:
  - `list_catalog_entries`
  - `get_catalog_entry_detail`
  - `update_catalog_entry`
  - `remove_catalog_entry`
  - `clear_workspace_catalog`
  - `find_matching_catalog_entry`
- Agent tools use `agentEntryKey` as their stable key input.
- Skill tools use `skillName` as their stable key input.
- Subagent tools use `subagentName` as their stable key input.
- Skill and subagent tools may accept `scope` where global/workspace ambiguity
  is possible.
- Agent tools must remain workspace-only.
- Typed clear tools require `confirm: true`.
- Subagent clear must delete only workspace-local subagents and must not delete
  agents or skills.
- Typed matching tools must reuse the deterministic local matcher.
- `find_matching_agent` keeps agents-only conflict handling.
- `find_matching_skill` and `find_matching_subagent` return ranked results and
  do not introduce conflict handling.

## Decision Log

- 2026-08-06: Replace generic day-to-day catalog tools with type-specific public
  tools while keeping shared internal catalog helpers.
