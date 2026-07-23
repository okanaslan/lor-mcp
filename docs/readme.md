# Local Orchestration Router (LOR) MCP Server Docs

This folder is the planning, specification, and implementation-status home for
the LOR MCP Server.

LOR is currently a runnable local Deno TypeScript MCP server with Streamable
HTTP, SQLite-backed workspace catalog storage, deterministic matching, agent
handoff prompt preparation, workspace catalog sync, registered skill context
updates, and approval-gated local `SKILL.md` sync.

## Contents

- `roadmap.md`: high-level feature roadmap and current implementation status.
- `feature-specs/`: product behavior specs for implemented and planned features.
- `use-cases/`: workflow and scenario documents linked from feature specs.
- `tech-specs/`: technical design notes, implementation decisions, and
  architecture discussions.
- `tech-specs/done/`: completed tech specs for implemented behavior.
- `tech-specs/future/`: future-facing tech specs that are not active
  implementation scope.

## Current Operating Model

Use LOR with a caller-supplied `workspace`. The server resolves aliases and
canonical workspace paths before reading or writing catalog records.

The main user flows are:

- Register agents and skills with routing metadata.
- Find matching agents and skills for a task.
- Fetch details and prepare handoff prompts for registered Codex agents.
- Improve stored skill context through approval-gated proposals.
- Optionally sync approved skill context into a local `SKILL.md` managed
  section.
- Export, import, sync, inspect, update, remove, clear, and health-check
  workspace catalog entries.

Local skill-file sync is intentionally separate from stored catalog updates:
preview first, then apply with `confirm: true`.

## Working Notes

- Keep feature planning documents under this `docs/` folder.
- Add one focused feature spec per major feature.
- Add detailed use cases under `use-cases/` and link them from related feature
  specs.
- Add active technical design discussions under `tech-specs/`; move completed
  specs to `tech-specs/done/` and future-only specs to `tech-specs/future/`.
- Update the roadmap when a feature spec is added, changed, or completed.
- Keep root `README.md`, this docs index, and `roadmap.md` aligned whenever the
  public MCP tool surface changes.
