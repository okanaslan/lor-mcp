# V2 Direction

Status: Planning.

This folder captures the next LOR direction from user feedback. The theme is a
course correction: LOR should focus less on long-lived agent communication and
task tracking, and more on helping each short-lived Codex agent start with the
right skills, subagents, prompts, next steps, and failure behavior.

## Direction

- Prefer short-lived, task-oriented agents over long-lived, skill-oriented
  agents.
- Stop expanding LOR-owned delegated task management.
- Stop expanding direct agent-to-agent communication tools.
- Keep prompt generation helpers because users can still perform manual
  coordination with fresh Codex chats.
- Improve skill and subagent registration, discovery, quality, and coverage.
- Use local aggregate usage analytics so users can see which skills, subagents,
  and workspace notes are listed, matched, or opened in detail.
- Use negative routing metadata for overlapping skills and subagents so "do not
  use when" guidance reduces false-positive recommendations.
- Make tool results more operational: tell the caller what to do next and what
  to do if a step fails.
- Clarify the relationship between local Codex skills, LOR-registered skills,
  subagent profiles, and local `AGENTS.md`.

## Feature Specs

- [V2 Tool Surface Simplification](../feature-specs/v2-tool-surface-simplification.md)
- [V2 Agent Initialization Context](../feature-specs/v2-agent-initialization-context.md)
- [V2 Skill And Subagent Coverage Health](../feature-specs/v2-skill-and-subagent-coverage-health.md)
- [V2 Local Skill And AGENTS.md Integration](../feature-specs/v2-local-skill-and-agents-integration.md)
- [Usage Analytics](../feature-specs/usage-analytics.md)
- [Negative Routing Metadata](../feature-specs/negative-routing-metadata.md)

## Implementation Principle

V2 should remove or hide tools that imply LOR owns Codex execution when it does
not. LOR should instead be the local catalog, readiness, prompt, and guidance
layer around Codex work.
