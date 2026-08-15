# Check Agent Reachability Before Handoff

## 1. Summary

Historical/internal V2 note. Registered-agent reachability remains useful as
stored metadata for older catalogs, but registered-agent handoff tools are not
part of the normal public V2 MCP surface.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

The current Codex agent is reviewing an older registered-agent catalog entry or
an internal compatibility flow. The agent needs to understand that LOR no longer
owns dispatch and that normal V2 work should use skills, subagent profiles, and
manual Codex prompts.

## 4. Flow

1. The current agent receives a task from the user.
2. The current agent avoids public registered-agent dispatch tools.
3. The current agent uses `find_matching_skill` and `find_matching_subagent` for
   the current task.
4. If another Codex chat is needed, the current agent uses
   `generate_agent_prompt` to prepare a manual fresh-chat prompt.
5. The current agent explains that LOR prepares context and prompts but does not
   create, message, or track Codex agents.

## 5. Expected Outcome

The current agent does not confuse older registered-agent metadata with a
currently callable agent. The user receives a clear V2 routing decision based on
skills, subagents, and manual prompt generation.

## 6. Related Feature Specs

- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)
- [Get Catalog Entry Detail](../feature-specs/get-catalog-entry-detail.md)
- [V2 Tool Surface Simplification](../feature-specs/v2-tool-surface-simplification.md)

## 7. Open Questions

None for the public V2 surface.
