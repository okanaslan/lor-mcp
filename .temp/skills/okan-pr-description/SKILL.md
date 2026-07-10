---
name: okan-pr-description
description: Generate a concise pull request description from current branch changes, including what changed, why, test plan, and risk notes. Use when the user asks for a PR description, pull request summary, PR body, or wants to summarize current branch changes for review.
---

# Okan PR Description

Generate a concise PR body from the requested branch or diff scope.

## Workflow

1. Inspect `git status --short`, the current branch, and `git diff --stat`.
2. If the user provides a base branch or range, use it.
3. If no range is provided, prefer current branch against `development` when it exists, then `main`.
4. Inspect only enough patch detail to understand intent, risk, and tests.
5. Pay special attention to public API contracts, migrations, auth/security, env/config changes, and verification evidence.
6. Do not edit files, stage, commit, push, or run tests unless explicitly asked.

## Output

Return only:

```markdown
## Summary
- ...

## What Changed
- ...

## Test Plan
- Not run: ...

## Risk / Notes
- ...
```

## Style

- Keep bullets concise and reviewer-friendly.
- Describe behavior and user/developer impact, not every touched file.
- Mention migrations, public APIs, env vars, auth/security, money, blockchain, or data changes when present.
- Never claim checks passed unless command output was provided or inspected.
- If tests were not run or are unknown, say `Not run`.
