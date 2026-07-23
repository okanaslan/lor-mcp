# MCP Tool Surface V1

## 1. Summary

Implemented for the current v1 runtime. This tech spec defines the first usable
MCP tool set for Local Orchestration Router (LOR). The v1 surface supports
introducing agents and skills, inspecting, updating, removing, clearing,
exporting, and importing the catalog, registering workspace aliases, managing
stored skill context updates, syncing approved skill context to local skill
files, preparing manual agent handoff prompts, generating empty-chat starter
prompts, checking stored catalog health metadata, and finding a matching catalog
entry for a task.

The tool surface is designed for the current Deno TypeScript runtime, local
Streamable HTTP and stdio transports, client-supplied workspace scope, and
SQLite-backed catalog storage.

## 2. Context

Local Orchestration Router (LOR) v1 runs as a Deno TypeScript MCP server over
local Streamable HTTP, with stdio retained as a fallback. Catalog scope comes
from the client-supplied `workspace` tool input, and durable storage uses SQLite
through the resolved local database path.

The MCP TypeScript SDK supports registering tools with `registerTool`, Zod
`inputSchema` validation, `structuredContent`, text `content`, and `isError` for
error results. V1 should use those SDK surfaces directly.

Existing feature specs define more catalog capabilities than the first
implementation should expose. The first tool set should cover a complete basic
workflow without adding external existence verification, dispatch, or standalone
explanation tools.

## 3. Goals

- Define the minimal usable routing workflow.
- Keep v1 tool names stable and predictable.
- Define a stable structured response envelope.
- Keep MCP handlers thin over session and catalog domain modules.
- Require callers to provide workspace scope explicitly.
- Avoid exposing storage details in normal tool inputs.
- Keep later tool expansions compatible with the v1 response style.

## 4. Non-Goals

- Add external skill or agent existence verification tools.
- Dispatch work to another Codex agent.
- Define the full matching algorithm.
- Define the recommendation explanation contract.

## 5. Proposed Design

V1 should register twenty MCP tools with snake_case names:

- `introduce_agent`
- `introduce_skill`
- `list_catalog_entries`
- `clear_workspace_catalog`
- `register_workspace_alias`
- `get_catalog_entry_detail`
- `update_catalog_entry`
- `propose_skill_update`
- `apply_skill_update`
- `preview_skill_file_sync`
- `apply_skill_file_sync`
- `remove_catalog_entry`
- `export_catalog`
- `import_catalog`
- `preview_workspace_catalog_sync`
- `apply_workspace_catalog_sync`
- `check_catalog_health`
- `prepare_agent_handoff`
- `generate_agent_prompt`
- `find_matching_catalog_entry`

Each tool should be registered with the MCP SDK `registerTool` API and a Zod
`inputSchema`. Tool handlers should validate the client-supplied `workspace`
input, then call catalog domain or repository functions.

Tool inputs must include `workspace`. LOR normalizes path-shaped workspace
values and resolves registered aliases before catalog reads and writes.
Responses should return the resolved canonical workspace.

Tool inputs must not include `connectionId`, `mcpSessionId`, or `LOR_DB_PATH`.
Those values are server configuration and protocol context, not
caller-controlled tool arguments.

All v1 tools must require:

- Completed MCP initialization.
- Client-supplied `workspace`.
- Available local SQLite database path.
- Available catalog storage.

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
Expected routing outcomes such as `no_match` and `conflict` are not tool
failures and should not set `isError: true`.

## 6. Alternatives Considered

Excluding update and single-entry remove from v1 was considered. They were added
after the first runnable slice because catalog maintenance needs precise
single-entry correction and removal, not only bulk workspace clearing.

Including external existence verification and standalone explanation tools in v1
was considered. It was not chosen because those tools depend on additional specs
and would widen the first implementation too much.

Text-only responses were considered. They were not chosen because Codex agents
need stable structured output to make reliable routing decisions.

Fully specifying every field-level Zod constraint in this tech spec was
considered. It was not chosen because feature specs already define the required
fields, and implementation can refine exact validation constraints without
changing the tool surface.

## 7. Implementation Notes

`introduce_agent` input:

- `workspace`
- `codexSessionId`
- `projectName`
- `displayName`
- `primarySpecialty`
- `specialtyTags`

`introduce_agent` output data should include the created agent entry metadata.
It may return validation, session/setup, duplicate, or storage errors.

`introduce_skill` input:

- `workspace`
- `skillName`
- `projectName`
- `displayName`
- `primarySpecialty`
- `specialtyTags`

`introduce_skill` output data should include the created skill entry metadata.
It may return validation, session/setup, duplicate, or storage errors.

`list_catalog_entries` input:

- `workspace`
- optional `entryType`
- optional `projectName`

`list_catalog_entries` output data should include compact catalog entries. It
may return validation, session/setup, or storage errors.

`clear_workspace_catalog` input:

- `workspace`
- `confirm`: literal `true`
- optional `entryType`

`clear_workspace_catalog` output data should include the requested workspace,
optional entry type filter, deleted agent count, deleted skill count, and total
deleted count. It may return validation, session/setup, or storage errors.
Clearing an empty workspace should return zero counts.

`register_workspace_alias` input:

- `workspace`
- `alias`
- optional `confirm`: literal `true`, required only when reassigning an existing
  alias to a different canonical workspace

`register_workspace_alias` output data should include the resolved canonical
workspace, normalized alias, whether the alias was created, and whether it was
reassigned. It may return validation, session/setup, or storage errors. Aliasing
a workspace to itself is valid and idempotent.

`get_catalog_entry_detail` input:

- `workspace`
- `entryType`
- `entryKey`

`get_catalog_entry_detail` output data should include full stored metadata for
one entry. It may return validation, session/setup, not-found, or storage
errors.

`update_catalog_entry` input:

- `workspace`
- `entryType`
- `entryKey`
- optional `projectName`
- optional `displayName`
- optional `primarySpecialty`
- optional `specialtyTags`

`update_catalog_entry` output data should include the updated entry metadata. It
may return validation, session/setup, not-found, or storage errors. It must
reject empty update patches and must not allow changing the stable entry key.

`propose_skill_update` input:

- `workspace`
- `skillName`
- `reason`
- optional `skillContext`
- optional `metadata`

`propose_skill_update` output data should include the persisted proposal plus
before and after preview entries. It may return validation, not-found,
session/setup, or storage errors. It must not mutate the registered skill entry
or local skill files.

`apply_skill_update` input:

- `workspace`
- `proposalId`
- `confirm`: literal `true`

`apply_skill_update` output data should include the applied proposal plus before
and after entries. It may return validation, not-found, session/setup, or
storage errors. It mutates stored catalog skill context only.

`preview_skill_file_sync` input:

- `workspace`
- `skillName`
- `proposalId`

`preview_skill_file_sync` output data should include the resolved workspace,
skill name, proposal ID, target file name, managed section name, whether the
section already exists, whether the file would change, and the rendered managed
section. It must not write local files. The proposal must already be applied and
belong to the requested skill.

`apply_skill_file_sync` input:

- `workspace`
- `skillName`
- `proposalId`
- `confirm`: literal `true`

`apply_skill_file_sync` output data should include the same preview fields plus
`written`. It writes only the LOR-managed section in the resolved local
`SKILL.md` file. It must resolve files from server-configured skill roots and
must not accept arbitrary file paths.

`remove_catalog_entry` input:

- `workspace`
- `entryType`
- `entryKey`

`remove_catalog_entry` output data should include the removed entry type, key,
workspace, and removal confirmation. It may return validation, session/setup,
not-found, or storage errors. Removing an entry must not affect the underlying
Codex agent session or skill file.

`export_catalog` input:

- `workspace`
- optional `entryType`
- optional `projectName`

`export_catalog` output data should include a versioned structured JSON catalog
object with `version`, `exportedAt`, `workspace`, `filters`, and `entries`. It
may return validation, session/setup, or storage errors. It must only export
entries from the requested workspace.

`import_catalog` input:

- `workspace`
- `catalog`: a versioned object produced by `export_catalog`
- optional `conflictStrategy`: `skip` or `fail`

`import_catalog` output data should include the requested workspace, format
version, conflict strategy, imported count, skipped count, failed count, and
entry-level errors. V1 skips existing workspace entries by default and reports
them as failures when `conflictStrategy` is `fail`.

`preview_workspace_catalog_sync` input:

- `sourceWorkspace`
- `targetWorkspace`
- optional `projectName`
- optional `skillNames`
- optional `agentPromptRoles`

`preview_workspace_catalog_sync` output data should include resolved source and
target workspaces, selected skill entries to copy, duplicate target skills,
missing requested skills, optional generated agent prompt metadata, and summary
counts. It must not write to catalog storage or local skill files.

`apply_workspace_catalog_sync` input:

- `sourceWorkspace`
- `targetWorkspace`
- optional `projectName`
- optional `skillNames`
- optional `agentPromptRoles`
- `confirm`: literal `true`

`apply_workspace_catalog_sync` output data should include the recomputed preview
fields, copied skill names, and the internal import result. It copies skills
only, skips existing target skills, and never copies agents or `codexSessionId`
values.

`check_catalog_health` input:

- `workspace`
- optional `entryType`
- optional `projectName`
- optional `entryKey`, only valid when `entryType` is provided

`check_catalog_health` output data should include `checkedAt`, requested
workspace, filters, summary counts, and per-entry health rows derived from
stored verification metadata. V1 must not probe external evidence sources or
mutate stored verification metadata.

`prepare_agent_handoff` input:

- `workspace`
- `agentEntryKey`
- `task`
- optional `context`

`prepare_agent_handoff` output data should include the target agent summary,
rendered prompt, whether stored handoff metadata was used, missing context
labels, and manual delivery instructions. It may return validation, not-found,
session/setup, or storage errors.

`generate_agent_prompt` input:

- `workspace`
- `role`
- optional `projectName`
- optional `task`
- optional `context`
- optional `constraints`

`generate_agent_prompt` output data should include the requested workspace,
selected role, ready-to-paste prompt, suggested display name, suggested
`introduce_agent` metadata without `codexSessionId`, and manual delivery
instructions. It may return validation or session/setup errors. It must not
write to catalog storage.

`find_matching_catalog_entry` input:

- `workspace`
- `task`
- optional `projectName`
- optional `preferredType`
- optional `specialtyHints`

`find_matching_catalog_entry` output data should represent one of three
non-error outcomes: match, no match, or conflict. It may return validation,
session/setup, or storage errors.

Stable error codes for v1 should include:

- `validation_error`
- `session_error`
- `setup_error`
- `duplicate_entry`
- `not_found`
- `storage_error`

## 8. Risks and Tradeoffs

- Adding single-entry maintenance and import tools makes v1 more complete but
  increases the catalog mutation surface that must stay workspace-scoped.
- Structured envelopes add small implementation overhead but make agent
  consumption more reliable.
- Leaving exact field-level constraints to implementation gives flexibility but
  requires careful test coverage.
- Treating `no_match` and `conflict` as non-error outcomes requires callers to
  inspect `status`, not only MCP `isError`.

## 9. Verification Plan

When this tech spec is implemented as code, verification should include:

- Each v1 tool is registered with the expected snake_case name.
- Zod rejects missing or invalid required inputs.
- Tools fail before MCP initialization completes.
- Tools use default local database storage when database path env config is
  missing.
- Introduce tools enforce workspace-local duplicate rules.
- List, detail, and match only return entries for the requested workspace.
- Clear deletes only entries for the requested workspace and requires
  `confirm: true`.
- Update changes only editable metadata for entries in the requested workspace
  and rejects empty patches.
- Remove hard-deletes only entries in the requested workspace.
- Export only includes entries from the requested workspace and honors filters.
- Import writes only to the requested workspace and handles duplicates according
  to `conflictStrategy`.
- Health reports only entries from the requested workspace and does not mutate
  stored verification metadata.
- Prepare handoff renders prompts only for agents in the requested workspace and
  does not dispatch work.
- Generate prompt returns deterministic starter prompts for supported roles and
  does not write to catalog storage.
- Match returns `no_match` and `conflict` as structured non-error outcomes.
- Preview skill file sync does not mutate `SKILL.md`.
- Apply skill file sync requires `confirm: true`, an applied proposal, and a
  skill file resolved from configured skill roots.
- Registered aliases resolve to the same canonical workspace for introduce,
  list, detail, match, update, remove, clear, export, import, health, and
  handoff tools.
- Error responses use stable `status: error` envelopes and expected codes.

For this documentation change, verification is limited to reading back the spec,
checking the docs tree, running `git diff --check`, and checking git status.

## 10. Open Questions

- Should v1 tool output schemas be registered with SDK `outputSchema`, or should
  the first implementation only return `structuredContent`?
- Should `entryKey` be the raw stable reference, such as Codex session ID or
  skill name, or a generated catalog ID?
- Should `specialtyTags` allow an empty list, or require at least one tag?
- Should `list_catalog_entries` support specialty tag filtering in v1?

## 11. Decision Log

- 2026-07-12: Include five initial v1 tools: introduce agent, introduce skill,
  list, detail, and find match.
- 2026-07-12: Use snake_case tool names.
- 2026-07-12: Use MCP SDK `registerTool` with Zod `inputSchema`.
- 2026-07-12: Return structured response envelopes through `structuredContent`.
- 2026-07-12: Treat `no_match` and `conflict` as non-error routing outcomes.
- 2026-07-12: Keep update, remove, import, export, health, verification, and
  explanation tools out of the first runnable slice.
- 2026-07-13: Support the same v1 tool surface over local Streamable HTTP and
  stdio.
- 2026-07-13: Make `workspace` a required client-supplied tool input instead of
  deriving catalog scope from server config.
- 2026-07-13: Add `clear_workspace_catalog` with required confirmation for
  workspace-scoped bulk catalog deletion.
- 2026-07-15: Add `prepare_agent_handoff` for deterministic manual handoff
  prompt preparation.
- 2026-07-16: Add `generate_agent_prompt` for deterministic empty-chat starter
  prompt generation.
- 2026-07-17: Add `update_catalog_entry` and `remove_catalog_entry` for
  workspace-scoped single-entry catalog maintenance.
- 2026-07-17: Add `export_catalog` and `import_catalog` for versioned structured
  JSON backup and restore flows.
- 2026-07-17: Add `check_catalog_health` for read-only metadata-derived catalog
  health reporting.
- 2026-07-19: Add `register_workspace_alias` and canonical workspace resolution
  to prevent catalog splits caused by path, trailing-slash, and folder-name
  workspace variants.
- 2026-07-19: Add approval-gated registered skill context updates and local
  skill file sync through `preview_skill_file_sync` and `apply_skill_file_sync`.
- 2026-07-23: Add skill-only workspace catalog sync through
  `preview_workspace_catalog_sync` and `apply_workspace_catalog_sync`.
