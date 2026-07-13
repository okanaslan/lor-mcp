# Agent Handoff Metadata

## 1. Summary

Draft. This tech spec defines optional stored metadata for introduced Codex
agents so a current Codex agent can prepare a safe, task-specific handoff
prompt after fetching agent detail.

Agentic Router stores handoff guidance in the catalog but does not send work to
another agent or generate handoff prompts in v1.

## 2. Context

The handoff use cases require "contact or prompt guidance" after Agentic Router
recommends an introduced Codex agent. Current agent specs store a Codex session
ID and routing metadata, but they do not define what guidance a caller should
use to prepare a handoff.

The v1 MCP tool surface excludes a dedicated handoff tool. Existing catalog
flows should carry this metadata instead: `introduce_agent` may accept it,
`get_catalog_entry_detail` returns it for agent entries, and future update
tools may edit it.

## 3. Goals

- Give Codex agents enough metadata to prepare handoff prompts.
- Keep handoff guidance deterministic and user-owned.
- Avoid inventing unsupported agent-to-agent communication behavior.
- Keep matching responses compact.
- Keep handoff metadata workspace-scoped with the agent record.

## 4. Non-Goals

- Send work to another Codex agent.
- Generate handoff prompts with an LLM.
- Verify the target agent is reachable.
- Add handoff metadata for skills.
- Add a new v1 MCP tool.
- Define the final Codex inter-agent communication mechanism.

## 5. Proposed Design

Introduced agent records may include optional `handoff` metadata. Introduced
skill records must not store handoff metadata in v1.

The `handoff` metadata object should contain:

- `whenToUse`: short guidance for when this agent is a good handoff target.
- `handoffPromptTemplate`: reusable prompt template for assigning work to the
  agent.
- `requiredContext`: list of context items the current agent should include.
- `expectedOutput`: description of the output expected from the target agent.
- `constraints`: limits, warnings, or project rules relevant to the handoff.

The metadata is stored manually. Agentic Router does not generate these fields
from task text or model output in v1.

`handoffPromptTemplate` supports these basic placeholders:

- `task`
- `projectName`
- `agentDisplayName`
- `primarySpecialty`
- `specialtyTags`

The current Codex agent remains responsible for deciding whether to hand off,
filling the prompt template with task-specific context, and using whatever
Codex workflow is available to send or present that prompt.

Matching results should not include full handoff metadata. A caller should
fetch agent detail before preparing a handoff. This keeps match responses
focused on routing and recommendation signals.

Handoff metadata must not be treated as proof that the target Codex session is
reachable or still active.

## 6. Alternatives Considered

Generating handoff guidance in Agentic Router was considered. It was not chosen
for v1 because it would add prompt-generation policy and make handoff wording
less user-owned.

Adding a dedicated handoff MCP tool was considered. It was not chosen because
the v1 tool surface intentionally stays focused on introduce, list, detail, and
match operations.

Making handoff metadata required for all agents was considered. It was not
chosen because agents should still be introducible and matchable even when the
user only knows basic routing metadata.

Including full handoff metadata in match results was considered. It was not
chosen because callers can fetch detail for promising agents, and match
responses should stay compact.

Adding handoff metadata to skills was considered. It was not chosen because
skills are used directly by the current agent and do not need inter-agent
handoff guidance.

## 7. Implementation Notes

For v1 storage, handoff metadata can be stored as structured JSON on the agent
record. The storage design should keep it scoped by the same workspace
as the rest of the agent record.

`introduce_agent` may accept an optional `handoff` object. Missing handoff
metadata must not prevent agent introduction.

`get_catalog_entry_detail` should include `handoff` metadata only for agent
entries that have it. Skill detail responses should not include handoff
metadata.

Future update tools should allow editing handoff metadata without changing the
stable Codex session ID. Future remove behavior should remove handoff metadata
with the agent record.

The first implementation may preserve template placeholders as text. Strict
placeholder validation can be added later if needed.

## 8. Risks and Tradeoffs

- Optional metadata means some recommended agents may not be immediately
  handoff-ready.
- Manual guidance preserves user ownership but requires users to write useful
  instructions.
- Template placeholders make prompt preparation more reliable but add a small
  contract that future implementations must preserve.
- Keeping full handoff metadata out of match results requires an extra detail
  lookup before handoff.

## 9. Verification Plan

When this tech spec is implemented as code, verification should include:

- Agents can be introduced without handoff metadata.
- Agents can be introduced with valid handoff metadata.
- Skill records reject or ignore handoff metadata.
- Agent detail includes stored handoff metadata.
- Skill detail does not include handoff metadata.
- Match results omit full handoff metadata.
- Stored templates preserve supported placeholders.
- Handoff metadata remains workspace-scoped with the agent record.

For this documentation change, verification is limited to reading back the
spec, checking the docs tree, running `git diff --check`, and checking git
status.

## 10. Open Questions

- Should future versions validate template placeholders strictly?
- Should handoff metadata become required for agents marked as
  handoff-capable?
- Should a later tool render a ready-to-send prompt from the template and task?
- Should update and remove specs be aligned to cover handoff metadata edits?

## 11. Decision Log

- 2026-07-12: Apply handoff metadata to introduced agents only.
- 2026-07-12: Store handoff metadata manually instead of generating it in
  Agentic Router.
- 2026-07-12: Do not add a v1 handoff MCP tool.
- 2026-07-12: Make handoff metadata optional.
- 2026-07-12: Return full handoff metadata through agent detail, not matching
  results.
- 2026-07-12: Support basic placeholders in `handoffPromptTemplate`.
