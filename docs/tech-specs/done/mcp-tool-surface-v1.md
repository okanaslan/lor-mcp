# MCP Tool Surface

## 1. Summary

Implemented for the current 2.0.0 runtime. This tech spec defines the active
public MCP tool set for Local Orchestration Router (LOR). The current V2 surface
focuses on skills, reusable subagent prompt profiles, prompt generation,
workspace diagnostics, workspace memory, catalog sync, and approval-gated local
skill context sync.

Registered-agent catalog tools, delegated-task tools, direct agent communication
tools, and agent regeneration/handoff tools are not part of the normal public V2
surface. LOR prepares context and prompts; Codex-native behavior owns chat
creation, delivery, follow-up, and result collection.

## 2. Context

LOR runs as a Deno TypeScript MCP server over local Streamable HTTP, with stdio
retained as a fallback. Catalog scope comes from the client-supplied `workspace`
tool input, and durable storage uses SQLite through the resolved local database
path.

This document started as the v1 tool-surface plan and now records the active
2.0.0 public tool surface. Historical decisions remain in the decision log.

## 3. Goals

- Define the active public routing, catalog, diagnostics, prompt, and
  workspace-memory workflow.
- Keep public tool names stable and predictable.
- Make the public surface harder to misuse by removing hidden agent dispatch and
  task-management behavior.
- Keep structured response envelopes and stable error codes.
- Require callers to provide workspace scope explicitly.
- Avoid exposing storage details in normal tool inputs.

## 4. Non-Goals

- Add remote or hosted agent execution infrastructure.
- Expose LOR-owned task dispatch or result collection in the public surface.
- Expose registered-agent catalog management in the public V2 surface.
- Define future HTTP authorization behavior.
- Replace the detailed feature specs for each individual tool family.

## 5. Active Public Tools

The current 2.0.0 server registers these public MCP tools:

- `introduce_skill`
- `introduce_subagent`
- `list_skills`
- `list_subagents`
- `clear_workspace_skills`
- `clear_workspace_subagents`
- `register_workspace_alias`
- `promote_skill_to_global`
- `get_skill_detail`
- `get_subagent_detail`
- `update_skill`
- `update_subagent`
- `propose_skill_update`
- `apply_skill_update`
- `preview_skill_file_sync`
- `apply_skill_file_sync`
- `remove_skill`
- `remove_subagent`
- `export_catalog`
- `import_catalog`
- `preview_workspace_catalog_sync`
- `apply_workspace_catalog_sync`
- `check_catalog_health`
- `get_workspace_diagnostics`
- `remember_workspace_note`
- `list_workspace_notes`
- `find_matching_workspace_note`
- `get_workspace_note`
- `remove_workspace_note`
- `generate_agent_prompt`
- `find_matching_skill`
- `find_matching_subagent`

Removed from the normal public V2 surface:

- registered-agent catalog tools such as `introduce_agent`, `list_agents`,
  `get_agent_detail`, `update_agent`, `remove_agent`, `retire_agent`, and
  `find_matching_agent`
- prompt tools tied to registered agents such as `prepare_agent_handoff` and
  `prepare_agent_regeneration`
- delegated-task tools such as `send_agent_task`, `get_agent_task_status`,
  `list_active_tasks`, `append_agent_context`, and `get_agent_task_result`
- generic day-to-day catalog tools such as `list_catalog_entries`,
  `get_catalog_entry_detail`, `update_catalog_entry`, `remove_catalog_entry`,
  `clear_workspace_catalog`, and `find_matching_catalog_entry`

## 6. Shared Behavior

Each tool is registered with the MCP SDK `registerTool` API and a Zod
`inputSchema`. Tool handlers validate the client-supplied `workspace` input,
then call catalog domain or repository functions.

Tool inputs must include `workspace` when they operate on workspace state. LOR
normalizes path-shaped workspace values and resolves registered aliases before
catalog reads and writes. Responses should return the resolved canonical
workspace.

Tool inputs must not include `connectionId`, `mcpSessionId`, or `LOR_DB_PATH`.
Those values are server configuration and protocol context, not
caller-controlled tool arguments.

Tool results should include `structuredContent` for agents and concise text
`content` for human readability. Agents should rely on `structuredContent`.

Successful structured results should use this envelope:

- `status`: `ok`, `no_match`, or `conflict`.
- `data`: tool-specific payload.
- `error`: omitted.

Failure structured results should use this envelope:

- `status`: `error`.
- `data`: omitted.
- `error.code`: stable machine-readable error code.
- `error.message`: concise caller-facing message.

Tool failures should set `isError: true` when returning an MCP error result.
Expected routing outcomes such as `no_match` are not tool failures and should
not set `isError: true`.

## 7. Tool Families

Skill tools:

- `introduce_skill`: registers stored skill metadata. Omitted `scope` defaults
  to `global`; callers use `scope: "workspace"` for workspace-local entries.
- `list_skills`: lists workspace-visible skills, including global skills by
  default.
- `get_skill_detail`: returns full stored skill metadata.
- `update_skill`: updates editable skill metadata.
- `remove_skill`: hard-deletes a targeted skill record.
- `clear_workspace_skills`: clears workspace-local skills after `confirm: true`.
- `promote_skill_to_global`: copies a workspace-local skill into global scope.
- `propose_skill_update` and `apply_skill_update`: approval-gated stored skill
  context update flow.
- `preview_skill_file_sync` and `apply_skill_file_sync`: approval-gated sync
  from stored skill context into a LOR-managed local `SKILL.md` section.
- `find_matching_skill`: deterministic local matching over workspace-visible
  skills.

Subagent tools:

- `introduce_subagent`: registers a reusable prompt profile. Omitted `scope`
  defaults to `global`; callers use `scope: "workspace"` for workspace-local
  profiles.
- `list_subagents`: lists workspace-visible subagent profiles, including global
  profiles by default.
- `get_subagent_detail`: returns full metadata and rendered prompt text.
- `update_subagent`: updates editable subagent metadata.
- `remove_subagent`: hard-deletes a targeted subagent profile.
- `clear_workspace_subagents`: clears workspace-local subagents after
  `confirm: true`.
- `find_matching_subagent`: deterministic local matching over workspace-visible
  subagent profiles, limited to three results by default.

Workspace tools:

- `register_workspace_alias`: maps a stable alias to a canonical workspace.
- `check_catalog_health`: reports stored verification metadata plus skill and
  subagent coverage/readiness metrics.
- `get_workspace_diagnostics`: reports alias resolution, catalog counts, local
  skill inventory alignment, and local `AGENTS.md` status without listing full
  catalog entries.
- `remember_workspace_note`, `list_workspace_notes`,
  `find_matching_workspace_note`, `get_workspace_note`, and
  `remove_workspace_note`: durable workspace-scoped notes outside the routing
  catalog.
- `export_catalog` and `import_catalog`: versioned workspace-local JSON backup
  and restore.
- `preview_workspace_catalog_sync` and `apply_workspace_catalog_sync`: preview
  and approval-gated copy of workspace-local skills and subagents into another
  workspace.

Prompt tools:

- `generate_agent_prompt`: creates deterministic ready-to-paste prompts for
  fresh short-lived Codex chats. It must not create, message, steer, verify, or
  register a Codex agent.

## 8. Stable Error Codes

Stable error codes for the current surface include:

- `validation_error`
- `session_error`
- `setup_error`
- `duplicate_entry`
- `not_found`
- `storage_error`

Tool-specific specs may add narrower expected codes, but responses must remain
safe: no absolute paths, env var values, stack traces, SQL, hidden entries, or
cross-workspace information.

## 9. Verification Plan

Implementation verification should include:

- Each active public tool is registered with the expected snake_case name.
- Removed V2 tools are absent from `tools/list`.
- Zod rejects missing or invalid required inputs.
- Tools use default local database storage when database path env config is
  missing.
- Skill and subagent introductions default to global scope when `scope` is
  omitted.
- Explicit `scope: "workspace"` creates workspace-local skills and subagents.
- List, detail, match, update, remove, and clear respect workspace/global scope.
- Workspace clear tools require `confirm: true` and affect only workspace-local
  entries.
- Workspace sync copies workspace-local skills and subagents, not agents.
- Workspace diagnostics reports local skill and `AGENTS.md` alignment without
  exposing sensitive local paths beyond sanitized setup metadata.
- Workspace memory tools stay workspace-scoped and do not participate in catalog
  matching.
- Generate prompt returns deterministic starter prompts and does not write to
  catalog storage.
- Error responses use stable `status: error` envelopes and expected codes.

## 10. Open Questions

- Should future tool output schemas be registered with SDK `outputSchema`, or
  should implementations only return `structuredContent`?
- Should typed list tools support specialty tag filtering in a later version?
- Should any internal registered-agent compatibility tools be deleted from code
  entirely after V2 adoption, or remain unregistered for migration/debugging?

## 11. Decision Log

- 2026-07-12: Include five initial v1 tools: introduce agent, introduce skill,
  list, detail, and find match.
- 2026-07-12: Use snake_case tool names.
- 2026-07-12: Use MCP SDK `registerTool` with Zod `inputSchema`.
- 2026-07-12: Return structured response envelopes through `structuredContent`.
- 2026-07-12: Treat `no_match` and `conflict` as non-error routing outcomes.
- 2026-07-13: Support the same v1 tool surface over local Streamable HTTP and
  stdio.
- 2026-07-13: Make `workspace` a required client-supplied tool input instead of
  deriving catalog scope from server config.
- 2026-08-06: Replace public generic list, detail, update, remove, clear, and
  match tools with type-specific tool names while retaining shared internal
  catalog helpers.
- 2026-08-06: Add `get_workspace_diagnostics` for read-only workspace
  resolution, alias, catalog count, local skill, and `AGENTS.md` visibility.
- 2026-08-06: Add workspace memory tools for durable scoped notes outside the
  routing catalog.
- 2026-08-15: Remove registered-agent catalog, registered-agent prompt, and
  delegated-task tools from the normal public V2 surface.
- 2026-08-15: Default omitted skill and subagent registration scope to `global`.
