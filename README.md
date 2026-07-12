# Agentic Router MCP Server

Agentic Router is a planned MCP server that acts as a local catalog for Codex
agents and skills. It will let a configured workspace introduce known agents
and skills, store their routing metadata, and help a current Codex agent find
relevant catalog entries for a task.

The project is currently in the specification phase. Implementation decisions,
feature behavior, and workflow scenarios are documented under `docs/` before
server code is scaffolded.

## Project Goals

- Provide a workspace-scoped catalog of introduced Codex agents and skills.
- Support task-based lookup for relevant agents and skills.
- Return structured MCP tool responses that Codex agents can consume
  reliably.
- Keep catalog data durable, local, and isolated by configured workspace
  namespace.

## Documentation

- `docs/readme.md`: planning docs overview.
- `docs/roadmap.md`: feature spec roadmap.
- `docs/feature-specs/`: feature specification drafts and template.
- `docs/use-cases/`: use case scenario drafts and template.
- `docs/tech-specs/`: technical design drafts and template.

## Repository Notes

- `AGENTS.md`: repository-specific Codex operating instructions.
- `.temp/`: local agent-supporting guidance and vendored skills used while
  developing this repository.
- Server implementation files have not been scaffolded yet.
