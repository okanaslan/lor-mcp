# Durable Catalog Storage

## 1. Summary

Draft. This tech spec defines v1 durable storage for Agentic Router catalog
records using SQLite in a configured local database file.

The storage layer must persist introduced agents and skills across MCP
reconnects and server restarts while keeping records isolated by the configured
catalog namespace.

## 2. Context

Agentic Router v1 is planned as a Deno TypeScript MCP server over stdio.
Session identity and catalog scoping use `AGENTIC_ROUTER_CATALOG_NAMESPACE` as
the durable workspace catalog scope.

The catalog storage layer must support introducing agents and skills,
namespace-local duplicate checks, listing, detail lookup, matching, update,
remove, import/export, and catalog health checks. The storage design should
keep catalog domain logic independent from MCP transport code.

## 3. Goals

- Persist introduced agents and skills across reconnects and restarts.
- Enforce namespace-local catalog isolation.
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
server reads `AGENTIC_ROUTER_DB_PATH` at startup or storage initialization and
opens or creates the SQLite database at that path.

The Deno implementation should use the Deno-compatible `jsr:@db/sqlite` driver
unless first scaffold verification finds a blocking Deno or FFI compatibility
issue.

The database should track schema state with an internal migration table such as
`schema_migrations` or an equivalent schema version table. V1 bootstraps the
initial schema through an internal migration function.

The v1 schema should use separate catalog tables:

- `introduced_agents`: stores introduced Codex agents.
- `introduced_skills`: stores introduced Codex skills.

Each table must include `catalogNamespace` from
`AGENTIC_ROUTER_CATALOG_NAMESPACE`. All catalog reads and writes must filter by
`catalogNamespace`.

`introduced_agents` should store:

- `catalogNamespace`
- `codexSessionId`
- `projectName`
- `displayName`
- `primarySpecialty`
- `specialtyTags`
- `createdAt`
- `updatedAt`

`introduced_skills` should store:

- `catalogNamespace`
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

Namespace-local unique constraints must prevent duplicates:

- Agents: unique `(catalogNamespace, codexSessionId)`.
- Skills: unique `(catalogNamespace, skillName)`.

Remove operations should hard-delete records. After deletion, list, detail,
match, update, export, and health operations must behave as though the record
does not exist in that namespace.

## 6. Alternatives Considered

JSON file storage was considered. It was not chosen because duplicate
constraints, updates, import transactions, and namespace filtering become
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

The storage setup path should fail explicitly when `AGENTIC_ROUTER_DB_PATH` is
missing or empty. The server must not silently create a database in an
unconfigured default location.

Deno run permissions must include environment access for
`AGENTIC_ROUTER_DB_PATH` and read/write access to the configured database path.
The first code scaffold must verify whether the selected SQLite driver requires
additional native or FFI permissions.

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

- Missing `AGENTIC_ROUTER_DB_PATH` fails with a setup or storage error.
- Schema initializes on an empty SQLite database.
- Duplicate agent Codex session IDs are rejected within one namespace.
- Duplicate skill names are rejected within one namespace.
- The same agent or skill references are allowed across different namespaces.
- List, detail, match, update, remove, export, and health checks never cross
  namespace boundaries.
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
- 2026-07-12: Use `catalogNamespace` on every catalog table for storage
  isolation.
- 2026-07-12: Use separate `introduced_agents` and `introduced_skills` tables.
- 2026-07-12: Store `specialtyTags` as JSON text for v1.
- 2026-07-12: Use hard delete for remove operations.
- 2026-07-12: Bootstrap schema through an internal migration function and track
  schema version in SQLite.
