---
name: okan-go-integration-test-writer
description: Use when adding, expanding, debugging, or reviewing Go integration tests for APIs, repositories, jobs, migrations, Postgres-backed behavior, or cross-domain backend flows.
---

# Go Integration Test Writer

Use this skill to write reliable Go integration tests that exercise real backend behavior and persistence boundaries.

## Operating Model

- Inspect existing test helpers and conventions before adding new fixtures, database setup, routers, service constructors, or fake providers.
- Prefer real Postgres-backed tests for repository SQL, migrations, transactions, jobs, and API flows that depend on persistence behavior.
- Use the app's real constructors and wiring where practical. Use minimal fakes only at external boundaries such as AI, push, payment, email, object storage, or third-party HTTP services.
- Keep tests deterministic: fixed clocks, stable IDs when useful, isolated schemas or transactions, cleanup hooks, and no brittle sleeps.
- Assert externally observable behavior and important persistence side effects, not incidental implementation details.

## Test Design Workflow

1. Identify the behavior under test and the smallest integration boundary that proves it: repository, service plus DB, HTTP router, job runner, migration, or cross-domain flow.
2. Reuse existing setup helpers for database connections, migrations, schema isolation, auth tokens, routers, stores, and test users.
3. Seed only the data needed for the scenario. Prefer domain services or repository helpers unless direct SQL is clearer for setup-only state.
4. Exercise the real behavior through the same public/internal entrypoint used in production when feasible.
5. Assert the response, returned domain object, database state, action logs, emitted events, notifications, idempotency, and rollback behavior relevant to the feature.
6. Clean up all external state and avoid leaking schemas, rows, goroutines, HTTP servers, or environment variables.

## Coverage Checklist

For new or changed backend behavior, cover the relevant cases:

- authentication, authorization, pro/admin gates, and unauthenticated requests
- validation and malformed input
- happy path response and persisted state
- missing, soft-deleted, cross-user, paused/inactive, or forbidden resources
- conflicts, uniqueness, idempotent retries, and duplicate prevention
- transaction boundaries, rollback on failure, and side effects such as logs, notifications, or outbox rows
- timezone/date bucket logic, ordering, pagination, and filtering when applicable
- migration shape, backfills, constraints, and rejected invalid rows for schema changes

## Database Practices

- Use real test databases when SQL behavior matters. Do not mock repositories to test repository behavior.
- Keep each test isolated with the repo's preferred mechanism: separate schemas, transactions, temporary databases, or cleanup hooks.
- Run migrations through the same migration path the app uses unless a migration-specific test intentionally starts at an older version.
- Avoid production credentials and avoid tests that depend on existing local data.
- Prefer targeted direct SQL only for setup, backfill verification, or assertions that cannot be reached through domain APIs.

## Validation Expectations

Run focused tests first, then broader checks when relevant:

```sh
go test ./internal/<package>
make test
go test ./...
```

Use coverage commands when the goal is coverage improvement, and include DB-backed coverage when the repo supports it.

## Avoid

- Do not create broad fixture frameworks before checking existing helpers.
- Do not replace meaningful integration tests with mocks that skip SQL, migrations, or transaction behavior.
- Do not use sleeps or wall-clock timing when deterministic clocks, polling with deadlines, or direct assertions are available.
- Do not assert private implementation details unless they are the only safe way to verify a critical side effect.
- Do not change frontend, mobile, admin dashboard, or E2E files unless explicitly requested.
