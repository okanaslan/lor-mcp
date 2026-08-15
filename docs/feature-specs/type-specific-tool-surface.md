# Type-Specific Tool Surface

## Summary

LOR exposes explicit MCP tools for skills and subagent prompt profiles instead
of generic catalog tools that require callers to provide `entryType`. Registered
agent catalog tools were removed from the normal public V2 surface.

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

- `tools/list` must expose typed skill and subagent list tools:
  - `list_skills`
  - `list_subagents`
- `tools/list` must expose typed skill and subagent detail tools:
  - `get_skill_detail`
  - `get_subagent_detail`
- `tools/list` must expose typed skill and subagent update tools:
  - `update_skill`
  - `update_subagent`
- `tools/list` must expose typed skill and subagent removal tools:
  - `remove_skill`
  - `remove_subagent`
- `tools/list` must expose typed skill and subagent clear tools:
  - `clear_workspace_skills`
  - `clear_workspace_subagents`
- `tools/list` must expose typed skill and subagent matching tools:
  - `find_matching_skill`
  - `find_matching_subagent`
- Removed public tools:
  - `list_agents`
  - `get_agent_detail`
  - `update_agent`
  - `remove_agent`
  - `clear_workspace_agents`
  - `find_matching_agent`
  - `list_catalog_entries`
  - `get_catalog_entry_detail`
  - `update_catalog_entry`
  - `remove_catalog_entry`
  - `clear_workspace_catalog`
  - `find_matching_catalog_entry`
- Skill tools use `skillName` as their stable key input.
- Subagent tools use `subagentName` as their stable key input.
- Skill and subagent tools may accept `scope` where global/workspace ambiguity
  is possible.
- Typed clear tools require `confirm: true`.
- Subagent clear must delete only workspace-local subagents and must not delete
  skills.
- Typed matching tools must reuse the deterministic local matcher.
- `find_matching_skill` and `find_matching_subagent` return ranked results.
- Registered agent discovery, update, removal, handoff, regeneration, and task
  tools must stay off the normal public V2 tool surface.

## Decision Log

- 2026-08-06: Replace generic day-to-day catalog tools with type-specific public
  tools while keeping shared internal catalog helpers.
- 2026-08-15: Remove registered-agent catalog tools from the normal public V2
  surface; keep public skill and subagent tools only.
