---
name: okan-code-review
description: Review branch-introduced code changes for strict code quality, code smells, project fit, duplication, JavaScript and TypeScript best practices, complexity, and verification gaps. Use this skill whenever the user asks for okan-code-review, a code quality review, code smell review, duplicate logic review, strict branch review, or whether current changes fit existing project rules and guidelines.
---

# Okan Code Review

Review only branch-introduced code changes with a strict, actionable code-quality lens.

## Workflow

1. Inspect current state first: `git status --short`, `git diff`, and `git diff --staged`.
2. If the user provides a PR, branch, range, CI output, or files, review that target instead.
3. Identify the branch intent before judging implementation.
4. Compare changed code with nearby project patterns.
5. Do not broaden into unrelated code unless it explains a branch-introduced issue.
6. Do not run expensive checks unless the user asks or provides output.

## Review Standard

Prioritize security/correctness, then maintainability, then performance. Before writing a finding, ask: "Would I ask the author to change this before merge?"

Flag concrete issues in:
- public contracts, data integrity, auth/security, money, DB/migrations, pricing, blockchain-adjacent logic, and user flows.
- duplicated helpers, avoidable custom config, unsafe casts, broad `any`/`Record<string, unknown>`, `as never`, missing `await`, hidden races, and non-atomic write chains.
- oversized or mixed-responsibility functions, deep nesting, too many positional arguments, avoidable IIFEs, overused React hooks, and project-pattern drift.
- missing or weak tests for changed behavior.

Treat uncertain product intent as an open question, not a defect. Prefer fewer strong findings over many weak comments, but include useful nits that enforce agreed project standards.

If the user rejects a finding category as intentional project convention, stop reporting that category for the current branch unless new evidence changes the risk. Clearly distinguish blocking fixes, optional nits, intentionally deferred follow-ups, and rejected-as-convention items.

## Severity

- `P0`: broken build, exploitable security issue, data loss, or severe production break.
- `P1`: likely bug, broken contract, security/data issue, unsafe migration, or user-flow break.
- `P2`: fix-worthy maintainability, duplication, test, complexity, or project-fit issue.
- `Nit`: small actionable cleanup tied to consistency, readability, or agreed style.

## Output

Use numbered findings, not tables:

```markdown
Scope: Reviewed `branch/range`; staged: no; unstaged: no.
Intent understood: ...
Highest-risk changed area: ...

1. **[P2] Short issue title**
   `/abs/path/file.ts:123`
   Problem. Impact. Suggested fix.

Verification:
- lint: not run, suggested `...`
- typecheck: not run, suggested `...`
- tests: not run, suggested `...`

Summary: 0 blocking findings, 1 non-blocking finding; highest-risk area: ...; confidence: high.
```

If there are no findings, write one numbered item: `1. **No findings**` with a short residual-risk note.

If the user wants copy-ready PR comments for selected findings, use `okan-create-review-comments`.
