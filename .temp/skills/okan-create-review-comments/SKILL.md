---
name: okan-create-review-comments
description: Convert selected okan-code-review findings into exact pull request review comments with file path, line or range, and concise comment text. Use when the user has reviewed a PR or branch, selected findings to comment on, and wants copy-ready review messages or inline comment placement for GitHub/GitLab-style code review.
---

# Okan Create Review Comments

Convert selected review findings into copy-ready PR comments. Do not run a fresh full review.

## Workflow

1. Read only the findings selected by the user.
2. Skip findings the user has rejected as convention, intentionally deferred, or no longer wants to comment on.
3. Inspect the relevant diff or file enough to confirm the issue and line placement.
4. Prefer the smallest changed line or range that anchors the problem.
5. Write short comments the reviewer can paste.
6. Do not run lint, tests, format, or post comments unless explicitly asked.

## Placement

- Use new-side file line numbers by default.
- Comment on changed lines whenever possible.
- For missing checks, use the closest changed line where the check belongs.
- For helper/function issues, use the tightest useful line range.
- For architectural or unplaceable issues, use `filepath:line: top-level PR comment` or `filepath:line: needs context`.

## Message Style

- Keep each message one or two sentences.
- Start with the concern, mention practical impact only if useful, and end with the requested change.
- Use "Can we..." or "Could we..." unless the issue is severe.
- Do not include severity labels by default.
- If a finding is not worth asking the author to change, say that instead of creating a noisy comment.

## Output

Use numbered blocks, not tables:

```markdown
1. **Short issue label**
   `/abs/path/file.ts:123`
   Can we ...?

2. **Another issue**
   `/abs/path/other.ts:45-48`
   Could we ...?
```

For unplaceable comments, use `top-level PR comment` or `needs context` instead of a file path.
