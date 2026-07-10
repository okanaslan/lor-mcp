---
name: skill-name
description: >
  One concise sentence explaining when Codex should use this skill. Include the
  task, domain, and trigger phrases that should activate it.
---

# Skill Name

## Use When

- The user asks for this exact workflow.
- The task needs project-specific process, references, scripts, or assets.

## Workflow

1. Inspect the user request and local context.
2. Load only the references needed for the task.
3. Use bundled scripts or assets when they make the result more reliable.
4. Verify the output with the smallest meaningful check.

## References

- Read `references/<file>.md` only when the task needs that detail.

## Scripts

- Run `scripts/<script>` only when deterministic execution is better than
  rewriting logic.
