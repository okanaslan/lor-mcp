---
name: okan-render-deployment-checker
description: Use when checking, debugging, auditing, or validating existing Render services, deploys, cron jobs, workers, databases, environment variables, logs, health checks, or deployment configuration drift.
---

# Render Deployment Checker

Use this skill to inspect existing Render deployments safely and identify deployment, runtime, configuration, database, cron, or worker issues without changing infrastructure by default.

## Operating Model

- Treat checks as read-only by default. Do not redeploy, restart, change env vars, edit cron schedules, resize services, or modify infrastructure unless the user explicitly asks.
- Inspect the repo deployment shape first: Dockerfile, build/start commands, health endpoint, worker or cron entrypoints, database requirements, environment variables, and any `render.yaml` or dashboard-equivalent config.
- Prefer Render MCP or Render CLI for live checks when configured. If unavailable, ask for Dashboard screenshots, service settings, deploy events, or log snippets only after local inspection.
- Sanitize API keys, service IDs when needed, database URLs, env var values, private hosts, and sensitive log lines before reporting.
- Separate deployment checking from deployment creation. Use a deployment skill when creating services, Blueprints, databases, or first-time Render setup.

## Check Workflow

1. Identify the target service, environment, service type, expected URL, and whether it is a web service, worker, cron job, database, static site, or multi-service app.
2. Inspect local configuration: runtime, working directory, build command, start command, `$PORT` binding, health endpoint, database/migration behavior, required env vars, cron commands, and worker entrypoints.
3. Inspect live Render state when tools or evidence are available: latest deploy status, deploy event, build logs, runtime logs, service health, service URL, env var presence, database links, cron schedule, and worker command.
4. Classify the failure as build-time, startup, runtime/health, database/migration, cron/worker scheduling, or configuration drift.
5. Stop at the first concrete failing layer when possible and propose the smallest safe next action.
6. Report compactly: service inspected, evidence checked, likely issue, confidence level, and next safe action.

## Render Checks

Verify the relevant items:

- latest deploy status is live or the failed deploy has a clear build/startup error
- health endpoint returns the expected 2xx response
- app binds to `0.0.0.0:$PORT` or the platform-provided port contract
- build and start commands match the repo layout and runtime
- required runtime secrets/env vars are present without exposing values
- database URL/link exists, migrations run as intended, and SSL/network assumptions match Render
- cron and worker commands are one-shot or long-running as appropriate
- logs do not show repeated crashes, missing env vars, failed migrations, connection errors, or health check timeouts

## Safety Rules

- Do not print full credential-bearing URLs, raw secrets, or private keys.
- Do not repeatedly redeploy without a concrete fix.
- Do not treat local success as proof of Render success.
- Do not run destructive database or infrastructure commands as part of checking.
- Do not change frontend, mobile, admin dashboard, or E2E files unless explicitly requested.
