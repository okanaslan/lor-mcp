# Agent Handoff Metadata

## 1. Summary

Implemented for v1 metadata storage. This tech spec defines optional stored
metadata for introduced Codex agents so a current Codex agent can prepare a
safe, task-specific handoff prompt after matching or inspecting an agent.

Local Orchestration Router (LOR) stores handoff guidance in the catalog and can render a
ready-to-send prompt through `prepare_agent_handoff`, but it does not send work
to another agent.

## 2. Context

The handoff use cases require "contact or prompt guidance" after Local Orchestration Router (LOR)
recommends an introduced Codex agent. Current agent specs store a Codex session
ID and routing metadata, but they do not define what guidance a caller should
use to prepare a handoff.

The v1 MCP tool surface includes a prompt-preparation handoff tool. Existing
catalog flows carry this metadata: `introduce_agent` may accept it,
`get_catalog_entry_detail` returns it for agent entries, `prepare_agent_handoff`
renders it for a task, and future update tools may edit it.

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

The metadata is stored manually. Local Orchestration Router (LOR) does not generate these fields
from task text or model output in v1.

`handoffPromptTemplate` supports these basic placeholders:

- `task`
- `context`
- `projectName`
- `agentDisplayName`
- `primarySpecialty`
- `specialtyTags`

The current Codex agent remains responsible for deciding whether to hand off and
using whatever Codex workflow is available to send or present the rendered
prompt.

Matching results should not include full handoff metadata. A caller may fetch
agent detail for inspection, or pass the matched agent entry key to
`prepare_agent_handoff` to render a prompt. This keeps match responses focused
on routing and recommendation signals.

Handoff metadata must not be treated as proof that the target Codex session is
reachable or still active.

## 6. Alternatives Considered

Generating handoff guidance in Local Orchestration Router (LOR) was considered. It was not chosen
for v1 because it would add prompt-generation policy and make handoff wording
less user-owned.

Adding a dedicated dispatch MCP tool was considered. It was not chosen because
Codex owns subagent orchestration and Local Orchestration Router (LOR) should not depend on
unsupported communication internals.

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
record. The storage design should keep it scoped by the same workspace as the
rest of the agent record.

`introduce_agent` may accept an optional `handoff` object. Missing handoff
metadata must not prevent agent introduction.

`get_catalog_entry_detail` should include `handoff` metadata only for agent
entries that have it. Skill detail responses should not include handoff
metadata.

`prepare_agent_handoff` should render stored `handoffPromptTemplate` text with
supported task and agent placeholders. If no handoff metadata is stored, it
should return a generic prompt based on the agent metadata, task, and optional
context.

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
- Prepared handoff renders stored templates and generic fallback prompts.
- Stored templates preserve supported placeholders.
- Handoff metadata remains workspace-scoped with the agent record.

For this documentation change, verification is limited to reading back the spec,
checking the docs tree, running `git diff --check`, and checking git status.

## 10. Open Questions

- Should future versions validate template placeholders strictly?
- Should handoff metadata become required for agents marked as handoff-capable?
- Should update and remove specs be aligned to cover handoff metadata edits?

## 11. Decision Log

- 2026-07-12: Apply handoff metadata to introduced agents only.
- 2026-07-12: Store handoff metadata manually instead of generating it in
  Local Orchestration Router (LOR).
- 2026-07-12: Make handoff metadata optional.
- 2026-07-12: Return full handoff metadata through agent detail, not matching
  results.
- 2026-07-12: Support basic placeholders in `handoffPromptTemplate`.
- 2026-07-15: Add `prepare_agent_handoff` as a prompt-preparation tool without
  dispatching to Codex.
