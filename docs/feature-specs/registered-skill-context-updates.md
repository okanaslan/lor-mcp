# Registered Skill Context Updates

## 1. Summary

Implemented for v1. This feature lets agents propose and apply improvements to
the context stored for a registered skill in Local Orchestration Router (LOR).
It updates LOR catalog data only and does not read, write, or sync local
`SKILL.md` files.

## 2. Goals

- Let agents improve registered skill context as they learn better usage
  guidance.
- Require explicit approval before applying skill context updates.
- Persist update proposals across MCP reconnects and server restarts.
- Keep skill context workspace-scoped and available through catalog detail,
  matching, import, and export flows.

## 3. Non-Goals

- Edit local `SKILL.md` files.
- Sync local skill files with LOR catalog data.
- Generate skill improvements with an LLM inside LOR.
- Change agent handoff metadata.

## 4. Functional Requirements

- The server must store optional structured `skillContext` on skill entries.
- The server must expose `propose_skill_update`.
- `propose_skill_update` must require `workspace`, `skillName`, and `reason`.
- A proposal must include at least one proposed skill context or metadata field.
- Creating a proposal must not mutate the current skill entry.
- The server must expose `apply_skill_update`.
- `apply_skill_update` must require `workspace`, `proposalId`, and
  `confirm: true`.
- Applying a proposal must update the registered skill context and optional
  catalog metadata.
- Applied proposals must not be applied again.
- Proposal creation and application must be isolated by resolved workspace.

## 5. User Stories / Use Cases

- [Improve Registered Skill Context](../use-cases/improve-registered-skill-context.md)

## 6. Data Model

Skill entries may include `skillContext`:

- `whenToUse`: when the skill is useful.
- `usageNotes`: project-specific usage guidance.
- `constraints`: limits, warnings, or rules.
- `examplePrompts`: example prompts or tasks that should use the skill.

Skill update proposals include:

- `proposalId`
- `workspace`
- `skillName`
- `reason`
- optional proposed `skillContext`
- optional proposed catalog metadata
- `status`: `pending` or `applied`
- `createdAt`
- optional `appliedAt`

## 7. Error Handling

- Missing required fields must return a validation error.
- Empty proposals must return a validation error.
- Missing skills must return a not found error.
- Missing confirmation must return a validation error.
- Already applied proposals must return a validation error.
- Storage failures must return a storage error.

## 8. Security and Permissions

- V1 must not read, write, or infer local skill file paths.
- Skill context updates must remain scoped to the resolved workspace.
- Applying a proposal is an important action and must require explicit
  confirmation.

## 9. Open Questions

- Should a future feature sync approved LOR skill context back to local
  `SKILL.md` files?
- Should old pending proposals expire or be manually removed?

## 10. Decision Log

- 2026-07-19: Update stored LOR skill context only; local skill file sync is
  deferred.
- 2026-07-19: Use explicit `propose_skill_update` and `apply_skill_update` tools
  for preview and approval.
- 2026-07-19: Persist proposals in SQLite so approval can survive reconnects.
