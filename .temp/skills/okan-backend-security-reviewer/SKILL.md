---
name: okan-backend-security-reviewer
description: Use when reviewing, auditing, debugging, or hardening backend security for Go APIs, authentication flows, admin or internal endpoints, webhooks, secrets, permissions, data isolation, or sensitive side effects.
---

# Backend Security Reviewer

Use this skill to review backend security risks from actual code paths and report concrete findings with severity, impact, and minimal fixes.

## Operating Model

- Review from implementation evidence, not assumptions: router registration, middleware order, config loading, handlers, services, repositories, migrations, tests, docs, and OpenAPI exposure.
- Map trust boundaries first: public routes, authenticated user routes, Pro-gated routes, webhooks, internal admin routes, browser admin routes, workers, and third-party callbacks.
- Keep the review non-destructive. Do not perform credential stuffing, live probing, production attacks, destructive tests, or automated exploitation.
- Do not print secrets, private keys, raw tokens, credential-bearing URLs, or sensitive logs. Redact values in examples.
- Prefer small boundary fixes over broad rewrites unless the architecture itself creates the vulnerability.

## Review Workflow

1. Identify the requested security surface and inspect the nearest code paths end-to-end: route, middleware, handler, service, repository, config, persistence, tests, and generated/public contract exposure.
2. Check authentication and session boundaries: JWT parsing, token lifetime, internal bearer tokens, admin cookies, CSRF, CORS, SameSite/Secure/HttpOnly, password hashing, and session revocation.
3. Check authorization and entitlement boundaries: RBAC, Pro gates, guest restrictions, webhook trust, admin/support permissions, dangerous manual actions, and server-to-server routes.
4. Check data isolation: `user_id` filtering, cross-user access, soft-deleted rows, deleted subscriptions, paused/inactive states, pagination/list leaks, and ID-based mutations.
5. Check secret and sensitive-data handling: config validation, logs, audit logs, DB-backed runtime config, OpenAPI, frontend env assumptions, user-facing errors, object URLs, and notification payloads.
6. Check state-changing behavior: idempotency, replay risks, CSRF coverage, transaction boundaries, audit logging, webhook verification, and side effects such as subscriptions, reports, notifications, and exports.
7. Report findings first, ordered by severity, with file/line references, exploit path, impact, and the smallest practical fix.

## Finding Standards

For each finding include:

- severity: critical, high, medium, or low
- affected file and line when available
- concrete exploit or failure path
- security impact
- minimal fix and suggested test coverage

If no findings are found, say that explicitly and list residual risks or untested areas.

## Validation Expectations

Recommend validation that matches the issue:

- targeted auth/router/API tests for boundary failures
- repository integration tests for cross-user or soft-delete isolation
- config tests for secret/admin/security settings
- OpenAPI checks for accidental internal route exposure
- audit-log tests for dangerous admin actions

## Avoid

- Do not treat absence of tests as proof of a vulnerability without a plausible exploit path.
- Do not disclose secrets, full database URLs, tokens, private keys, or sensitive payloads.
- Do not run destructive commands, production probes, or live attacks.
- Do not recommend disabling security controls to make tests or local development easier.
- Do not edit frontend, mobile, admin dashboard, or E2E files unless explicitly requested.
