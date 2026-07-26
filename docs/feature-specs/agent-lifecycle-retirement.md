# Agent Lifecycle Retirement

## 1. Summary

Implemented for v1. This feature lets callers retire a registered Codex agent
without changing its stable `codexSessionId`. Retired agents remain inspectable
in the workspace catalog, but routing and handoff flows should use active
replacement agents.

## 2. Goals

- Preserve immutable Codex session identity for introduced agents.
- Support replacing context-heavy agents with newly registered sessions.
- Keep old agent metadata available for audit, detail lookup, export, and
  regeneration context.
- Prevent retired agents from being selected by normal matching.
- Require explicit confirmation before changing agent lifecycle state.

## 3. Non-Goals

- Update `codexSessionId` in place.
- Create, message, or close Codex chats.
- Delete retired agents from the catalog.
- Add automatic replacement registration.
- Retire skills.

## 4. Functional Requirements

- The server must expose `retire_agent`.
- The request must include:
  - `workspace`
  - `agentEntryKey`
  - `confirm: true`
- The request may include:
  - `reason`
  - `replacedByAgentEntryKey`
- The target must be a registered agent in the requested workspace.
- When `replacedByAgentEntryKey` is supplied, it must reference a different
  registered agent in the same resolved workspace.
- Retiring an agent must set:
  - `agentStatus: "retired"`
  - `retiredAt`
  - optional `retirementReason`
  - optional `replacedByAgentEntryKey`
- Newly introduced agents must default to `agentStatus: "active"`.
- `introduce_agent` may accept optional `replacesAgentEntryKey` metadata for a
  new replacement agent.
- `find_matching_catalog_entry` must exclude retired agents by default.
- `prepare_agent_handoff` must reject retired target agents.
- `list_catalog_entries`, `get_catalog_entry_detail`, `check_catalog_health`,
  and `export_catalog` must keep retired agents visible.

## 5. User Stories / Use Cases

- A user regenerates a context-heavy agent in a new Codex chat, registers the
  new session ID with `introduce_agent`, then retires the old entry with
  `retire_agent`.
- A user inspects an old retired agent later to understand which active agent
  replaced it.

## 6. Data Model

Agent entries include lifecycle fields:

- `agentStatus`: `"active"` or `"retired"`.
- `retiredAt`: timestamp set when the agent is retired.
- `retirementReason`: optional human-readable reason.
- `replacedByAgentEntryKey`: optional active replacement agent key.
- `replacesAgentEntryKey`: optional old agent key stored on replacement agents.

## 7. Error Handling

- Missing or false `confirm` must return `validation_error`.
- Missing or empty required inputs must return `validation_error`.
- Unknown target agents must return `not_found`.
- Unknown replacement agents must return `not_found`.
- Replacement self-links must return `validation_error`.
- Storage failures must return `storage_error`.

## 8. Security and Permissions

- Retirement must be scoped to the resolved workspace.
- Replacement validation must not cross workspace boundaries.
- The tool must not mutate underlying Codex chats or local files.

## 9. Open Questions

- Should future listing support `agentStatus` filters?
- Should future matching allow an explicit `includeRetiredAgents` option?

## 10. Decision Log

- 2026-07-26: Keep `codexSessionId` immutable and model replacement through
  explicit retirement plus new active agent registration.
- 2026-07-26: Exclude retired agents from matching and handoff while keeping
  them visible through catalog inspection and export.
