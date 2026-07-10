# Roadmap

This roadmap will track the major feature specs for the Agentic Router MCP
Server.

## Feature Specs

- [MCP Initialization Session](feature-specs/mcp-initialization-session.md):
  Draft. Defines how Agentic Router uses MCP lifecycle initialization as the
  session boundary for catalog operations.
- [Introducing Agent](feature-specs/introducing-agent.md): Draft. Defines how a
  user introduces an existing Codex agent into initialized-session-scoped
  durable storage.
- [Introducing Skill](feature-specs/introducing-skill.md): Draft. Defines how a
  user introduces an existing Codex skill into initialized-session-scoped
  durable storage.
- [Find Matching Catalog Entry](feature-specs/find-matching-catalog-entry.md):
  Draft. Defines how Agentic Router chooses the best matching introduced agent
  or skill for a request.
- [List Catalog Entries](feature-specs/list-catalog-entries.md): Draft. Defines
  how users inspect available introduced agents and skills.
- [Get Catalog Entry Detail](feature-specs/get-catalog-entry-detail.md): Draft.
  Defines how users fetch full metadata for one introduced catalog entry.
- [Update Catalog Entry](feature-specs/update-catalog-entry.md): Draft. Defines
  how users edit display and routing metadata for an introduced entry.
- [Remove Catalog Entry](feature-specs/remove-catalog-entry.md): Draft. Defines
  how users remove an introduced agent or skill from the active session catalog.
- [Skill / Agent Existence Verification](feature-specs/existence-verification.md):
  Draft. Defines how Agentic Router verifies introduced agents and skills.
- [Routing Recommendation Explanation](feature-specs/routing-recommendation-explanation.md):
  Draft. Defines how Agentic Router explains why an entry was recommended.
- [Conflict Handling](feature-specs/conflict-handling.md): Draft. Defines how
  Agentic Router handles equally strong catalog matches.
- [Catalog Import](feature-specs/catalog-import.md): Draft. Defines how users
  bulk-load catalog entries into the active initialized MCP session.
- [Catalog Export](feature-specs/catalog-export.md): Draft. Defines how users
  export session catalog entries for backup or reuse.

## Next

- Resolve open questions across the draft feature specs before implementation.
