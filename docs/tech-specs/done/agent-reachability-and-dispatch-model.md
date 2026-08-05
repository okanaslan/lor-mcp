# Agent Reachability And Dispatch Model

## 1. Summary

Implemented. This tech spec defines the storage and tool-boundary model for
distinguishing registered LOR catalog agents from Codex agents that are known to
be reachable through Codex-native dispatch outcomes.

## 2. Context

LOR currently stores `codexSessionId`, matching metadata, handoff metadata, and
agent lifecycle state. It prepares handoff prompts but does not dispatch them.
Real usage feedback shows that callers need a clear distinction between a
catalog entry and a live dispatch target before LOR adds delegated task tools.

## 3. Goals

- Add passive reachability metadata to introduced agent records.
- Keep `codexSessionId` as the dispatch target identifier.
- Expose reachability in list, detail, matching, and handoff behavior.
- Record reachability only from Codex-native dispatch outcomes.
- Avoid active liveness probes and automatic expiry.
- Prepare storage and domain boundaries for later delegated task lifecycle
  tools.

## 4. Non-Goals

- Implement `send_agent_task`.
- Implement delegated task storage.
- Implement task polling, result collection, or follow-up context.
- Probe Codex tasks or sessions in the background.
- Add a second dispatch target identifier.
- Add reachability expiry.

## 5. Proposed Design

Extend introduced agent records with nullable reachability columns or a JSON
metadata column:

- `reachabilityStatus`
- `dispatchMode`
- `lastReachabilityCheckAt`
- `lastReachabilityError`
- `lastDispatchAt`

Default values:

- `reachabilityStatus`: `unknown`
- `dispatchMode`: `manual`
- timestamp fields: `null`
- `lastReachabilityError`: `null`

Reachability status values:

- `unknown`: no dispatch outcome has been recorded.
- `reachable`: the latest Codex-native dispatch outcome succeeded.
- `unreachable`: the latest Codex-native dispatch outcome failed in a way that
  indicates the target cannot currently receive work.
- `unsupported`: the agent cannot be dispatched through a supported mechanism.

The service layer should expose a small method for future dispatch code to
record outcome:

- `recordAgentDispatchSuccess(workspace, agentEntryKey, dispatchedAt)`
- `recordAgentDispatchFailure(workspace, agentEntryKey, error, checkedAt)`

No background job should update reachability in this feature.

## 6. Tool Behavior

`introduce_agent`:

- Stores default reachability metadata as `unknown`.

`list_catalog_entries`:

- Returns compact reachability metadata for agent rows.

`get_catalog_entry_detail`:

- Returns full reachability metadata for agent entries.

`find_matching_catalog_entry`:

- Keeps unknown and unreachable agents in ranked matching results by default.
- Includes compact reachability metadata on agent candidates.
- Does not use reachability as a scoring signal in this feature.

`prepare_agent_handoff`:

- Fails when `reachabilityStatus` is `unreachable`.
- Allows `unknown` because manual delivery remains possible.
- Continues to state that LOR has not dispatched the prompt.

Future dispatch tools:

- Must update reachability after Codex-native dispatch succeeds or fails.
- Must require reachable or explicitly allowed unknown targets before sending.

## 7. Migration Notes

- Existing agent rows should migrate to `reachabilityStatus: "unknown"`.
- Existing agent rows should use `dispatchMode: "manual"` unless a future
  migration can prove a stronger mode.
- No reachability timestamps should be backfilled.
- Existing `codexSessionId` remains the target identifier.

## 8. Risks and Tradeoffs

- Passive-only reachability avoids false liveness claims but may be stale.
- Keeping unreachable agents in matching preserves routing visibility but
  requires callers to inspect metadata.
- Failing `prepare_agent_handoff` for unreachable agents is strict, but prevents
  misleading handoff prompts.
- No expiry keeps behavior simple but puts responsibility on dispatch outcomes
  to refresh state.

## 9. Verification Plan

- Existing agents migrate with `reachabilityStatus: "unknown"`.
- New agents are introduced with `reachabilityStatus: "unknown"`.
- List responses include compact agent reachability metadata.
- Detail responses include full agent reachability metadata.
- Matching includes unknown and unreachable agents by default.
- Matching does not score reachability.
- `prepare_agent_handoff` fails for unreachable agents.
- `prepare_agent_handoff` succeeds for unknown agents and still indicates manual
  delivery.
- Dispatch outcome recorders update reachability without crossing workspace
  boundaries.

## 10. Open Questions

- Should matching/listing later support a `reachabilityStatus` filter?
- Should future dispatch tools allow sending to unknown agents with an explicit
  override?
- Should future task records and agent reachability records both store dispatch
  errors, or should task records own detailed failure history?

## 11. Decision Log

- 2026-08-06: Implement passive reachability updates only from Codex-native
  dispatch outcomes.
- 2026-08-06: Keep `codexSessionId` as the dispatch target.
- 2026-08-06: Keep unknown and unreachable agents visible in matching.
- 2026-08-06: Fail handoff preparation for known unreachable agents.
- 2026-08-06: Do not automatically expire reachability metadata.
