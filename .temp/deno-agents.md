# Deno Service Agent Instructions

Use this file with root `AGENTS.md` for Deno TypeScript services and functions.

## Stack Rules

- Keep commands in `deno.json` tasks when the project uses them.
- Use import aliases instead of direct dependency URLs in source files.
- Keep runtime permissions explicit and minimal.
- Separate server startup from testable request handlers.
- Keep provider-specific deployment behavior outside service logic.
- Ask before adding a framework, package manager, database client, queue,
  provider SDK, or deployment tool.

## Relevant Skills

- `okan-backend-api-domain-agent`: HTTP contracts and service boundaries.
- `okan-backend-api-slice-implementer`: endpoint-style service changes.
- `okan-backend-security-reviewer`: permissions, secrets, and sensitive behavior.
- `okan-openapi-contract-maintainer`: service API contracts.
- `okan-render-deployment-checker`: existing Render deployment validation.
- `find-skills`: discover a Deno-specific skill when needed.
- No dedicated Deno skill is currently vendored.
- Skills do not expand folder ownership or dependency approval.

## Boundaries

- Keep startup, handlers, routes, config, and tests separately testable.
- Keep tests beside the code they verify using `*_test.ts`.
- Document required runtime permissions and environment variables.
- Never put secrets in prompts, docs, source, or committed examples.

## Verification

- Identify the project's local Deno tasks before editing.
- Run focused tests and linting during implementation.
- Before handoff, run the strongest available Deno check task.
- Report required permissions and any skipped checks.
