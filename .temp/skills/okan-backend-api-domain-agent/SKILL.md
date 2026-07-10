---
name: okan-backend-api-domain-agent
description: Backend-focused Go skill for API and domain implementation work. Use when a task involves handlers and contracts, service logic, repositories, persistence boundaries, public API consistency, architecture preservation, and verification hygiene such as tests and OpenAPI updates.
---

# Backend API Domain Agent

Use this skill for Go backend API and domain implementation work in product applications.

## Purpose

- Implement and evolve API behavior without collapsing architecture.
- Keep transport, business logic, persistence, and domain responsibilities explicit.
- Treat public API changes as contract work, not incidental code edits.

## Default Operating Model

- Inspect the current backend layout before proposing structure changes.
- Preserve layer boundaries unless the task explicitly changes them.
- Keep handlers thin, services authoritative, repositories explicit, and domain models transport-agnostic.
- Keep database ownership and domain ownership clear.

## Architecture Expectations

- Reuse existing repo conventions when they are coherent.
- Introduce new structure only when the repo lacks a workable backend pattern.
- Keep transport, business logic, persistence, and domain responsibilities separate.
- Avoid shortcuts that push business rules into handlers, middleware, JSON tags, or ad hoc SQL behavior.

## Implementation Workflow

1. Inspect module layout, entrypoints, router shape, config loading, and migration strategy.
2. Map the current backend seams:
   - handlers and contracts
   - service boundaries
   - repositories and persistence ownership
   - domain models and validation rules
3. Identify the narrowest correct layer for the requested change.
4. Implement contract changes and persistence changes together when the behavior requires both.
5. Re-run validation and summarize contract impact, architecture impact, and residual risks.

## Contract and Change Hygiene

- Treat API shape changes as explicit contract work.
- Update request and response contracts, handlers, tests, and generated OpenAPI artifacts when relevant.
- Keep wire-shape decisions intentional and documented in code changes.
- Do not hide public behavior changes inside internal refactors.

## Persistence and Domain Hygiene

- Keep SQL explicit and readable.
- Qualify columns in joined queries.
- Use transactions when one business action mutates multiple persisted records.
- Keep status, date, timezone, and lifecycle semantics backend-owned.
- Keep repository concerns distinct from domain rules.

## Verification Expectations

- Run `go test ./...` for backend changes.
- Run `go vet ./...` when touching broader backend behavior or interfaces.
- Run OpenAPI or codegen checks when the repository uses them.
- If public API behavior changes, validate the contract artifacts in the same pass.

## Output Expectations

Summarize:

- architecture impact
- contract impact
- persistence impact when relevant
- validation performed
- remaining risks or follow-up work

## Initial Instruction Template

Use this prompt in a new backend repo:

```text
Use $backend-api-domain-agent to inspect this backend, preserve its architecture, and implement API or domain changes with explicit contract and persistence hygiene.

Start by reading the current backend layout before proposing structure changes. Identify the existing handler, service, repository, and domain boundaries. Keep those boundaries intact unless the task explicitly requires restructuring.

When API behavior changes, treat that as contract work: update request/response contracts, tests, and generated OpenAPI artifacts when relevant. Keep database ownership and domain ownership explicit, use the narrowest correct layer for each change, and summarize architecture impact, contract impact, validation, and remaining risks at the end.
```
