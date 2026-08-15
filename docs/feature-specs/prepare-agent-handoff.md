# Prepare Agent Handoff

## 1. Summary

Implemented internally for v1, then removed from the codebase and the normal
public V2 MCP surface. This historical feature let a caller render a
ready-to-send prompt for an introduced Codex agent in the requested workspace.

The tool prepares handoff content only. It does not spawn, steer, message, or
verify another Codex agent.

For V2 public workflows, use `generate_agent_prompt` with relevant
`find_matching_skill` and `find_matching_subagent` context instead.

## 2. Goals

- Turn stored agent handoff metadata into a task-specific prompt.
- Provide a useful generic prompt when an agent has no stored handoff metadata.
- Keep handoff preparation deterministic and workspace-scoped.
- Avoid depending on hidden Codex internals or app-specific communication
  channels.

## 3. Non-Goals

- Send work to another Codex agent.
- Create or steer Codex tasks.
- Generate prompt text with an LLM.
- Verify whether the target Codex session is active.
- Prepare handoffs for skills.
- Dispatch work to an agent; that belongs to future delegated task lifecycle
  tools.

## 4. Functional Requirements

- `prepare_agent_handoff` is no longer implemented or registered.
- LOR must not prepare handoffs for registered-agent entries in normal V2
  workflows.
- Task-oriented prompt setup should use `generate_agent_prompt`,
  `find_matching_skill`, and `find_matching_subagent`.

## 5. Data Model

Input:

- `workspace`: client workspace path, registered alias, or stable workspace
  slug.
- `agentEntryKey`: target agent catalog entry key.
- `task`: task to hand off.
- `context`: optional supporting context text.

Output data:

- `workspace`
- `targetAgent`
- `prompt`
- `usedStoredHandoff`
- `handoff`, when stored metadata exists.
- `missingContext`
- `delivery`
- `reachability`

## 6. Error Handling

- Missing or empty input fields must return a validation error.
- Unknown target agents must return `not_found`.
- A target agent that exists only in another workspace must return `not_found`.
- Storage failures must return a storage error.
- Reachability behavior must return an error when the target agent is known
  unreachable.

## 7. Security and Permissions

- The tool must only read catalog entries from the requested workspace.
- The tool must not trigger Codex, call app-server, or open deep links.
- The rendered prompt is user-provided and catalog-derived text; callers remain
  responsible for reviewing it before delivery.

## 8. Open Questions

- Should a later version support named context fields instead of one text block?
- Should a later version optionally return a `codex://new` deep link?
- Should a later version integrate with a documented Codex app-server bridge?

## 9. Decision Log

- 2026-07-15: Add `prepare_agent_handoff` as prompt preparation only, with
  manual delivery.
- 2026-07-15: Use generic fallback prompts when stored handoff metadata is
  missing.
- 2026-07-15: Keep `context` as one optional text block for v1.
- 2026-08-06: Implement handoff preparation to fail for known unreachable agents
  while continuing to support manual prompts for unknown agents.
- 2026-08-15: Remove registered-agent handoff preparation from the normal public
  V2 surface; use `generate_agent_prompt` for manual fresh-chat prompts.
- 2026-08-15: Delete registered-agent handoff service, schema, and test code.
