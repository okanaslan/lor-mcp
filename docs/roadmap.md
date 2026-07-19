# Roadmap

This roadmap tracks major feature specs and implementation status for the Local
Orchestration Router (LOR) MCP Server.

## Current Implementation

Implemented in the runnable local v1:

- Deno TypeScript MCP server.
- Local Streamable HTTP server through `deno task serve`, exposed at
  `http://127.0.0.1:8765/mcp`.
- Stdio fallback through `deno task run`.
- URL-only Codex setup with
  `codex mcp add lor-mcp --url
  http://127.0.0.1:8765/mcp`.
- Server-owned local defaults for SQLite storage under `.lor-mcp/`.
- Server-owned local skill roots for approval-gated `SKILL.md` sync.
- SQLite-backed durable catalog storage scoped by resolved canonical
  client-supplied `workspace`.
- Workspace alias resolution for path, trailing-slash, and registered
  folder-name variants.
- V1 MCP tools:
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
  - `check_catalog_health`
  - `prepare_agent_handoff`
  - `generate_agent_prompt`
  - `find_matching_catalog_entry`
- Agent and skill introduction now acts as registration. The server no longer
  requires server-local pre-verification evidence before accepting new entries.
- Deterministic local fuzzy matching with registered skill context signals,
  structured match explanations, and conflict reporting.
- Structured MCP response envelopes with output schemas and stable error codes.
- Dispatch boundary: LOR prepares agent handoff prompts and stores
  `codexSessionId`; Codex-native thread tools send the prompt to reachable
  registered sessions.

Current `LOR-MCP` catalog snapshot as of 2026-07-20:

- Resolved workspace: `/Users/ablo/Developer/GitHub/okanaslan/Agentic-Router`.
- Registered agents: 2.
- Registered skills: 22.
- Current registered agents:
  - `LOR MCP Coordinator Agent`
  - `LOR MCP Backend Implementation Agent`

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
- [List Catalog Entries](feature-specs/list-catalog-entries.md): Implemented for
  v1 catalog inspection.
- [Clear Workspace Catalog](feature-specs/clear-workspace-catalog.md):
  Implemented for v1 workspace catalog reset with explicit confirmation.
- [Register Workspace Alias](feature-specs/register-workspace-alias.md):
  Implemented for v1 canonical workspace resolution and explicit alias repair.
- [Get Catalog Entry Detail](feature-specs/get-catalog-entry-detail.md):
  Implemented for v1 detail lookup.
- [Prepare Agent Handoff](feature-specs/prepare-agent-handoff.md): Implemented
  for v1 prompt preparation without dispatching to Codex.
- [Generate Agent Prompt](feature-specs/generate-agent-prompt.md): Implemented
  for v1 deterministic starter prompts for empty Codex chats and suggested
  metadata for later agent registration.
- [Update Catalog Entry](feature-specs/update-catalog-entry.md): Implemented for
  v1 partial metadata updates.
- [Registered Skill Context Updates](feature-specs/registered-skill-context-updates.md):
  Implemented for v1 approval-gated stored skill context updates.
- [Local Skill Sync](feature-specs/local-skill-sync.md): Implemented for v1
  approval-gated sync from applied stored skill context into local `SKILL.md`
  managed sections.
- [Remove Catalog Entry](feature-specs/remove-catalog-entry.md): Implemented for
  v1 single-entry hard delete.
- [Skill / Agent Existence Verification](feature-specs/existence-verification.md):
  Implemented for v1 metadata-only catalog health reporting. Blocking
  verification remains out of scope for introduction flows.
- [Routing Recommendation Explanation](feature-specs/routing-recommendation-explanation.md):
  Implemented for v1 inline deterministic match candidate explanations.
- [Conflict Handling](feature-specs/conflict-handling.md): Draft. Defines how
  Local Orchestration Router (LOR) handles equally strong catalog matches. Basic
  equally scored agent conflict reporting exists in v1 matching.
- [Catalog Export](feature-specs/catalog-export.md): Implemented for v1
  structured JSON workspace backups.
- [Catalog Import](feature-specs/catalog-import.md): Implemented for v1
  structured JSON imports with skip/fail duplicate handling.

## Next

- Keep feature specs aligned with client-supplied canonical `workspace` scoping,
  workspace alias resolution, and the Streamable HTTP runtime.
- Formalize the Codex-native dispatch pattern for registered agents. LOR can
  resolve and prepare handoff prompts today, while Codex thread tools perform
  the actual send/read loop.
- Decide whether future health refresh should probe external evidence sources
  and update stored verification metadata.
- Decide whether conflict handling needs a dedicated follow-up beyond the basic
  equally scored agent conflict reporting in v1 matching.
- Track late-future HTTP authorization discovery in
  [Future HTTP Authorization Discovery](tech-specs/future/http-authorization-discovery.md);
  the current local server remains unauthenticated and should not return fake
  OAuth/OIDC discovery metadata.
