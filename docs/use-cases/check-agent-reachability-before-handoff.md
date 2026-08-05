# Check Agent Reachability Before Handoff

## 1. Summary

A Codex agent checks whether a recommended registered agent is known reachable
before attempting a handoff or future delegated dispatch.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

The current Codex agent receives a task and asks LOR to find a matching
registered agent. LOR returns a strong catalog match, but the current agent also
needs to understand whether the target is only a catalog record or is known to
be reachable through Codex-native dispatch.

## 4. Flow

1. The current agent receives a task from the user.
2. The current agent calls `find_matching_catalog_entry`.
3. LOR returns ranked agent candidates with reachability metadata.
4. The current agent fetches detail for the best candidate.
5. If the agent is reachable, the current agent may use future dispatch tooling.
6. If the agent is unknown, the current agent may prepare a manual handoff
   prompt.
7. If the agent is unreachable, `prepare_agent_handoff` fails and the current
   agent chooses another candidate, asks the user, or continues alone.

## 5. Expected Outcome

The current agent does not confuse a useful registered catalog agent with a
currently callable agent. The user receives a clear routing decision and avoids
handoffs that imply unreachable agents can receive work.

## 6. Related Feature Specs

- [Agent Reachability And Dispatch Model](../feature-specs/agent-reachability-and-dispatch-model.md)
- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)
- [Get Catalog Entry Detail](../feature-specs/get-catalog-entry-detail.md)
- [Prepare Agent Handoff](../feature-specs/prepare-agent-handoff.md)

## 7. Open Questions

- Should users see unreachable candidates in a separate warning group, or inline
  with normal ranked candidates?
