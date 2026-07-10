---
name: okan-backend-coverage-ratchet-assistant
description: Use when measuring, improving, reviewing, or enforcing backend Go test coverage, package coverage gaps, coverage thresholds, or CI coverage ratchets.
---

# Backend Coverage Ratchet Assistant

Use this skill to improve backend Go coverage with meaningful tests and safe threshold ratcheting.

## Operating Model

- Inspect existing coverage tooling before changing tests or thresholds: Make targets, scripts, CI variables, test database setup, coverage package scope, current threshold, and long-term target.
- Measure the baseline first with the repo's supported coverage command. Do not guess current coverage from memory.
- Prefer behavior-focused tests over line-execution tests. Coverage should increase because important behavior is now protected.
- Prioritize high-risk backend areas: domain services, repositories, auth/pro/admin gates, transactions, migrations, cron/jobs, timezone logic, error paths, idempotency, soft deletes, and cross-user isolation.
- Use real DB-backed tests when SQL, migrations, constraints, or transactions are part of the behavior. Use fast unit tests for pure validation, parsing, scoring, formatting, and helper logic.
- Raise thresholds only after stable local or CI-equivalent measurements exceed the proposed threshold with margin.

## Coverage Workflow

1. Find the repo's coverage commands and gate: scripts, Makefile targets, CI env vars, profile paths, `-coverpkg` scope, and default threshold.
2. Run or request the supported baseline measurement. Capture total coverage and notable low-value packages or functions from `go tool cover -func` when available.
3. Choose test targets by risk and leverage, not just lowest percentage. Favor code that affects user-visible behavior, persistence integrity, security, or scheduled jobs.
4. Add the narrowest useful tests: unit tests for pure logic, integration tests for DB/API/job behavior, and migration tests for schema changes.
5. Rerun focused tests, then coverage. Compare before and after totals and package-level movement.
6. If coverage is stable, raise the configured threshold conservatively, update CI/docs if they store the threshold separately, and report the measured margin.

## Test Quality Checklist

Prefer tests that cover:

- auth, permissions, pro/admin gates, and unauthenticated cases
- validation, malformed input, conflict, and not-found behavior
- cross-user isolation, soft-deleted resources, paused/inactive lifecycle, and idempotency
- transactions, rollback, action logs, notification/event side effects, and duplicate prevention
- timezone/date buckets, ordering, pagination, and filtering
- migrations, constraints, defaults, backfills, and rejected invalid rows

## Reporting Expectations

When reporting coverage work, include:

- baseline total and final total
- threshold before and after, if changed
- exact commands run
- packages or behaviors covered
- tests not run or residual risk

## Avoid

- Do not raise a coverage threshold speculatively or to the exact measured value without margin.
- Do not weaken coverage commands, reduce `-coverpkg` scope, skip DB-backed tests, or bypass CI gates to pass.
- Do not add brittle tests that assert incidental internals without protecting behavior.
- Do not mock away repositories, migrations, or SQL when those are the behavior under test.
- Do not edit frontend, mobile, admin dashboard, or E2E files unless explicitly requested.
