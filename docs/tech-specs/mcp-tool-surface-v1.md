# MCP Tool Surface V1

## 1. Summary

Draft. This tech spec defines the first usable MCP tool set for Agentic Router.
The v1 surface supports introducing agents and skills, inspecting the catalog,
and finding a matching catalog entry for a task.

The tool surface is designed for the current Deno TypeScript runtime, local
Streamable HTTP and stdio transports, namespace-scoped sessions, and
SQLite-backed catalog storage.

## 2. Context

Agentic Router v1 runs as a Deno TypeScript MCP server over local Streamable
HTTP, with stdio retained as a fallback. Catalog scope comes from the resolved
workspace namespace, and durable storage uses SQLite through the resolved local
database path.

The MCP TypeScript SDK supports registering tools with `registerTool`, Zod
`inputSchema` validation, `structuredContent`, text `content`, and `isError`
for error results. V1 should use those SDK surfaces directly.

Existing feature specs define more catalog capabilities than the first
implementation should expose. The first tool set should cover a complete basic
workflow without adding update, remove, import, export, health, existence
verification, or explanation tools.

## 3. Goals

- Define the minimal usable routing workflow.
- Keep v1 tool names stable and predictable.
- Define a stable structured response envelope.
- Keep MCP handlers thin over session and catalog domain modules.
- Avoid exposing namespace or storage details in normal tool inputs.
- Keep later tool expansions compatible with the v1 response style.

## 4. Non-Goals

- Add update or remove tools.
- Add import or export tools.
- Add catalog health tools.
- Add skill or agent existence verification tools.
- Generate agent handoff prompts.
- Define the full matching algorithm.
- Define the recommendation explanation contract.

## 5. Proposed Design

V1 should register five MCP tools with snake_case names:

- `introduce_agent`
- `introduce_skill`
- `list_catalog_entries`
- `get_catalog_entry_detail`
- `find_matching_catalog_entry`

Each tool should be registered with the MCP SDK `registerTool` API and a Zod
`inputSchema`. Tool handlers should resolve the active initialized session and
catalog namespace through the session module, then call catalog domain or
repository functions.

Tool inputs must not include `catalogNamespace`, `connectionId`,
`mcpSessionId`, or `AGENTIC_ROUTER_DB_PATH`. Those values are server
configuration and session context, not caller-controlled tool arguments.

All v1 tools must require:

- Completed MCP initialization.
- Resolved catalog namespace.
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

Including update and remove in v1 was considered. It was not chosen because the
first usable routing workflow only needs introduction, inspection, and matching.

Including import, export, health, verification, and explanation tools in v1 was
considered. It was not chosen because those tools depend on additional specs
and would widen the first implementation too much.

Text-only responses were considered. They were not chosen because Codex agents
need stable structured output to make reliable routing decisions.

Fully specifying every field-level Zod constraint in this tech spec was
considered. It was not chosen because feature specs already define the
required fields, and implementation can refine exact validation constraints
without changing the tool surface.

## 7. Implementation Notes

`introduce_agent` input:

- `codexSessionId`
- `projectName`
- `displayName`
- `primarySpecialty`
- `specialtyTags`

`introduce_agent` output data should include the created agent entry metadata.
It may return validation, session/setup, duplicate, or storage errors.

`introduce_skill` input:

- `skillName`
- `projectName`
- `displayName`
- `primarySpecialty`
- `specialtyTags`

`introduce_skill` output data should include the created skill entry metadata.
It may return validation, session/setup, duplicate, or storage errors.

`list_catalog_entries` input:

- optional `entryType`
- optional `projectName`

`list_catalog_entries` output data should include compact catalog entries. It
may return validation, session/setup, or storage errors.

`get_catalog_entry_detail` input:

- `entryType`
- `entryKey`

`get_catalog_entry_detail` output data should include full stored metadata for
one entry. It may return validation, session/setup, not-found, or storage
errors.

`find_matching_catalog_entry` input:

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

- Keeping v1 to five tools means update and remove workflows need a later tool
  surface expansion.
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
- Tools use the resolved catalog namespace when namespace env config is
  missing.
- Tools use default local database storage when database path env config is
  missing.
- Introduce tools enforce namespace-local duplicate rules.
- List, detail, and match only return entries from the active namespace.
- Match returns `no_match` and `conflict` as structured non-error outcomes.
- Error responses use stable `status: error` envelopes and expected codes.

For this documentation change, verification is limited to reading back the
spec, checking the docs tree, running `git diff --check`, and checking git
status.

## 10. Open Questions

- Should v1 tool output schemas be registered with SDK `outputSchema`, or
  should the first implementation only return `structuredContent`?
- Should `entryKey` be the raw stable reference, such as Codex session ID or
  skill name, or a generated catalog ID?
- Should `specialtyTags` allow an empty list, or require at least one tag?
- Should `list_catalog_entries` support specialty tag filtering in v1?

## 11. Decision Log

- 2026-07-12: Include five v1 tools: introduce agent, introduce skill, list,
  detail, and find match.
- 2026-07-12: Use snake_case tool names.
- 2026-07-12: Use MCP SDK `registerTool` with Zod `inputSchema`.
- 2026-07-12: Return structured response envelopes through
  `structuredContent`.
- 2026-07-12: Treat `no_match` and `conflict` as non-error routing outcomes.
- 2026-07-12: Keep update, remove, import, export, health, verification, and
  explanation tools out of v1.
- 2026-07-13: Support the same v1 tool surface over local Streamable HTTP and
  stdio.
