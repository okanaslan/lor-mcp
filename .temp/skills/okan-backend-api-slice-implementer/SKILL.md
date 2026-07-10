---
name: okan-backend-api-slice-implementer
description: Use when implementing or changing a backend API endpoint, resource, mutation, read model, or vertical slice in an existing Go backend. Covers route/handler wiring, request and response contracts, service logic, repository/persistence, migrations, tests, docs or OpenAPI updates, and validation while preserving the app's existing architecture.
---

# Backend API Slice Implementer

Use this skill to implement one complete Go backend API vertical slice in an existing service.

## Operating Model

- Inspect the current backend before editing: router shape, handlers, contracts, services, repositories, domain models, migrations, tests, docs, and OpenAPI/codegen.
- State task understanding before mutable work: requested behavior, expected backend area, constraints, and verification plan.
- Reuse the app's existing patterns. Do not reorganize architecture unless the user explicitly asks.
- Keep handlers thin, services authoritative for business rules, repositories persistence-only, and domain models transport-agnostic.
- Treat public API shape as a contract. Update request/response types, examples/docs, OpenAPI or generated artifacts, and tests together.

## Slice Workflow

1. Map the nearest existing slice that resembles the requested behavior.
2. Identify the narrowest layer changes required:
   - route and middleware policy
   - handler decoding/encoding and validation surface
   - request/response contracts
   - service inputs, business rules, transactions, and errors
   - repository SQL and persistence semantics
   - migrations only when stored shape changes
   - tests, docs, OpenAPI/codegen, and validation
3. Implement from the domain/service boundary outward unless the repo's pattern clearly prefers another sequence.
4. Keep error mapping consistent with existing auth, validation, conflict, not-found, and forbidden behavior.
5. Verify with focused tests first, then broader backend checks.

## Persistence Rules

- Add migrations only for real schema changes.
- Never edit existing migrations without explicit user approval.
- Use explicit SQL, qualified columns in joins, and repository methods that return domain models rather than transport responses.
- Use transactions when one business action mutates multiple records or must keep logs/side effects consistent.
- Keep date, timezone, status, lifecycle, and ownership semantics backend-owned.

## Test Expectations

For new or changed API behavior, cover the relevant cases:

- authentication and authorization
- validation and malformed input
- happy path response shape
- missing, soft-deleted, cross-user, or forbidden resources
- idempotency or conflict behavior when applicable
- transaction side effects, action logs, notifications, or jobs when applicable
- migration shape and constraints when schema changes

Prefer package-level focused tests first. Then run the repo's broader backend validation, typically:

```sh
go test ./...
go vet ./...
```

Run OpenAPI/codegen checks when public API contracts change.

## Avoid

- Do not push business rules into handlers, middleware, JSON tags, or ad hoc SQL.
- Do not bypass existing repository/service boundaries for speed.
- Do not change frontend, mobile, admin dashboard, or E2E files unless the user explicitly asks.
- Do not leave public API changes undocumented or untested.
