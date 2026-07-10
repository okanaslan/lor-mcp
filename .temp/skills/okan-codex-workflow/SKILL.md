---
name: okan-codex-workflow
description: Okan's default operating model for Codex work. Use when a task involves Monetari/Okan repos, agentkit standards, Codex setup, repo-specific investigation, planning, implementation workflow, memory/git history usage, subagent coordination, or when the user asks how Okan uses Codex and agents.
---

# Okan Codex Workflow

Use this skill as the general Okan/Codex operating model. It does not replace domain skills; it decides how to start, scope, coordinate, and finish work.

## Default Posture

Work from evidence before advice. Inspect the current repo, git state, memory, and relevant local standards before proposing or changing anything.

Prefer durable repo artifacts over chat-only guidance when the user asks for a plan, backlog, reusable standard, or source-of-truth update.

## Discovery First

For non-trivial repo work:

1. Inspect `git status --short`.
2. Identify the current branch and likely base branch.
3. Read the nearest instructions: root `AGENTS.md`, nested `AGENTS.md`, or package docs.
4. Search exact paths, route names, modules, or errors the user mentioned.
5. Use memory when prior project decisions may matter, but verify drift-prone repo facts live.
6. Read nearby implementation and tests before judging patterns.

Do not ask questions that local inspection can answer.

## Scope Control

- Do the requested change, not adjacent cleanup.
- Preserve unrelated dirty work.
- Prefer source-of-truth documents over parallel notes.
- For planning work, update the plan doc first and task lists second.
- For implementation work, avoid speculative abstractions.
- For review-only work, do not mutate files.

## Memory And History

Use Codex memory and git history as reference material, not as unquestioned truth.

- Memory is useful for user preferences, prior decisions, repeat workflows, and known repo conventions.
- Git history is useful for intent, recent architecture changes, and recurring operational pressure.
- Live files are the source of truth for current implementation details.

## Mutation Rule

Do not edit files until the task clearly asks for implementation or artifact creation.

If the user says "learn", "understand", "review", "plan", or "don't generate yet", stay read-only unless they later ask for edits.

## Agent Selection

- Use a single specialist for narrow work in one domain.
- Use multiple reviewers for high-risk branch review, broad architectural review, or when the user asks for subagents.
- Merge subagent outputs by underlying issue, not by wording.
- Keep the main agent responsible for final judgment and dedupe.

## Output Style

Be concise, source-grounded, and specific. Mention exact files, branches, commands, or docs when they materially support the answer. Do not over-explain obvious repo facts.
