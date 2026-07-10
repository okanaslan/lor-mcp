---
name: okan-commit-message
description: Use when the user asks for a commit message, commit description, local git commit, committing current changes, committing staged changes, or creating a conventional commit from a git diff.
---

# Okan Commit Message

Generate a concise Conventional Commit message and, by default, create a local git commit for the selected changes.

## Modes

- **Commit mode is default** for requests like "commit message", "commit this", "create commit", or "commit current changes".
- **Read-only mode** applies only when the user says "message only", "do not commit", "don't stage", "no mutations", or otherwise explicitly asks for text only.
- This skill is local-only: never push, open PRs, merge, amend, reset, force-push, discard changes, or alter remotes.

## Workflow

1. Inspect scope first with `git status --short` and the relevant diff/stat.
2. Select changes from the user's wording:
   - Default ambiguous "commit message": unstaged tracked changes only.
   - "staged": inspect and commit only staged changes.
   - "all" or "current changes": include staged, unstaged, and untracked changes.
   - Explicit paths: include only those paths.
   - "backend only": include selected changes under `backend/` only.
   - "frontend only": include selected changes under `frontend/` only.
   - "unstaged": include unstaged tracked changes only unless the user also asks for untracked files.
3. If staged and unstaged changes both exist and the user did not specify scope, stop and ask which scope to commit.
4. If selected scope has no changes, say there is nothing to commit.
5. Generate the message:
   - `type(scope): short subject`
   - one concise behavior bullet
   - one validation bullet only when command output was inspected.
6. In commit mode, stage only selected files, preferring explicit paths over `git add -A`.
7. Create the local commit with the generated title and body.
8. Report the short commit SHA and final `git status --short`.

## Safety Rules

- Never include untracked files unless explicitly selected or the user asked for "all/current changes".
- Never silently commit unrelated files in a mixed worktree.
- For backend-only or frontend-only requests, verify the staged set contains only the requested subtree before committing.
- Never claim tests, lint, typecheck, build, or format passed unless the output was provided or inspected.
- If commit hooks run, summarize whether they completed, failed, or completed with warnings.
- If staging or committing needs elevated filesystem permission, request approval for the exact git action.

## Output

### Commit Mode

```markdown
Message: `type(scope): short subject`

Description:
- One concise bullet describing the behavior or files changed.
- One concise validation bullet only if command output was inspected.

Commit: `<short-sha>`
Status: `<clean or remaining files>`
```

### Read-Only Mode

```markdown
Message: `type(scope): short subject`

Description:
- One concise bullet describing the behavior or files changed.
- One concise validation bullet only if command output was inspected.
```

## Style

- Prefer `fix`, `feat`, `chore`, `test`, `refactor`, `docs`, `build`, or `style`.
- Keep the subject under about 72 characters.
- Use the narrowest useful scope, such as `backend`, `chain-indexer`, `management`, `investor`, `frontend`, `db`, or a feature-specific scope.
- Make the commit body factual; do not include unverified validation.

## Pressure Scenarios

- "commit message" with only unstaged tracked files: stage those files and create a local commit.
- "commit message only": return text only, no staging or commit.
- "commit staged changes": commit only staged changes and leave unstaged changes untouched.
- "commit current changes": stage and commit staged, unstaged, and untracked changes.
- Mixed staged and unstaged with ambiguous wording: ask for scope before staging or committing.
- No selected changes: report no changes to commit.
- Commit hook failure: report failure and do not claim commit success.
