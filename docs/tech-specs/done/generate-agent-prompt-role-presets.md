# Generate Agent Prompt Role Presets

## 1. Summary

Implemented for v1. This tech spec defines the technical design for
`generate_agent_prompt`, a stateless MCP tool that renders deterministic starter
prompts for empty Codex chats from built-in role presets.

The tool returns ready-to-paste prompt text, suggested `introduce_agent`
metadata for later registration, and manual delivery instructions. It does not
create Codex chats, message agents, register agents, or write to SQLite.

## 2. Context

`generate_agent_prompt` supports bootstrapping a new empty Codex chat before a
real Codex session ID exists. This is separate from `prepare_agent_handoff`,
which prepares a task handoff prompt for an agent that has already been
introduced into the workspace catalog.

The active v1 tool surface covers catalog registration, listing, detail lookup,
clearing, matching, prepared handoff prompts, and empty-chat starter prompt
generation.

## 3. Goals

- Render deterministic starter prompts from built-in role presets.
- Return suggested metadata compatible with later `introduce_agent` calls.
- Keep prompt generation workspace-aware and stateless.
- Preserve the manual-delivery boundary for empty Codex chats.
- Avoid LLM generation, storage writes, and hidden Codex integrations.

## 4. Non-Goals

- Create, send to, steer, or verify a Codex chat.
- Register an agent before a Codex session ID exists.
- Persist generated prompts or custom role presets.
- Query catalog entries or include hidden workspace data.
- Replace `prepare_agent_handoff` for already introduced agents.

## 5. Proposed Design

Add a prompt-generation domain module with static role preset definitions and a
deterministic renderer. The MCP handler should remain thin: validate input, call
the renderer, and wrap the result in the existing structured response envelope.

The tool input should include:

- `workspace`: required client workspace path, registered alias, or stable
  workspace slug.
- `role`: required built-in role preset name.
- `projectName`: optional project name for prompt and metadata text.
- `task`: optional first task or role context.
- `context`: optional supporting context.
- `constraints`: optional user-supplied constraints for the new agent.

Supported role presets for v1:

- `backend`
- `frontend`
- `react_native_mobile`
- `figma_design`
- `code_review`
- `qa`
- `devops`
- `product`
- `marketing`
- `email`

The tool output data should include:

- `workspace`
- `role`
- `prompt`
- `displayName`
- `suggestedAgentMetadata`
- `delivery`: `{ mode: "manual", instruction: string }`

`suggestedAgentMetadata` should match the stable parts of `introduce_agent`
input:

- `projectName`
- `displayName`
- `primarySpecialty`
- `specialtyTags`
- optional `handoff`

It must not include `codexSessionId`, because that value exists only after the
user creates the new Codex chat.

Each role preset should define:

- Suggested display name.
- Primary specialty.
- Specialty tags.
- Starter prompt sections.
- Optional default `handoff` metadata when useful.

Generated prompts must instruct the new agent to:

- Read repo instructions before changing files.
- Respect planning-only, review-only, and learn-first tasks.
- Keep changes scoped to the request.
- Preserve user and other-agent work.
- Report exact verification results.

Optional `task`, `context`, and `constraints` should be rendered into explicit
sections when supplied. Missing optional fields should simply omit those
sections.

## 6. Alternatives Considered

LLM-generated starter prompts were considered. They were not chosen because the
feature needs deterministic, testable output.

Persisting generated prompts was considered. It was not chosen because v1 only
needs ready-to-paste output and suggested metadata.

Creating Codex chats directly was considered. It was not chosen because Local
Orchestration Router (LOR) should not depend on hidden or undocumented Codex app
internals.

Deriving presets from the catalog was considered. It was not chosen because
empty-chat prompt generation should not expose catalog contents or require
storage access.

## 7. Implementation Notes

The renderer can live outside catalog storage because it does not need SQLite or
repository access. Role presets should be static TypeScript data with narrow
types so missing preset fields are caught by `deno check`.

Validation should trim all string inputs. Missing `workspace` or `role` should
return `validation_error`. Unknown roles should return `validation_error` with
the supported role names in error details.

The MCP tool should use the same response envelope as the existing catalog
tools. Successful responses should use `status: "ok"` and place the generated
payload under `data`.

`mcp-tool-surface-v1.md` should include `generate_agent_prompt` in the active
MCP surface while preserving the manual delivery boundary.

## 8. Risks and Tradeoffs

- Static presets are predictable but may be less tailored than model-generated
  prompts.
- Generic role wording can drift from user expectations if presets are not kept
  small and reviewable.
- Returning suggested handoff metadata before the agent exists may imply future
  registration, so responses must state that registration still requires a real
  Codex session ID.
- Keeping the tool stateless avoids persistence complexity but means users must
  save or paste generated prompts themselves.

## 9. Verification Plan

When implemented, verification should include:

- Domain tests for every supported role returning a non-empty prompt and valid
  suggested metadata.
- Rendering tests for optional `projectName`, `task`, `context`, and
  `constraints`.
- Validation tests for missing `workspace`, missing `role`, and unknown role.
- Schema/tool tests for the MCP input contract.
- HTTP `tools/list` coverage for the active MCP tool surface.
- `deno task check`, `deno task test`, `deno task lint`, `deno task fmt`, and
  `git diff --check`.

For documentation-only changes, verification is limited to formatting touched
docs and running `git diff --check`.

## 10. Open Questions

- Should future versions allow user-defined role presets?
- Should generated prompts include suggested skill usage when matching skills
  exist in the workspace catalog?
- Should a later documented Codex integration optionally create the empty chat?

## 11. Decision Log

- 2026-07-16: Keep `generate_agent_prompt` stateless and independent of catalog
  storage.
- 2026-07-16: Use deterministic built-in role presets instead of LLM-generated
  prompt text.
- 2026-07-16: Return suggested `introduce_agent` metadata without
  `codexSessionId`.
- 2026-07-16: Add `generate_agent_prompt` to the active MCP tool surface.
