# Personal Skills

## Purpose

This directory vendors personal Codex skills for the agent library. Skills
should be small, focused, and reusable across projects.

## Structure

```text
skills/
|-- _template/
|   `-- SKILL.md
|-- packs/
|   |-- backend.md
|   |-- frontend.md
|   |-- mobile.md
|   |-- design.md
|   |-- deployment.md
|   `-- workflow.md
|-- catalog.md
`-- <skill-name>/
    |-- SKILL.md
    |-- references/
    |-- scripts/
    `-- assets/
```

Only `SKILL.md` is required. Add `references`, `scripts`, or `assets` only when
they directly support the skill.

`packs/` contains role-based reference docs. Packs do not implement skills,
auto-trigger skills, or replace `SKILL.md`.

Projects do not receive the full `skills/` directory automatically. Copy a
skill into a project only when the PM explicitly wants that project to carry
the skill locally.

## Skill Packs

- [Catalog](catalog.md)
- [Backend](packs/backend.md)
- [Frontend](packs/frontend.md)
- [Mobile](packs/mobile.md)
- [Design](packs/design.md)
- [Deployment](packs/deployment.md)
- [Workflow And Review](packs/workflow.md)

Packs are assignment aids only:

1. Pick the pack that matches the assigned role.
2. Read the listed skills and trigger notes.
3. Invoke only the specific skill needed for the current task.

## Rules

- Use lowercase hyphen-case names.
- Keep frontmatter clear; trigger behavior depends on `name` and `description`.
- Keep `SKILL.md` concise.
- Put long details in `references/`.
- Put deterministic repeatable code in `scripts/`.
- Put output resources in `assets/`.
- Do not add extra README, changelog, or install files inside a skill folder.

## Communication Skills

- Caveman mode is an optional user-invoked communication skill.
- Do not make caveman mode a default project rule.
- Use normal precise language for safety, security, credentials, and
  irreversible actions.

## Creation Checklist

1. Define the exact task the skill helps with.
2. Write trigger-focused frontmatter.
3. Add only essential instructions to `SKILL.md`.
4. Add optional resources only when they reduce repeated work.
5. Validate with a realistic prompt before using it broadly.
