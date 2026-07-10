---
name: okan-cron-job-behavior-auditor
description: Use when reviewing, debugging, validating, or auditing cron jobs, scheduled workers, one-shot jobs, due-user queries, catch-up windows, retries, idempotency, logging, or job side effects in a backend service.
---

# Cron Job Behavior Auditor

Use this skill to audit scheduled backend jobs for timing correctness, safe retries, idempotency, observability, and operational behavior.

## Operating Model

- Review from actual code paths: command entrypoint, runtime bootstrap, runner, timeout, config, due-user query, per-user loop, transactions, side effects, and tests.
- Identify the scheduler intent first: one-shot job or daemon, expected cadence, timezone model, catch-up window, missed-run behavior, and deployment scheduler assumptions.
- Treat the audit as non-mutating by default. Do not change cron schedules, Render jobs, env vars, production data, or job side effects unless explicitly requested.
- Do not treat a green local run with zero due users as proof the job works.
- Sanitize logs and avoid printing secrets, user-private content, provider payloads, or raw production data.

## Audit Workflow

1. Map the job surface: command, runner name, timeout, dependencies, config, scheduler docs, and expected external scheduler cadence.
2. Review due-user or due-work selection: timezone-local eligibility, catch-up window, DST boundaries, paid/free/guest filters, active/deleted users, active subscriptions, soft deletes, paused/inactive records, and existing same-kind output rows.
3. Review execution safety: context cancellation, per-user isolation, partial failure handling, retries, idempotency, duplicate prevention, transaction boundaries, and rollback behavior.
4. Review side effects: inbox/report/task/tracking rows, notifications, audio, AI calls, external providers, action logs, and whether failures are blocking or best-effort.
5. Review observability: start/done logs, due counts, per-user failures, duplicate skips, generated entity IDs, local dates/week starts, provider/model metadata, and sanitized errors.
6. Review tests: due-user repository tests, job runner integration tests, timezone/catch-up tests, idempotency tests, duplicate-run tests, and side-effect failure tests.
7. Report concrete findings with severity, affected code path, runtime impact, and the smallest safe fix or validation step.

## Risk Checklist

Look for:

- duplicate output when a job is retried or scheduled too frequently
- users missed around timezone, DST, midnight, or weekly boundary logic
- all-or-nothing failures that should be per-user isolated
- per-user failures that are swallowed without enough logs
- non-idempotent notifications, reports, inbox messages, or tracking rows
- external provider failures that block core deterministic output
- missing timeouts or cancellation checks
- schedule/docs drift between code, README, deployment config, and scripts

## Validation Expectations

Recommend validation that matches the risk:

- focused `go test` for the owning jobs and repository packages
- DB-backed due-user selection tests with multiple timezones and catch-up windows
- job integration tests for duplicate runs, partial failures, and side effects
- manual local runs only when seeded due users or logs make the result meaningful
- production log checks only with sanitized evidence

## Avoid

- Do not change production schedules, env vars, databases, or provider settings during an audit.
- Do not recommend repeated manual job runs without confirming idempotency.
- Do not ignore duplicate-run behavior, missed-run behavior, or timezone edge cases.
- Do not expose secrets, user-private content, raw provider payloads, or full production logs.
- Do not edit frontend, mobile, admin dashboard, or E2E files unless explicitly requested.
