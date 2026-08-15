# Prepare Agent Regeneration

## 1. Summary

Implemented internally for v1, then removed from the codebase and the normal
public V2 MCP surface. This historical feature let a caller prepare a
ready-to-paste prompt for replacing a registered Codex agent whose current chat
had become too context-heavy.

For V2 public workflows, initialize fresh short-lived task agents with
`generate_agent_prompt` and relevant skill/subagent context.

## 2. Goals

- Help users regenerate useful agents with clean Codex chat context.
- Preserve the source agent's role, project focus, specialty metadata, tags, and
  handoff guidance.
- Return suggested replacement metadata for historical/internal compatibility
  workflows.
- Keep delivery and catalog replacement manual and explicit.
- Avoid relying on hidden Codex internals or automatic old-agent messaging.

## 3. Non-Goals

- Create a new Codex chat.
- Message the old agent or request a self-summary.
- Register the replacement agent before a new Codex session ID exists.
- Automatically retire, update, or remove the old catalog entry.
- Generate prompts with an LLM.
- Replace public `generate_agent_prompt` flows for short-lived task agents.

## 4. Functional Requirements

- `prepare_agent_regeneration` is no longer implemented or registered.
- LOR must not prepare regeneration prompts for registered-agent entries in
  normal V2 workflows.
- Task-oriented prompt setup should use `generate_agent_prompt`,
  `find_matching_skill`, and `find_matching_subagent`.
- LOR must not mutate catalog records for registered-agent regeneration.

## 5. User Stories / Use Cases

- [Regenerate Context Heavy Agent](../use-cases/regenerate-context-heavy-agent.md)

## 6. Data Model

Conceptual input fields:

- `workspace`: client workspace path, registered alias, or stable workspace
  slug.
- `agentEntryKey`: existing registered agent key.
- `reason`: optional explanation for why the agent is being regenerated.
- `carryForwardContext`: optional summary or instructions to preserve across the
  regeneration.
- `replacementTask`: optional first task for the replacement agent.
- `includeRegistrationInstructions`: optional boolean, default `true`.

Conceptual output fields:

- `workspace`: resolved workspace.
- `sourceAgent`: compact metadata for the old registered agent.
- `prompt`: ready-to-paste prompt for the replacement Codex chat.
- `suggestedReplacementMetadata`: stable metadata for historical/internal
  compatibility workflows. It may include `replacesAgentEntryKey` to link a new
  active agent to the source agent.
- `replacementInstructions`: manual steps for creating the new Codex chat.
- `catalogAction`: historical/internal compatibility guidance for registering a
  replacement agent and retiring the old agent.
- `delivery`: manual delivery instructions.

## 7. Error Handling

- Missing or empty input fields must return `validation_error`.
- Unknown target agents must return `not_found`.
- A target agent that exists only in another workspace must return `not_found`.
- Storage failures must return `storage_error`.

## 8. Security and Permissions

- The tool must only read agent metadata from the requested workspace.
- The tool must not message, steer, or inspect Codex chats.
- The tool must not expose entries from other workspaces.
- The generated prompt may include caller-provided context; callers remain
  responsible for reviewing it before delivery.

## 9. Open Questions

- Should the suggested replacement display name keep the same name or append a
  version marker such as `v2`?
- Should a later feature optionally ask the old agent for a self-summary before
  rendering the regeneration prompt?

## 10. Decision Log

- 2026-07-26: Define regeneration as deterministic prompt preparation from an
  existing registered agent, not automatic replacement.
- 2026-07-26: Keep old-agent self-summary and Codex dispatch out of v1.
- 2026-07-26: Require a new `introduce_agent` call after the replacement Codex
  session exists.
- 2026-07-26: Implement `prepare_agent_regeneration` as a read-only MCP tool
  with deterministic local prompt rendering and no catalog mutation.
- 2026-07-26: Use `retire_agent` as the explicit follow-up catalog action for
  confirmed replacements.
- 2026-08-15: Remove this tool from the normal public V2 surface and prefer
  `generate_agent_prompt` for short-lived task agents.
- 2026-08-15: Delete registered-agent regeneration service, schema, and test
  code.
