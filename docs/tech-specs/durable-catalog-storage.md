# Durable Catalog Storage

## 1. Summary

Draft. This tech spec defines v1 durable storage for Agentic Router catalog
records using SQLite in a configured local database file.

The storage layer must persist introduced agents and skills across MCP
reconnects and server restarts while keeping records isolated by the
client-supplied workspace.

## 2. Context

Agentic Router v1 is a Deno TypeScript MCP server with local Streamable HTTP as
the primary Codex connection mode and stdio as a fallback. Session identity and
catalog scoping use a workspace as the durable catalog scope.

The catalog storage layer must support introducing agents and skills,
workspace-local duplicate checks, listing, detail lookup, matching, update,
remove, import/export, and catalog health checks. The storage design should
keep catalog domain logic independent from MCP transport code.

## 3. Goals

- Persist introduced agents and skills across reconnects and restarts.
- Enforce workspace-local catalog isolation.
- Support duplicate constraints for agent Codex session IDs.
- Support duplicate constraints for skill names.
- Keep SQLite-specific behavior isolated from MCP tool handlers.
- Provide a migration path for future storage changes.

## 4. Non-Goals

- Add remote database support.
- Add encryption at rest.
- Add user authentication or authorization.
- Preserve soft-deleted records or update history.
- Implement full-text, embedding-based, or LLM-based matching.
- Define final MCP tool request and response schemas.

## 5. Proposed Design

Agentic Router v1 should use SQLite as the durable local storage engine. The
server defaults to `.agentic-router/catalog.db` under the workspace and opens
or creates the SQLite database at that path. `AGENTIC_ROUTER_DB_PATH` remains a
server-side override.

The Deno implementation should use the Deno-compatible `jsr:@db/sqlite` driver
unless first scaffold verification finds a blocking Deno or FFI compatibility
issue.

The database should track schema state with an internal migration table such as
`schema_migrations` or an equivalent schema version table. V1 bootstraps the
initial schema through an internal migration function.

The v1 schema should use separate catalog tables:

- `introduced_agents`: stores introduced Codex agents.
- `introduced_skills`: stores introduced Codex skills.

Each table must include the client-supplied `workspace`. All catalog reads and
writes must filter by `workspace`.

`introduced_agents` should store:

- `workspace`
- `codexSessionId`
- `projectName`
- `displayName`
- `primarySpecialty`
- `specialtyTags`
- `createdAt`
- `updatedAt`

`introduced_skills` should store:

- `workspace`
- `skillName`
- `projectName`
- `displayName`
- `primarySpecialty`
- `specialtyTags`
- `createdAt`
- `updatedAt`

`specialtyTags` should be stored as JSON text for v1. This keeps the first
schema simple while preserving the option to normalize tags later if matching
or filtering requires it.

Workspace-local unique constraints must prevent duplicates:

- Agents: unique `(workspace, codexSessionId)`.
- Skills: unique `(workspace, skillName)`.

Remove operations should hard-delete records. After deletion, list, detail,
match, update, export, and health operations must behave as though the record
does not exist in that workspace.

## 6. Alternatives Considered

JSON file storage was considered. It was not chosen because duplicate
constraints, updates, import transactions, and workspace filtering become
fragile as catalog operations expand.

Deno KV was considered. It was not chosen because SQLite is more portable as a
local file and better fits the expected list, filter, update, and export
workflows.

A single `catalog_entries` table was considered. It was not chosen because
separate agent and skill tables provide clearer type-specific uniqueness rules
for Codex session IDs and skill names.

Soft delete was considered. It was not chosen because current feature specs do
not require history, and soft delete would complicate uniqueness, listing,
matching, and import behavior.

## 7. Implementation Notes

Storage code should live behind a repository interface under `src/catalog/`.
MCP tool handlers should depend on catalog repository behavior rather than
SQLite APIs directly.

All writes, updates, deletes, and import batches should use transactions. All
parameterized queries should use prepared statements.

The storage setup path should create the default local data directory when
server-owned defaults are used. If `AGENTIC_ROUTER_DB_PATH` is set explicitly
but cannot be opened, storage setup should fail clearly.

Deno run and serve permissions must include environment access for
`AGENTIC_ROUTER_DB_PATH`, read/write access to the configured database path,
and the native or FFI permissions required by the selected SQLite driver.

Combined catalog operations such as list, match, export, and health checks will
need to read from both `introduced_agents` and `introduced_skills` and merge the
results into a catalog-level representation.

## 8. Risks and Tradeoffs

- Separate tables improve type-specific constraints but require combined
  list/match queries.
- JSON tags are simple for v1 but may need normalization if tag search becomes
  advanced.
- SQLite is local and portable, but not a multi-user remote storage solution.
- Hard delete is simple but does not preserve update or remove history.
- The selected SQLite driver may require Deno FFI or native-library permissions
  that must be verified before implementation proceeds too far.

## 9. Verification Plan

When this tech spec is implemented as code, verification should include:

- Missing `AGENTIC_ROUTER_DB_PATH` uses `.agentic-router/catalog.db`.
- Schema initializes on an empty SQLite database.
- Duplicate agent Codex session IDs are rejected within one workspace.
- Duplicate skill names are rejected within one workspace.
- The same agent or skill references are allowed across different workspaces.
- List, detail, match, update, remove, export, and health checks never cross
  workspace boundaries.
- Hard delete removes entries from later list, detail, match, and export
  results.
- Import writes use transactions enough to avoid partially corrupted records on
  storage failure.

For this documentation change, verification is limited to reading back the
spec, checking the docs tree, running `git diff --check`, and checking git
status.

## 10. Open Questions

- Should the migration table be named `schema_migrations` or
  `schema_version`?
- Should timestamps be stored as ISO strings or integer epoch milliseconds?
- Should `specialtyTags` be normalized before tag-specific filtering is
  implemented?
- Should SQLite pragmas such as WAL mode be enabled in v1?

## 11. Decision Log

- 2026-07-12: Use SQLite as the v1 durable catalog storage engine.
- 2026-07-12: Use `AGENTIC_ROUTER_DB_PATH` as the configured SQLite database
  file path.
- 2026-07-12: Use `workspace` on every catalog table for storage
  isolation.
- 2026-07-12: Use separate `introduced_agents` and `introduced_skills` tables.
- 2026-07-12: Store `specialtyTags` as JSON text for v1.
- 2026-07-12: Use hard delete for remove operations.
- 2026-07-12: Bootstrap schema through an internal migration function and track
  schema version in SQLite.
- 2026-07-13: Default SQLite storage to `.agentic-router/catalog.db` and keep
  `AGENTIC_ROUTER_DB_PATH` as a server-side override.
- 2026-07-13: Rename legacy storage scope to client-supplied `workspace`, with
  migration for existing local databases.
