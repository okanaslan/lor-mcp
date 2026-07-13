# Agentic Router MCP Server

Agentic Router is a local MCP server that acts as a catalog for Codex agents and
skills. It will let a configured workspace introduce known agents and skills,
store their routing metadata, and help a current Codex agent find relevant
catalog entries for a task.

The first implementation is a Deno TypeScript MCP server over stdio. Product and
technical planning remain documented under `docs/`.

## Project Goals

- Provide a workspace-scoped catalog of introduced Codex agents and skills.
- Support task-based lookup for relevant agents and skills.
- Return structured MCP tool responses that Codex agents can consume reliably.
- Keep catalog data durable, local, and isolated by configured workspace
  namespace.

## Documentation

- `docs/readme.md`: planning docs overview.
- `docs/roadmap.md`: feature spec roadmap.
- `docs/feature-specs/`: feature specification drafts and template.
- `docs/use-cases/`: use case scenario drafts and template.
- `docs/tech-specs/`: technical design drafts and template.

## Runtime

Required environment variables:

- `AGENTIC_ROUTER_CATALOG_NAMESPACE`: stable workspace catalog namespace.
- `AGENTIC_ROUTER_DB_PATH`: local SQLite database path.
- `AGENTIC_ROUTER_AGENT_REGISTRY_PATH`: JSON file with
  `agents[*].codexSessionId` values.
- `AGENTIC_ROUTER_SKILL_ROOTS`: OS path-delimited list of skill root folders.

Run locally:

```sh
deno task run
```

Verification:

```sh
deno task check
deno task test
deno task lint
deno task fmt
```

The configured SQLite driver uses a native library through Deno FFI and may
download/cache that library on first use.

## Repository Notes

- `AGENTS.md`: repository-specific Codex operating instructions.
- `.temp/`: local agent-supporting guidance and vendored skills used while
  developing this repository.
