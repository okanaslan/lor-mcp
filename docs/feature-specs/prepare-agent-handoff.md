# Prepare Agent Handoff

## 1. Summary

Implemented for v1. This feature lets a caller render a ready-to-send prompt for
an introduced Codex agent in the requested workspace.

The tool prepares handoff content only. It does not spawn, steer, message, or
verify another Codex agent.

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

## 4. Functional Requirements

- The tool name is `prepare_agent_handoff`.
- The request must include `workspace`, `agentEntryKey`, and `task`.
- The request may include a single `context` text block.
- The target must be an introduced agent in the requested workspace.
- If the agent has stored `handoff` metadata, the server must render its
  `handoffPromptTemplate`.
- If the agent has no stored `handoff` metadata, the server must render a
  generic prompt from agent metadata, task, and optional context.
- Supported template placeholders are `{task}`, `{context}`, `{projectName}`,
  `{agentDisplayName}`, `{primarySpecialty}`, and `{specialtyTags}`.
- Unknown template placeholders must be left unchanged.
- The response must state that delivery is manual.

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

## 6. Error Handling

- Missing or empty input fields must return a validation error.
- Unknown target agents must return `not_found`.
- A target agent that exists only in another workspace must return `not_found`.
- Storage failures must return a storage error.

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
