# Prepare Agent Regeneration

## 1. Summary

Implemented for v1. This feature lets a caller prepare a ready-to-paste prompt
for replacing a registered Codex agent whose current chat has become too
context-heavy. The tool uses stored agent metadata and optional caller-provided
carry-forward context, but it does not create, message, register, update, or
remove Codex agents.

## 2. Goals

- Help users regenerate useful agents with clean Codex chat context.
- Preserve the source agent's role, project focus, specialty metadata, tags, and
  handoff guidance.
- Return suggested replacement metadata for a later `introduce_agent` call.
- Keep delivery and catalog replacement manual and explicit.
- Avoid relying on hidden Codex internals or automatic old-agent messaging.

## 3. Non-Goals

- Create a new Codex chat.
- Message the old agent or request a self-summary.
- Register the replacement agent before a new Codex session ID exists.
- Automatically retire, update, or remove the old catalog entry.
- Generate prompts with an LLM.
- Replace task handoff through `prepare_agent_handoff`.

## 4. Functional Requirements

- The server must expose `prepare_agent_regeneration`.
- The request must include:
  - `workspace`
  - `agentEntryKey`
- The request may include:
  - `reason`
  - `carryForwardContext`
  - `replacementTask`
  - `includeRegistrationInstructions`, defaulting to `true`
- The target must be a registered agent in the requested workspace.
- The server must render a deterministic ready-to-paste prompt for a new empty
  Codex chat.
- The prompt must preserve the source agent's project name, display name,
  primary specialty, specialty tags, and handoff guidance when present.
- The prompt must include `reason`, `carryForwardContext`, and `replacementTask`
  sections when supplied.
- The output must include:
  - `workspace`
  - `sourceAgent`
  - `prompt`
  - `suggestedReplacementMetadata`
  - `replacementInstructions`
  - `catalogAction`
  - `delivery`
- `suggestedReplacementMetadata` must not include `codexSessionId`.
- `replacementInstructions` must explain that the new Codex chat receives a new
  session ID that must be registered later with `introduce_agent`.
- `catalogAction` must advise the caller to introduce the replacement agent and
  retire the old entry only after the replacement is confirmed.
- The tool must not mutate catalog records.

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
- `suggestedReplacementMetadata`: stable metadata for a later `introduce_agent`
  request. It may include `replacesAgentEntryKey` to link the new active agent
  to the source agent.
- `replacementInstructions`: manual steps for creating and registering the new
  agent.
- `catalogAction`: guidance for registering the replacement agent and retiring
  the old agent.
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
