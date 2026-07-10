---
name: okan-engineering-review-checklist
description: Use when doing a broad engineering quality pass, self-review, PR readiness check, or implementation completeness review across correctness, API contracts, data integrity, security, performance, tests, dependencies, documentation, and operational readiness.
---

# Okan Engineering Review Checklist

Use this as a broad readiness checklist before or alongside code review. It is a thinking scaffold, not a finding generator: only concrete, evidence-backed gaps should become review findings.

## Positioning

- Use `okan-engineering-review-checklist` to make sure important quality areas were considered.
- Use `okan-code-review` when the user wants strict, actionable branch review findings.
- Use `okan-create-review-comments` after findings are selected and need copy-ready PR comments.
- Treat this as a readiness and completeness scaffold. Do not produce noisy category-by-category output when a concise list of concrete gaps is enough.

## Workflow

1. Identify the intended change, scope, and highest-risk area.
2. Inspect the diff, tests, docs, and nearby project patterns enough to ground the review.
3. Walk only the checklist areas relevant to the change.
4. Report concrete gaps, open questions, and verification still needed.
5. Separate must-fix gaps from optional cleanups and intentionally deferred follow-ups.
6. Do not output every category unless the user asks for a full checklist.

## Checklist

### Intent And Scope

- Does the change solve the stated problem?
- Is the scope tight, without unrelated refactors or behavior drift?
- Is the reason for the change valid and visible from context?

### API And Contract Compatibility

- Did request shape, response shape, events, DTOs, errors, or public types change?
- Are consumers, tests, docs, and examples aligned with the new contract?
- If the change is breaking, is that intentional and clearly called out?

### Correctness And Edge Cases

- Are normal, empty, invalid, duplicate, missing, and failure cases handled?
- Are state transitions valid?
- Are assumptions explicit rather than hidden in incidental implementation details?

### Data, Database, And Concurrency

- Are migrations intentional, ordered safely, and compatible with existing data?
- Are indexes aligned with actual `WHERE`, `JOIN`, `ORDER BY`, and pagination shapes?
- Are transaction boundaries, idempotency, uniqueness, and race conditions considered?
- Are N+1 queries, per-row network calls, and avoidable re-fetches avoided?

### Security And Privacy

- Is authentication and authorization enforced at the right boundary?
- Is user input validated before use in queries, commands, external calls, or rendering?
- Are secrets, credentials, payload hashes, internal metadata, and PII kept out of public responses and logs unless explicitly required?
- Are tenant, role, ownership, and admin boundaries preserved?

### Error Handling And Observability

- Are errors handled at the correct layer?
- Are failure modes clear without leaking sensitive details?
- Is logging or telemetry sufficient for debugging production behavior?
- Are retries, partial failures, and external-service failures treated intentionally?

### Maintainability And Design

- Does the change follow existing module, usecase, repository, DTO, and test patterns?
- Are responsibilities separated without introducing needless abstraction?
- Are functions/classes reasonably sized and named for the business action they perform?
- Is duplication acceptable, or is it now hiding divergent behavior?

### Performance And Scale

- Are query count, memory use, algorithmic complexity, batching, and pagination reasonable for expected data size?
- Are expensive operations moved out of loops where possible?
- Is caching, preloading, or async parallelism useful without weakening correctness?

### Tests And Verification

- Are unit, integration, e2e, or live tests updated at the right boundary for the change?
- Do tests cover the risky behavior, not just the happy path?
- Do not claim tests, lint, typecheck, builds, migrations, Docker, or runtime behavior passed unless the command output was inspected.

### Dependencies, Config, Docs, And Ops

- Are new dependencies justified, maintained, and limited to the right package?
- Are env validation, config wiring, and example env files updated when configuration changes?
- Are docs updated for public behavior, operational steps, migrations, feature flags, or non-obvious workflows?
- Is rollback or deployment sequencing considered when the change affects persistence, APIs, or background jobs?

## Output Guidance

Prefer a concise result:

```markdown
Readiness: ready / needs changes / blocked

Key gaps:
1. ...

Verification:
- tests: not run; suggested `...`
- typecheck: inspected output from `...`

Next review step: use `okan-code-review` for strict branch findings.
```

If there are no concrete gaps, say that clearly and list residual risks or unrun checks.

## Common Mistakes

- Do not turn the checklist into generic category-by-category noise.
- Do not duplicate `okan-code-review` severity output unless the user asked for findings.
- Do not report speculation as a defect; make it an open question.
- Do not require documentation or comments for obvious code.
- Do not review unrelated files unless they explain a changed behavior or risk.
