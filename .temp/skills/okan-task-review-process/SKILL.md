---
name: okan-task-review-process
description: Okan's branch, PR, and task review workflow. Use when the user asks to review a branch, PR, latest comments, current changes, code quality, implementation fit, unresolved feedback, or wants multiple subagents and a merged/deduped finding list.
---

# Okan Task Review Process

Use this skill for review-only work. The goal is a focused, actionable finding list grounded in the current diff.

## Scope First

1. Inspect `git status --short`.
2. Identify the requested target: working tree, staged diff, branch range, PR, latest comments, or selected files.
3. If no range is given, prefer the branch's base branch when obvious, usually `development` for Monetari backend work and `main` otherwise.
4. Run `git diff --stat <base>...HEAD` when reviewing a branch range.
5. Run `git diff --check <base>...HEAD` as a cheap sanity check for branch reviews.

Do not mix historical PR discussion into "latest diff" review unless the user asks for history.

## Review Lens

Prioritize:

- correctness, security, data integrity, auth, money, migrations, blockchain-adjacent behavior, and user-facing workflow regressions.
- project fit, duplicated logic, broad casts, missing awaits, hidden races, non-atomic write chains, and fragile config.
- tests and verification gaps for changed behavior.

Treat uncertain product intent as an open question, not a defect.

## Subagent Policy

Use one reviewer when the change is small or domain-specific.

Use three parallel reviewers when:

- the user asks for 3 subagents.
- the branch is high-risk or cross-service.
- the diff spans backend, frontend, infra, and tests.
- the task asks for strict code-quality review.

Give each reviewer the same scoped diff/range and ask for concrete findings only. Afterward, merge overlapping comments into one issue per underlying failure mode.

## Output

Lead with findings. Use numbered findings, not tables.

```markdown
Scope: Reviewed `<range or files>`.
Intent understood: ...
Highest-risk changed area: ...

1. **[P1] Short issue title**
   `/abs/path/file.ts:123`
   Problem. Impact. Suggested fix.

Verification:
- diff check: pass/fail/not run
- tests: not run, suggested `...`

Summary: ...
```

If no issues are found, say that clearly and include residual risk or test gaps.
