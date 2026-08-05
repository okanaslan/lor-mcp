# Agent Reachability And Dispatch Model

## 1. Summary

Implemented. This feature defines how Local Orchestration Router (LOR)
distinguishes registered catalog agents from agents that are known to be
reachable through Codex-native dispatch. It creates the model needed before LOR
can safely own delegated task sending, status tracking, follow-up context, and
result collection.

Registered agents remain useful catalog entries even when reachability is
unknown or unavailable. Reachability is separate metadata, not a routing score
replacement.

## 2. Goals

- Clearly distinguish catalog-only agents from dispatch-capable agents.
- Store passive reachability metadata based on Codex-native dispatch outcomes.
- Expose reachability metadata in agent list, detail, matching, and handoff
  flows.
- Keep agent matching useful even when an agent is unreachable or unknown.
- Prevent handoff preparation from implying that unreachable agents can receive
  work.
- Establish the model for later delegated task lifecycle tools.

## 3. Non-Goals

- Add `send_agent_task`.
- Add delegated task status, follow-up, or result tools.
- Actively probe Codex sessions for liveness.
- Expire reachability automatically.
- Support non-Codex dispatch targets.
- Replace `codexSessionId` with another dispatch target identifier.

## 4. Functional Requirements

- Every introduced agent must have reachability metadata.
- Existing agents must default to `reachabilityStatus: "unknown"` when the
  metadata is added.
- New agents must default to `reachabilityStatus: "unknown"`.
- LOR must only record reachability changes after Codex-native dispatch succeeds
  or fails.
- LOR must not actively check reachability through background probes, polling,
  or session inspection in this feature.
- `codexSessionId` must remain the dispatch target identifier for Codex agents.
- Reachability must not expire automatically.
- Matching must continue to include unreachable and unknown agents by default.
- Agent match candidates must include compact reachability metadata.
- Agent detail responses must include full reachability metadata.
- Agent list responses must include compact reachability metadata.
- `prepare_agent_handoff` must fail when the target agent is known unreachable.
- `prepare_agent_handoff` may continue for `unknown` agents because manual
  delivery remains possible.
- `prepare_agent_handoff` must not claim dispatch happened.
- Future dispatch tools must require a reachable dispatch target before sending
  work.

## 5. User Stories / Use Cases

- [Check Agent Reachability Before Handoff](../use-cases/check-agent-reachability-before-handoff.md)

## 6. Data Model

Conceptual `AgentReachability` fields:

- `reachabilityStatus`: `unknown`, `reachable`, `unreachable`, or `unsupported`.
- `dispatchMode`: `manual`, `codex_thread`, or `unsupported`.
- `lastReachabilityCheckAt`: timestamp for the last passive dispatch outcome
  update.
- `lastReachabilityError`: optional sanitized caller-safe error.
- `lastDispatchAt`: timestamp for the last successful dispatch.

Agent dispatch target:

- `codexSessionId`: the existing agent session identifier and v1 dispatch
  target.

## 7. Error Handling

- `prepare_agent_handoff` must return an error when the target agent has
  `reachabilityStatus: "unreachable"`.
- Future dispatch tools must return a reachability error when the target agent
  is unreachable or unsupported.
- Reachability errors must not expose hidden Codex task internals, stack traces,
  host paths, or unrelated workspace data.
- Unknown reachability is not an error for matching, listing, detail lookup, or
  manual handoff preparation.

## 8. Security and Permissions

- Reachability metadata must stay scoped to the requested workspace.
- Reachability failures must not reveal whether another workspace has an agent
  with the same `codexSessionId`.
- LOR must not infer or expose hidden Codex-native task state without an
  explicit dispatch outcome.
- Error messages must be sanitized before being stored or returned.

## 9. Open Questions

- Should future dispatch tools allow forcing a send to an `unknown` agent, or
  require an explicit reachability confirmation first?
- Should callers be able to filter matching or listing by reachability status?
- Should `unsupported` be set manually, inferred from missing dispatch mode, or
  both?
- Should future dispatch failures update the agent record immediately or only
  the delegated task record?

## 10. Decision Log

- 2026-08-06: Implement default existing and new agents to
  `reachabilityStatus: "unknown"`.
- 2026-08-06: Record reachability only from Codex-native dispatch outcomes.
- 2026-08-06: Keep unreachable agents in matching results by default.
- 2026-08-06: Make `prepare_agent_handoff` fail for known unreachable agents.
- 2026-08-06: Use `codexSessionId` as the dispatch target identifier.
- 2026-08-06: Do not automatically expire reachability metadata.
