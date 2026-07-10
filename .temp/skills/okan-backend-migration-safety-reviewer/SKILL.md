---
name: okan-backend-migration-safety-reviewer
description: Use when creating, reviewing, debugging, or validating SQL migrations in a Go/Postgres backend. Focuses on forward-only safety, reversibility, deployed-database compatibility, data backfill correctness, constraint and index risk, lock risk, and concrete validation steps before migrations are shipped or applied.
---

# Backend Migration Safety Reviewer

Use this skill to review Go/Postgres migrations before they are shipped, applied, reverted, or used to repair schema drift.

## Operating Model

- Inspect the migration system first: migration tool, file naming, latest version, embed behavior, test database strategy, and existing conventions.
- Treat existing migrations as immutable unless the user explicitly approves editing them.
- Prefer forward repair migrations for changes that may already be applied anywhere.
- Review the migration against both fresh databases and realistic deployed states.
- Never apply, revert, or reset production migrations without explicit user approval.
- Do not print secrets, raw production database URLs, private keys, or full credential-bearing commands.

## Review Checklist

Check both `Up` and `Down` when present:

- SQL parseability and migration-tool statement splitting.
- Safe ordering for nullable columns, defaults, backfills, constraints, indexes, and `NOT NULL`.
- Compatibility with existing rows and partially migrated schemas.
- Data preservation for renames, type changes, table splits, table merges, and drops.
- Constraint names, duplicate constraints, partial unique indexes, and index predicates.
- Lock and rewrite risk for large tables, unbounded updates, table rewrites, and concurrent traffic.
- Idempotency expectations such as `IF EXISTS`, `IF NOT EXISTS`, and guarded data moves.
- Static references to optional tables or columns that may not exist in all target states.
- Down migration honesty: reversible when possible, best-effort clearly when not.

## Risk Response

When a risk is found:

- State the failure mode concretely.
- Identify whether it affects fresh DBs, deployed DBs, rollback, or runtime traffic.
- Prefer the smallest safe correction.
- If an existing migration would need editing, stop and ask for explicit approval.
- If production is involved, recommend read-only inspection first and a forward repair migration by default.

## Validation Expectations

Recommend validation that matches the risk:

- Apply migrations in an isolated scratch schema from zero to latest.
- Apply the target migration against a simulated deployed schema when drift or edited migrations are possible.
- Add migration tests for columns, constraints, indexes, backfills, and rejected invalid rows.
- Run focused backend packages that depend on the schema.
- Run broader backend validation such as:

```sh
go test ./...
go vet ./...
```

Run OpenAPI/codegen checks only when public API contracts changed.

## Avoid

- Do not treat local green tests as proof that an already-deployed migration can be rewritten safely.
- Do not recommend destructive commands as a first step.
- Do not hide irreversible data loss behind a clean `Down` migration.
- Do not edit frontend, mobile, admin dashboard, or E2E files unless explicitly requested.
