# Roadmap

This roadmap tracks major feature specs and implementation status for the Local
Orchestration Router (LOR) MCP Server.

## Current Implementation

Implemented in the runnable local 2.0.0 server:

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
- Current MCP tools:
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
- Skill and subagent introduction acts as registration. The server no longer
  requires server-local pre-verification evidence before accepting new skill
  entries.
- Skill registrations default to global scope unless `scope: "workspace"` is
  supplied. Workspace-local skills can also be promoted with
  `promote_skill_to_global`. Global skills are included in `list_skills` and
  `find_matching_skill` by default; agents remain workspace-scoped.
- Subagent suggestions are implemented for reusable prompt profiles with
  workspace/global scope. Subagent registrations default to global scope unless
  `scope: "workspace"` is supplied. Workspace and global subagents are included
  in `list_subagents` and `find_matching_subagent` by default.
- `check_catalog_health` includes skill/subagent coverage metrics, project and
  specialty coverage, coverage status, and recommended actions for improving
  task-initialization readiness.
- Deterministic local fuzzy matching with registered skill context signals,
  structured match explanations, and ranked skill/subagent results.
- Structured MCP response envelopes with output schemas and stable error codes.
- Dispatch boundary: LOR can generate manual Codex prompts, but Codex-native
  thread tools own any actual chat creation, send, or read loop.
- Delegated task lifecycle and follow-up/result retrieval internals exist for
  compatibility, but V2 hides those tools from the normal public MCP surface.
- Workspace diagnostics is implemented for read-only alias, catalog count, and
  sanitized setup visibility, including local skill and `AGENTS.md` alignment.
- HTTP discovery probe logging cleanup is implemented so expected auth discovery
  `404` responses log below warning severity without adding fake auth endpoints.
- Workspace memory is implemented as durable workspace-scoped notes outside the
  routing catalog. Notes do not support global scope.

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
- [Introducing Agent](feature-specs/introducing-agent.md): Removed from the
  public V2 MCP tool surface.
- [Introducing Skill](feature-specs/introducing-skill.md): Implemented for v1.
  Users can register a skill name and routing metadata without manual skill-root
  pre-verification. Skills can be workspace-scoped or global.
- [Global Skill Scope](feature-specs/global-skill-scope.md): Implemented for v1.
  Defines shared `scope: "global"` behavior for skills only, including direct
  global skill creation, workspace skill promotion, default list/match
  inclusion, global skill management from any workspace, and workspace-local
  export behavior. Technical planning is tracked in
  [Global Skill Scope](tech-specs/done/global-skill-scope.md).
- [Type-Specific Tool Surface](feature-specs/type-specific-tool-surface.md):
  Implemented for 2.0.0, then tightened for V2 by removing public registered
  agent catalog tools while keeping explicit skill and subagent tool names.
- [Find Matching Catalog Entry](feature-specs/find-matching-catalog-entry.md):
  Implemented through `find_matching_skill` and `find_matching_subagent`
  deterministic local fuzzy matching.
- [List Catalog Entries](feature-specs/list-catalog-entries.md): Implemented
  through `list_skills` and `list_subagents` in the current public surface.
- [Clear Workspace Catalog](feature-specs/clear-workspace-catalog.md):
  Implemented through `clear_workspace_skills` and `clear_workspace_subagents`
  with explicit confirmation in the current public surface.
- [Register Workspace Alias](feature-specs/register-workspace-alias.md):
  Implemented for v1 canonical workspace resolution and explicit alias repair.
- [Get Catalog Entry Detail](feature-specs/get-catalog-entry-detail.md):
  Implemented through `get_skill_detail` and `get_subagent_detail` in the
  current public surface.
- [Prepare Agent Handoff](feature-specs/prepare-agent-handoff.md): Removed from
  the public V2 MCP tool surface.
- [Agent Reachability And Dispatch Model](feature-specs/agent-reachability-and-dispatch-model.md):
  Implemented. Defines passive reachability metadata for registered agents, with
  existing and new agents defaulting to `unknown`, reachability updated only by
  Codex-native dispatch outcomes, unreachable agents still visible in matching,
  and handoff preparation failing for known unreachable agents. Technical
  planning is tracked in
  [Agent Reachability And Dispatch Model](tech-specs/done/agent-reachability-and-dispatch-model.md).
- [Delegated Agent Task Lifecycle](feature-specs/delegated-agent-task-lifecycle.md):
  Implemented internally in 2.0.0, then hidden from the normal public MCP
  surface by V2 tool-surface simplification. Technical planning is tracked in
  [Delegated Agent Task Lifecycle](tech-specs/done/delegated-agent-task-lifecycle.md).
- [Agent Task Follow-Up And Result Collection](feature-specs/agent-task-follow-up-and-result-collection.md):
  Implemented internally in 2.0.0, then hidden from the normal public MCP
  surface by V2 tool-surface simplification. Technical planning is tracked in
  [Agent Task Follow-Up And Result Collection](tech-specs/done/agent-task-follow-up-and-result-collection.md).
- [Workspace Memory Primitives](feature-specs/workspace-memory-primitives.md):
  Implemented. Defines lightweight workspace notes for branch plans, review
  summaries, reapply notes, and deterministic note-specific matching. Technical
  planning is tracked in
  [Workspace Memory Primitives](tech-specs/done/workspace-memory-primitives.md).
- [HTTP Discovery Probe Logging](feature-specs/http-discovery-probe-logging.md):
  Implemented. Defines lower-noise logging for expected OAuth/OIDC discovery
  probes without adding fake auth metadata. Technical planning is tracked in
  [HTTP Discovery Probe Logging](tech-specs/done/http-discovery-probe-logging.md).
- [Workspace Diagnostics](feature-specs/workspace-diagnostics.md): Implemented.
  Defines `get_workspace_diagnostics` for read-only workspace resolution,
  aliases, catalog counts, and sanitized runtime/storage status. Technical
  planning is tracked in
  [Workspace Diagnostics](tech-specs/done/workspace-diagnostics.md).
- [Prepare Agent Regeneration](feature-specs/prepare-agent-regeneration.md):
  Removed from the public V2 MCP tool surface.
- [Agent Lifecycle Retirement](feature-specs/agent-lifecycle-retirement.md):
  Removed from the public V2 MCP tool surface.
- [Generate Agent Prompt](feature-specs/generate-agent-prompt.md): Implemented
  for v1 deterministic starter prompts for empty Codex chats.
- [Workspace Catalog Sync](feature-specs/workspace-catalog-sync.md): Implemented
  for v1 workspace-local skill and subagent catalog sync with preview,
  confirmation-gated apply, duplicate skipping, missing-entry reporting, and
  optional generated agent starter prompt metadata. Technical planning is
  tracked in
  [Workspace Catalog Sync Tool Surface](tech-specs/done/workspace-catalog-sync-tool-surface.md)
  and
  [Workspace Catalog Sync Service Flow](tech-specs/done/workspace-catalog-sync-service-flow.md).
- [Update Catalog Entry](feature-specs/update-catalog-entry.md): Implemented
  through `update_skill` and `update_subagent` partial metadata updates in the
  current public surface.
- [Registered Skill Context Updates](feature-specs/registered-skill-context-updates.md):
  Implemented for v1 approval-gated stored skill context updates.
- [Local Skill Sync](feature-specs/local-skill-sync.md): Implemented for v1
  approval-gated sync from applied stored skill context into local `SKILL.md`
  managed sections.
- [Remove Catalog Entry](feature-specs/remove-catalog-entry.md): Implemented
  through `remove_skill` and `remove_subagent` hard deletes in the current
  public surface.
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

- V2 direction planning is tracked in [V2 Direction](v2/readme.md) and
  [V2 Feedback Summary](v2/feedback-summary.md). The current proposed V2 shift
  is to reduce task-management and agent-communication tooling, focus on
  short-lived task-oriented agents, and strengthen skill/subagent readiness.
- [V2 Tool Surface Simplification](feature-specs/v2-tool-surface-simplification.md):
  Implemented. Task lifecycle tools and registered-agent catalog tools are
  hidden from the normal public MCP surface while prompt generation remains
  available.
- [V2 Agent Initialization Context](feature-specs/v2-agent-initialization-context.md):
  Superseded by the simplified public V2 surface. Use skill/subagent matching
  plus `generate_agent_prompt` for manual fresh-chat context.
- [V2 Skill And Subagent Coverage Health](feature-specs/v2-skill-and-subagent-coverage-health.md):
  Implemented. `check_catalog_health` returns workspace/global skill and
  subagent coverage, project/specialty coverage, readiness status, and
  recommended actions.
- [V2 Local Skill And AGENTS.md Integration](feature-specs/v2-local-skill-and-agents-integration.md):
  Implemented. `get_workspace_diagnostics` reports local `AGENTS.md` status,
  configured local skill roots, unregistered local skills, registered LOR skills
  without matching local files, and recommended actions.
- Keep feature specs aligned with client-supplied canonical `workspace` scoping,
  workspace alias resolution, and the Streamable HTTP runtime.
- Formalize the Codex-native dispatch pattern outside LOR's public registered
  agent catalog tool surface.
- Decide whether future health refresh should probe external evidence sources
  and update stored verification metadata.
- Decide whether future conflict handling should persist caller feedback or
  expand beyond agents-only ambiguity handling.
- Track late-future HTTP authorization discovery in
  [Future HTTP Authorization Discovery](tech-specs/future/http-authorization-discovery.md);
  the current local server remains unauthenticated and should not return fake
  OAuth/OIDC discovery metadata.
