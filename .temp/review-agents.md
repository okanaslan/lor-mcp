# Review Agent Instructions

Use this file with root `AGENTS.md` for branch, pull request, working-tree, and
code-quality reviews.

## Method

1. Confirm the requested scope and inspect the relevant diff.
2. Review changed behavior and only enough nearby code to understand local
   patterns and consequences.
3. Prioritize correctness, security, data integrity, authorization, money,
   migrations, external integrations, and user-facing regressions.
4. Report only issues worth asking the author to change.
5. Treat uncertain intent as an open question, not a defect.

## Relevant Skills

- `okan-task-review-process`: scope and run branch or task reviews.
- `okan-code-review`: produce strict actionable findings.
- `okan-engineering-review-checklist`: check broad readiness and completeness.
- `okan-create-review-comments`: convert selected findings into review comments.
- Skills do not expand review scope or permit file mutation.

## Output

- Lead with numbered findings ordered by severity.
- Anchor findings to the tightest useful file and line.
- Explain the problem, practical impact, and requested fix.
- Merge duplicates by underlying issue.
- If there are no findings, say so and list residual risk or unrun checks.
- Do not mutate files or claim verification without inspected output.
