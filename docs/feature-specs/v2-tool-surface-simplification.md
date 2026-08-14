# V2 Tool Surface Simplification

## 1. Summary

Implemented for V2. This feature reduces or hides LOR tools that imply LOR owns
Codex task execution or inter-agent communication. LOR should remain focused on
catalog, prompt, readiness, and guidance workflows.

## 2. Goals

- Hide or remove task lifecycle tools from the normal public MCP surface.
- Hide or remove direct agent communication tools from the normal public MCP
  surface.
- Preserve prompt helper tools for manual coordination.
- Make the public tool list easier for Codex agents to choose from.
- Reduce user confusion between catalog entries and live executable agents.

## 3. Non-Goals

- Delete stored catalog data.
- Remove prompt generation.
- Remove skill or subagent registration.
- Remove agent registration if still useful as metadata.
- Build a custom Codex execution harness.

## 4. Functional Requirements

- V2 must remove or hide delegated task tools from normal use:
  - `send_agent_task`
  - `get_agent_task_status`
  - `list_active_tasks`
  - `append_agent_context`
  - `get_agent_task_result`
- V2 must avoid adding new direct agent-to-agent communication tools.
- V2 must keep prompt helper tools available:
  - `generate_agent_prompt`
  - `prepare_agent_handoff`
  - `prepare_agent_regeneration`
- Tool descriptions must clearly say when LOR prepares prompts but does not
  execute or dispatch them.
- Documentation must explain that Codex agents generally own their own work.

## 5. User Stories / Use Cases

Optional. Related V2 use cases should focus on equipping a new task-oriented
agent rather than dispatching work to another long-lived agent.

## 6. Data Model

No new storage model is required for the simplification itself. Existing task
tables may remain in storage for migration safety, but V2 public workflows
should not depend on them.

## 7. Error Handling

- Hidden or deprecated tools should not appear in `tools/list`.
- If compatibility mode is kept, deprecated task tools must return clear
  guidance that manual prompt workflows are preferred.

## 8. Security and Permissions

- LOR must not imply it can control Codex tasks unless a real execution harness
  is available.
- Tool descriptions and responses must avoid overstating dispatch capability.

## 9. Open Questions

- Should task tools be fully unregistered, or kept behind an explicit
  experimental configuration flag?
- Should existing task storage be left untouched or migrated out later?
- Should agent registration remain, or should agents become prompt presets plus
  metadata only?

## 10. Decision Log

- 2026-08-14: Plan V2 to reduce LOR-owned task and communication tooling.
- 2026-08-14: Keep prompt helpers because manual coordination remains useful.
- 2026-08-14: Hide delegated task lifecycle tools from the normal public MCP
  tool surface while keeping task service/storage code in place for migration
  safety.
