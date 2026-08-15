# Generate Agent Prompt For Empty Codex Chat

## 1. Summary

A Codex user wants to start a new empty Codex chat as a specialized agent
without writing the role prompt manually. Local Orchestration Router (LOR)
generates a ready-to-paste starter prompt and suggested role metadata.

## 2. Actor

Codex user.

## 3. Scenario

The user opens an empty Codex chat and wants that chat to behave like a specific
kind of agent, such as a backend agent, frontend agent, React Native mobile
agent, Figma design agent, marketing agent, email agent, product agent, QA
agent, DevOps agent, or code review agent.

The user asks an existing Codex agent to generate the starter prompt through
Local Orchestration Router (LOR).

## 4. Flow

1. The Codex user opens or prepares an empty Codex chat.
2. The user asks an existing Codex agent to generate a starter prompt through
   Local Orchestration Router (LOR).
3. The user provides a desired role, such as `backend` or `figma_design`.
4. Local Orchestration Router (LOR) returns a ready-to-paste prompt and
   suggested role metadata for that role.
5. The user pastes the prompt into the empty Codex chat.
6. The new chat starts operating according to the generated agent role.

## 5. Expected Outcome

The user can reliably bootstrap a specialized Codex agent without manually
writing the role prompt from scratch. The generated prompt is ready for manual
delivery, and the suggested metadata helps the user understand the intended role
without requiring catalog registration.

## 6. Related Feature Specs

- [Generate Agent Prompt](../feature-specs/generate-agent-prompt.md)
- [V2 Agent Initialization Context](../feature-specs/v2-agent-initialization-context.md)

## 7. Open Questions

- Should future versions support user-defined role presets?
- Should future versions support a documented Codex thread creation or dispatch
  integration?
