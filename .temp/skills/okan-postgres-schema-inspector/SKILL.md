---
name: okan-postgres-schema-inspector
description: Use when inspecting, comparing, debugging, or validating actual PostgreSQL schema state, migration application state, table and column shape, constraints, indexes, or drift between a Go backend database and its migrations or code expectations.
---

# Postgres Schema Inspector

Use this skill to inspect real PostgreSQL schema state safely and report what is actually deployed without mutating data.

## Operating Model

- Identify the target first: local, test, staging, or production; connection method; migration tool; schema/search path; and whether the user has approved access.
- Treat inspection as read-only by default. Do not run writes, DDL, backfills, migrations, or destructive commands.
- Sanitize all credential-bearing database URLs, tokens, private keys, and private host details in user-facing output.
- Check migration state before making schema claims, using `goose_db_version` or the repo-specific migration version table.
- Prefer catalog metadata over application row reads, especially for production databases.

## Inspection Workflow

1. Inspect the repo or runtime conventions for database URL handling, migration tooling, migration directory, and expected schema ownership.
2. Confirm the target database and schema context with read-only queries such as current database, current user, current schema, `search_path`, extensions, and migration version.
3. Inspect structure through `information_schema` and `pg_catalog`:
   - tables, views, materialized views, and extensions
   - columns, types, nullability, defaults, identity/generated settings, and comments
   - primary keys, foreign keys, unique constraints, check constraints, and exclusion constraints
   - indexes including unique, partial, expression, and predicate definitions
   - enum types, trigger functions, triggers, and views when relevant
4. Compare actual schema shape against the relevant migrations, repository SQL, domain models, or API expectations.
5. Report findings compactly: target summary, migration version, inspected objects, mismatches, likely cause, and safe next steps.

## Production Safety

- Require explicit user approval before connecting to production or using production credentials.
- Avoid `SELECT *` from application tables. If row-level examples are unavoidable, ask first and redact sensitive fields.
- Avoid heavy queries by default. Use approximate row counts from `pg_class.reltuples` instead of `COUNT(*)` unless the user approves exact counts.
- Do not print raw database URLs or commands that contain passwords. Show sanitized forms only.

## Drift Response

When schema drift is found:

- State exactly what exists versus what was expected.
- Identify whether the mismatch is likely migration drift, edited migration history, failed deployment, code/schema mismatch, or environment confusion.
- Recommend read-only follow-up inspections first.
- If repair is needed, hand off to migration planning or a forward repair migration; do not apply or revert migrations as part of inspection.

## Avoid

- Do not run `ALTER`, `DROP`, `CREATE`, `UPDATE`, `DELETE`, `TRUNCATE`, data backfills, migration apply/revert/reset commands, or privilege changes.
- Do not dump application data, secrets, production URLs, or credentials.
- Do not assume the `public` schema without checking `search_path` and object schema names.
- Do not treat local schema state as proof of production schema state.
- Do not edit frontend, mobile, admin dashboard, or E2E files unless explicitly requested.
