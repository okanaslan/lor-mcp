# Regenerate Context Heavy Agent

## 1. Summary

A Codex user has a useful registered agent whose chat has accumulated too much
context to continue effectively. The user wants LOR to prepare a replacement
prompt that preserves the agent's role and catalog metadata while starting a new
Codex chat with clean context.

## 2. Actor

Codex user working with a registered Codex agent.

## 3. Scenario

The user notices that an existing Codex agent has become context-heavy or can no
longer compress its history well. The agent is still valuable as a role, but the
current chat should be replaced by a fresh Codex chat. The user asks the current
agent, a coordinator agent, or the old agent itself to generate a regeneration
prompt for that registered agent.

## 4. Flow

1. The user identifies the agent that should be regenerated.
2. The active Codex agent asks LOR to prepare an agent regeneration prompt.
3. LOR fetches the registered agent metadata from the requested workspace.
4. LOR renders a ready-to-paste prompt for a new empty Codex chat.
5. LOR returns suggested replacement metadata for a later `introduce_agent`
   call.
6. The user starts a new Codex chat with the returned prompt.
7. After the new chat has a Codex session ID, the user registers it with
   `introduce_agent`, optionally preserving the returned `replacesAgentEntryKey`
   metadata.
8. The user calls `retire_agent` for the old registered agent after confirming
   the replacement is usable.

## 5. Expected Outcome

The user can replace a context-heavy Codex agent with a fresh chat while keeping
the same role, project focus, specialty metadata, and handoff guidance in LOR.

## 6. Related Feature Specs

- [Prepare Agent Regeneration](../feature-specs/prepare-agent-regeneration.md)
- [Generate Agent Prompt](../feature-specs/generate-agent-prompt.md)
- [Prepare Agent Handoff](../feature-specs/prepare-agent-handoff.md)
- [Introducing Agent](../feature-specs/introducing-agent.md)
- [Agent Lifecycle Retirement](../feature-specs/agent-lifecycle-retirement.md)

## 7. Open Questions

- Should a later version ask the old agent to summarize itself before
  regeneration?
- Should future listing support a dedicated active/retired filter?
