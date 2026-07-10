# Backend Agent Instructions

Use this file with root `AGENTS.md` for Go API work.

## Stack Rules

- Prefer `github.com/go-chi/chi/v5` for HTTP routing.
- Keep handlers thin and preserve handler, service, repository, and persistence
  boundaries as complexity grows.
- Keep request and response contracts explicit and validate input at API
  boundaries.
- Prefer `github.com/jackc/pgx/v5` for PostgreSQL and
  `github.com/pressly/goose/v3` for migrations when needed.
- Use Swaggo handler comments when OpenAPI documentation is needed.
- Group features with `chi.Route` or mounted routers.
- Keep HTTP controllers, webhooks, workers, cron handlers, queue consumers, and
  indexers thin; they should validate transport context and delegate behavior.
- Pair SQL, migration, and contract changes with focused tests.

## Relevant Skills

- `okan-backend-golang-agent`: initialize or normalize Go API structure.
- `okan-backend-api-domain-agent`: handlers, services, repositories, tests, and contracts.
- `okan-backend-api-slice-implementer`: implement one API slice end to end.
- `okan-backend-migration-safety-reviewer`: review SQL migration safety.
- `okan-go-integration-test-writer`: add or improve integration tests.
- `okan-openapi-contract-maintainer`: synchronize API contracts and OpenAPI artifacts.
- `okan-backend-security-reviewer`: review backend security risks.
- `okan-backend-coverage-ratchet-assistant`: measure or improve coverage.
- `okan-cron-job-behavior-auditor`: audit scheduled jobs.
- `okan-postgres-schema-inspector`: inspect PostgreSQL schema state safely.
- `okan-backend-service-standards`: Monetari/Okan NestJS service structure only.
- `okan-backend-usecase-pattern`: Monetari/Okan NestJS usecase patterns only.
- `okan-backend-env-config`: Monetari/Okan NestJS environment configuration only.
- `okan-test-naming`: backend integration, e2e, and live test naming.
- Skills do not expand folder ownership or dependency approval.

## Boundaries

- Put executable entrypoints under `cmd/` when the project follows that layout.
- Keep transport, service, persistence, and domain concerns separate.
- Keep tests beside the package they verify using `*_test.go`.
- Ask before adding frameworks, ORMs, auth/payment SDKs, queues, code generators,
  deployment tools, or background-job frameworks.
- Document required and optional environment variables in the project's safe
  example file; never commit secrets.

## Verification

- Identify the local Go command runner before editing.
- Run focused package tests during implementation.
- Classify tests by their strongest real boundary: unit, integration, e2e, or
  live external dependency.
- Before handoff, run the project's full Go test, vet, lint, and contract checks
  when available.
- For API changes, include route-level tests or explain the remaining gap.
- During architecture review, identify concrete drift and give the exact
  next-code direction instead of proposing an unrelated broad rewrite.
