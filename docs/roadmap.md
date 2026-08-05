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
  - `introduce_subagent`
  - `list_catalog_entries`
  - `clear_workspace_catalog`
  - `register_workspace_alias`
  - `promote_skill_to_global`
  - `get_catalog_entry_detail`
  - `update_catalog_entry`
  - `retire_agent`
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
  - `prepare_agent_regeneration`
  - `generate_agent_prompt`
  - `find_matching_catalog_entry`
- Agent and skill introduction now acts as registration. The server no longer
  requires server-local pre-verification evidence before accepting new entries.
- Global skills can be introduced directly with `scope: "global"` or promoted
  from workspace skills with `promote_skill_to_global`. Global skills are
  included in list and match by default; agents remain workspace-scoped.
- Subagent suggestions are implemented for reusable prompt profiles with
  workspace/global scope. Workspace and global subagents are included in list
  and match by default, while health checks remain agent/skill-only.
- Agent replacement uses immutable session identity: new agents register as
  active records, old records can be marked retired, and matching excludes
  retired agents by default.
- Deterministic local fuzzy matching with registered skill context signals,
  structured match explanations, and agents-only near-equal conflict reporting.
- Structured MCP response envelopes with output schemas and stable error codes.
- Dispatch boundary: LOR prepares agent handoff prompts and stores
  `codexSessionId`; Codex-native thread tools send the prompt to reachable
  registered sessions.
- Delegated task lifecycle and follow-up/result retrieval are implemented with
  durable task records, task-scoped messages, adapter-backed dispatch outcomes
  when available, and queued manual delivery when the local runtime has no
  Codex-native dispatcher.
- Delegated task lifecycle, task follow-up/result collection, workspace memory,
  workspace diagnostics, and HTTP discovery probe log cleanup are planned
  follow-up improvements.

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
  pre-verification. Skills can be workspace-scoped or global.
- [Global Skill Scope](feature-specs/global-skill-scope.md): Implemented for v1.
  Defines shared `scope: "global"` behavior for skills only, including direct
  global skill creation, workspace skill promotion, default list/match
  inclusion, global skill management from any workspace, and workspace-local
  export behavior. Technical planning is tracked in
  [Global Skill Scope](tech-specs/done/global-skill-scope.md).
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
- [Agent Reachability And Dispatch Model](feature-specs/agent-reachability-and-dispatch-model.md):
  Implemented. Defines passive reachability metadata for registered agents, with
  existing and new agents defaulting to `unknown`, reachability updated only by
  Codex-native dispatch outcomes, unreachable agents still visible in matching,
  and handoff preparation failing for known unreachable agents. Technical
  planning is tracked in
  [Agent Reachability And Dispatch Model](tech-specs/done/agent-reachability-and-dispatch-model.md).
- [Delegated Agent Task Lifecycle](feature-specs/delegated-agent-task-lifecycle.md):
  Implemented. Defines `send_agent_task`, `get_agent_task_status`, and
  `list_active_tasks` for workspace-scoped delegated work sent or queued for
  registered agents. Technical planning is tracked in
  [Delegated Agent Task Lifecycle](tech-specs/done/delegated-agent-task-lifecycle.md).
- [Agent Task Follow-Up And Result Collection](feature-specs/agent-task-follow-up-and-result-collection.md):
  Implemented. Defines `append_agent_context` and `get_agent_task_result` for
  delegated task follow-up and result retrieval. Technical planning is tracked
  in
  [Agent Task Follow-Up And Result Collection](tech-specs/done/agent-task-follow-up-and-result-collection.md).
- [Workspace Memory Primitives](feature-specs/workspace-memory-primitives.md):
  Planned. Defines lightweight workspace notes for branch plans, review
  summaries, and reapply notes. Technical planning is tracked in
  [Workspace Memory Primitives](tech-specs/future/workspace-memory-primitives.md).
- [HTTP Discovery Probe Logging](feature-specs/http-discovery-probe-logging.md):
  Planned. Defines lower-noise logging for expected OAuth/OIDC discovery probes
  without adding fake auth metadata. Technical planning is tracked in
  [HTTP Discovery Probe Logging](tech-specs/future/http-discovery-probe-logging.md).
- [Workspace Diagnostics](feature-specs/workspace-diagnostics.md): Planned.
  Defines read-only diagnostics for workspace resolution, aliases, catalog
  counts, and sanitized runtime/storage status. Technical planning is tracked in
  [Workspace Diagnostics](tech-specs/future/workspace-diagnostics.md).
- [Prepare Agent Regeneration](feature-specs/prepare-agent-regeneration.md):
  Implemented for v1 deterministic prompt preparation for replacing a registered
  context-heavy Codex agent with a fresh chat and later `introduce_agent`
  registration.
- [Agent Lifecycle Retirement](feature-specs/agent-lifecycle-retirement.md):
  Implemented for v1 immutable session identity, explicit `retire_agent`
  lifecycle mutation, and default routing exclusion for retired agents.
- [Generate Agent Prompt](feature-specs/generate-agent-prompt.md): Implemented
  for v1 deterministic starter prompts for empty Codex chats and suggested
  metadata for later agent registration.
- [Workspace Catalog Sync](feature-specs/workspace-catalog-sync.md): Implemented
  for v1 workspace-local skill and subagent catalog sync with preview,
  confirmation-gated apply, duplicate skipping, missing-entry reporting, and
  optional generated agent starter prompt metadata. Technical planning is
  tracked in
  [Workspace Catalog Sync Tool Surface](tech-specs/done/workspace-catalog-sync-tool-surface.md)
  and
  [Workspace Catalog Sync Service Flow](tech-specs/done/workspace-catalog-sync-service-flow.md).
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
- [Conflict Handling](feature-specs/conflict-handling.md): Implemented for v1
  agents-only near-equal ambiguity handling with deterministic auto-selection
  for exact project-name and stronger primary-specialty evidence.
- [Catalog Export](feature-specs/catalog-export.md): Implemented for v1
  structured JSON workspace backups.
- [Catalog Import](feature-specs/catalog-import.md): Implemented for v1
  structured JSON imports with skip/fail duplicate handling.
- [Subagent Suggestions](feature-specs/subagent-suggestions.md): Implemented for
  v1 reusable limited-scope prompt profiles, with workspace/global scope,
  references to agents and skills, inclusion in matching, rendered prompts in
  introduction/detail/match results, and workspace sync/export/import support
  for workspace-local subagents. Technical planning is tracked in
  [Subagent Suggestions](tech-specs/done/subagent-suggestions.md).

## Next

- Keep feature specs aligned with client-supplied canonical `workspace` scoping,
  workspace alias resolution, and the Streamable HTTP runtime.
- Add workspace diagnostics and memory primitives around delegated workflows.
- Add workspace diagnostics and HTTP discovery probe logging cleanup as
  lower-risk operational improvements.
- Add workspace memory primitives once the delegated task model is stable.
- Formalize the Codex-native dispatch pattern for registered agents. LOR can
  resolve and prepare handoff prompts today, while Codex thread tools perform
  the actual send/read loop.
- Decide whether future health refresh should probe external evidence sources
  and update stored verification metadata.
- Decide whether future conflict handling should persist caller feedback or
  expand beyond agents-only ambiguity handling.
- Track late-future HTTP authorization discovery in
  [Future HTTP Authorization Discovery](tech-specs/future/http-authorization-discovery.md);
  the current local server remains unauthenticated and should not return fake
  OAuth/OIDC discovery metadata.
