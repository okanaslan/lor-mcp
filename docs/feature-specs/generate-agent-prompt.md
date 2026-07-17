# Generate Agent Prompt

## 1. Summary

Implemented for v1. This feature lets a caller generate a ready-to-paste starter
prompt for an empty Codex chat from a built-in agent role preset.

The tool helps users bootstrap specialized Codex agents, but it does not create
or message Codex chats and does not register an agent before a real Codex
session ID exists.

## 2. Goals

- Generate ready-to-paste starter prompts for empty Codex chats.
- Support a broad initial set of deterministic built-in role presets.
- Return suggested `introduce_agent` metadata for later catalog registration.
- Keep prompt generation workspace-aware without persisting generated prompts.
- Make manual delivery explicit so callers do not assume Local Orchestration Router (LOR) created
  or contacted another agent.

## 3. Non-Goals

- Create a Codex thread.
- Send a prompt to another agent.
- Register an agent before a Codex session ID exists.
- Generate prompts with an LLM.
- Persist custom prompt templates in v1.
- Replace `prepare_agent_handoff` for already introduced agents.

## 4. Functional Requirements

- The tool name must be `generate_agent_prompt`.
- The request must include `workspace`.
- The request must include `role`.
- The request may include `projectName`.
- The request may include `task`.
- The request may include `context`.
- The request may include user constraints for the generated agent prompt.
- The server must support these built-in role presets in v1:
  - `backend`
  - `frontend`
  - `react_native_mobile`
  - `figma_design`
  - `code_review`
  - `qa`
  - `devops`
  - `product`
  - `marketing`
  - `email`
- Role presets must use deterministic templates, not LLM-generated text.
- The generated prompt must be ready to paste into an empty Codex chat.
- The generated prompt must instruct the new agent to read repo instructions
  before changing files.
- The generated prompt must instruct the new agent to respect planning-only,
  review-only, and learn-first tasks.
- The generated prompt must instruct the new agent to keep changes scoped,
  preserve user work, and report exact verification.
- The response must include the selected role.
- The response must include a suggested display name.
- The response must include suggested agent metadata for a later
  `introduce_agent` call after a Codex session ID exists.
- The response must include manual delivery instructions.
- The tool must not create, message, steer, or verify a Codex agent.

## 5. User Stories / Use Cases

- [Generate Agent Prompt For Empty Codex Chat](../use-cases/generate-agent-prompt-for-empty-codex-chat.md)

## 6. Data Model

Conceptual input fields:

- `workspace`: client workspace folder name or stable workspace slug.
- `role`: selected built-in role preset.
- `projectName`: optional project name to include in the generated prompt and
  suggested metadata.
- `task`: optional first task or role context to include in the generated
  prompt.
- `context`: optional supporting context for the generated prompt.
- `constraints`: optional user-supplied constraints for the generated agent.

Conceptual output fields:

- `workspace`: requested workspace.
- `role`: selected role preset.
- `prompt`: ready-to-paste starter prompt for the empty Codex chat.
- `displayName`: suggested agent display name.
- `suggestedAgentMetadata`: suggested metadata for later `introduce_agent`
  registration.
- `delivery`: manual delivery instructions that state Local Orchestration Router (LOR) does not
  create or message Codex chats.

Suggested agent metadata should include:

- `projectName`
- `displayName`
- `primarySpecialty`
- `specialtyTags`
- optional `handoff` metadata when the preset can provide useful defaults.

## 7. Error Handling

- Missing or empty `workspace` must return a validation error.
- Missing or empty `role` must return a validation error.
- Unknown role presets must return a validation error listing supported role
  names.
- Invalid optional fields must return a validation error.
- Storage failures should not apply because v1 prompt generation does not
  persist generated prompts.

## 8. Security and Permissions

- The tool must not create Codex chats, send messages, or trigger external
  tools.
- The tool must not include hidden catalog entries or cross-workspace data in
  generated prompts.
- The generated prompt may include user-provided task, context, and constraints;
  callers remain responsible for reviewing prompt content before manual
  delivery.

## 9. Open Questions

- Should future versions allow user-defined role presets?
- Should future versions persist generated prompt presets in the workspace
  catalog?
- Should future versions support optional Codex thread creation through a
  documented integration?
- Should generated prompts include suggested skill usage when matching skills
  exist in the workspace catalog?

## 10. Decision Log

- 2026-07-15: Define `generate_agent_prompt` as prompt generation for empty
  Codex chats.
- 2026-07-15: Return suggested `introduce_agent` metadata instead of registering
  an agent before a Codex session ID exists.
- 2026-07-15: Use deterministic built-in role presets for v1.
- 2026-07-15: Keep delivery manual and out of Local Orchestration Router (LOR).
