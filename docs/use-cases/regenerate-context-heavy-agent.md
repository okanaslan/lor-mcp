# Regenerate Context Heavy Agent

## 1. Summary

Historical/internal V2 note. A Codex user has a useful long-lived registered
agent whose chat has accumulated too much context to continue effectively. The
public V2 direction prefers fresh short-lived task agents initialized with
`generate_agent_prompt`, relevant skills, and subagent profiles.

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
5. LOR returns suggested replacement metadata for human review or internal
   compatibility workflows.
6. The user starts a new Codex chat with the returned prompt.
7. The user continues with the new chat through normal Codex behavior.

## 5. Expected Outcome

The user can replace a context-heavy Codex chat with a fresh prompt while
avoiding new public LOR dependencies on long-lived agent registration.

## 6. Related Feature Specs

- [Prepare Agent Regeneration](../feature-specs/prepare-agent-regeneration.md)
- [Generate Agent Prompt](../feature-specs/generate-agent-prompt.md)
- [V2 Agent Initialization Context](../feature-specs/v2-agent-initialization-context.md)

## 7. Open Questions

- Should a later version ask the old agent to summarize itself before
  regeneration?
- Should future listing support a dedicated active/retired filter?
