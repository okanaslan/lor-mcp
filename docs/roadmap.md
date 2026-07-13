# Roadmap

This roadmap tracks major feature specs and implementation status for the
Agentic Router MCP Server.

## Current Implementation

Implemented in the first runnable v1 slice:

- Deno TypeScript MCP server.
- Local Streamable HTTP server through `deno task serve`, exposed at
  `http://127.0.0.1:8765/mcp`.
- Stdio fallback through `deno task run`.
- URL-only Codex setup with `codex mcp add agentic-router --url
  http://127.0.0.1:8765/mcp`.
- Server-owned local defaults for catalog namespace and SQLite storage under
  `.agentic-router/`.
- SQLite-backed durable catalog storage scoped by workspace namespace.
- V1 MCP tools:
  - `introduce_agent`
  - `introduce_skill`
  - `list_catalog_entries`
  - `get_catalog_entry_detail`
  - `find_matching_catalog_entry`
- Agent and skill introduction now acts as registration. The server no longer
  requires server-local pre-verification evidence before accepting new entries.
- Deterministic local fuzzy matching with structured match explanations and
  conflict reporting.
- Structured MCP response envelopes with output schemas and stable error
  codes.

Latest implementation verification:

- `deno task check`
- `deno task test`
- `deno task lint`
- `deno task fmt`
- `git diff --check`

## Feature Specs

- [MCP Initialization Session](feature-specs/mcp-initialization-session.md):
  Implemented for the current MCP lifecycle and Streamable HTTP session flow.
- [Introducing Agent](feature-specs/introducing-agent.md): Implemented for v1.
  Users can register a Codex agent session ID and routing metadata without
  manual server-side pre-registration.
- [Introducing Skill](feature-specs/introducing-skill.md): Implemented for v1.
  Users can register a skill name and routing metadata without manual skill-root
  pre-verification.
- [Find Matching Catalog Entry](feature-specs/find-matching-catalog-entry.md):
  Implemented for v1 deterministic local fuzzy matching.
- [List Catalog Entries](feature-specs/list-catalog-entries.md): Implemented
  for v1 catalog inspection.
- [Get Catalog Entry Detail](feature-specs/get-catalog-entry-detail.md): Draft.
  Implemented for v1 detail lookup; the spec still needs wording refresh to
  reflect the current namespace and HTTP runtime model.
- [Update Catalog Entry](feature-specs/update-catalog-entry.md): Draft. Defines
  how users edit display and routing metadata for an introduced entry.
- [Remove Catalog Entry](feature-specs/remove-catalog-entry.md): Draft. Defines
  how users remove an introduced agent or skill from the workspace catalog.
- [Skill / Agent Existence Verification](feature-specs/existence-verification.md):
  Deferred. Blocking verification was removed from v1 introduction flows.
  Future verification should be a separate health/reporting workflow.
- [Routing Recommendation Explanation](feature-specs/routing-recommendation-explanation.md):
  Partially implemented. V1 matching returns structured explanation fields;
  the richer explanation contract remains draft.
- [Conflict Handling](feature-specs/conflict-handling.md): Draft. Defines how
  Agentic Router handles equally strong catalog matches. Basic equally scored
  agent conflict reporting exists in v1 matching.
- [Catalog Import](feature-specs/catalog-import.md): Draft. Defines how users
  bulk-load catalog entries into the workspace catalog.
- [Catalog Export](feature-specs/catalog-export.md): Draft. Defines how users
  export workspace catalog entries for backup or reuse.

## Next

- Refresh feature specs that still describe initialized-session-only scoping so
  they match the current workspace namespace and Streamable HTTP runtime.
- Add update and remove tools for catalog maintenance.
- Decide whether import/export should land before richer recommendation
  explanation.
- Design non-blocking catalog health or verification reporting for introduced
  agents and skills.
