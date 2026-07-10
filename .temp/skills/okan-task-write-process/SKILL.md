---
name: okan-task-write-process
description: Okan's implementation and artifact-writing workflow. Use when implementing a planned change, writing repo docs, updating source-of-truth plans, creating backend/frontend code, turning review feedback into fixes, or producing reusable standards in Monetari/Okan repositories.
---

# Okan Task Write Process

Use this skill when the task is to create or change repo artifacts.

## Start

1. Inspect `git status --short` and protect unrelated changes.
2. Read the nearest repo instructions.
3. Inspect current implementation, tests, and docs before editing.
4. Confirm which artifact is the source of truth.
5. Choose the narrowest set of files that satisfies the request.

## Source-Of-Truth Rule

When a repo already has a plan, backlog, skill, or guide that owns the topic, update that file first. Do not create a parallel document unless the user asks.

If a plan changes and task lists depend on it, update the plan first and then refresh the task lists.

## Implementation Rule

- Prefer existing local patterns.
- Keep changes surgical.
- Add abstractions only when they remove real duplication or match an established pattern.
- Do not introduce compatibility shims after a removal unless the user asks for backward compatibility.
- Do not commit generated clutter, throwaway scripts, or test scaffolding unless it is a real maintained artifact.

## Verification

Run the smallest useful checks for the changed surface:

- docs/skills: path checks, frontmatter checks, and Codex entrypoint routing checks.
- backend code: targeted unit/integration tests, typecheck, lint when relevant.
- frontend code: typecheck, lint, targeted tests/build when relevant.

Never claim a check passed unless command output was inspected.

## Output

Report:

- what changed.
- where the source-of-truth artifacts live.
- what verification ran.
- any remaining risk or checks not run.
