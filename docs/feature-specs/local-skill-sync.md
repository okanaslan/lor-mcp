# Local Skill Sync

## 1. Summary

Implemented for v1, including explicitly targeted global skills. Local Skill
Sync writes approved registered skill context back to a local skill's `SKILL.md`
file. It is separate from stored catalog updates and only writes a clearly
delimited LOR-managed section after explicit confirmation.

## 2. Goals

- Let approved registered skill context updates improve local skill files.
- Let approved global skill context updates improve local skill files through
  the same managed-section workflow.
- Keep local file writes approval-gated and narrowly scoped.
- Resolve skill files only from configured server-owned skill roots.
- Preserve the rest of `SKILL.md` without rewriting the full file.
- Avoid exposing absolute local file paths in normal MCP responses or errors.

## 3. Non-Goals

- Rewrite whole skill files.
- Accept arbitrary file paths from callers.
- Sync pending or unapproved catalog proposals.
- Sync agent handoff metadata.
- Dispatch Codex work or edit files outside configured skill roots.

## 4. Functional Requirements

- The server must expose `preview_skill_file_sync`.
- The server must expose `apply_skill_file_sync`.
- Both tools must require:
  - `workspace`
  - `skillName`
  - `proposalId`
- Both tools may accept skill `scope` so callers can target a global skill when
  a workspace skill has the same name.
- `apply_skill_file_sync` must also require `confirm: true`.
- The referenced proposal must exist, belong to `skillName`, and have
  `status: "applied"`.
- The registered skill must have stored `skillContext`.
- Global skills must use the same `skillName/SKILL.md` local file resolution as
  workspace skills.
- The local skill file must resolve as `skillName/SKILL.md` under configured
  skill roots.
- `skillName` must be treated as a registered skill name, not a path.
- Preview must return the rendered managed section and whether the local file
  would change without mutating the file.
- Apply must write only the LOR-managed section and report whether a write
  occurred.

## 5. Managed Section

Local Skill Sync owns only this delimited section:

```md
<!-- BEGIN LOR SKILL CONTEXT -->

## LOR Managed Context

<!-- This section is managed by LOR MCP. Update it through approved local skill sync. -->

...

<!-- END LOR SKILL CONTEXT -->
```

If the section does not exist, LOR appends it to the end of `SKILL.md`. If the
section exists, LOR replaces only the content between the markers. If one marker
is missing or malformed, LOR rejects the sync instead of guessing.

## 6. Skill Roots

Skill files are resolved from server-owned roots:

- Local workspace `.temp/skills`
- User Codex skills under `~/.codex/skills`
- User agent skills under `~/.agents/skills`

`LOR_SKILL_ROOTS` may override roots with a comma-separated list. Callers cannot
pass file paths through MCP tool input.

## 7. Error Handling

- Missing inputs return `validation_error`.
- `confirm` missing or false on apply returns `validation_error`.
- Pending proposals return `validation_error`.
- Proposal/skill mismatch returns `validation_error`.
- Missing registered skills or unresolved skill files return `not_found`.
- Incomplete managed sections return `validation_error`.
- File read/write failures return the existing storage/setup error path through
  the MCP response envelope.

## 8. Security and Permissions

- V1 must not scan arbitrary paths from user input.
- V1 must not expose resolved absolute skill file paths in normal tool output.
- V1 must write only after `confirm: true`.
- V1 must update only the LOR-managed section.
- Global skill sync is intentionally shared catalog behavior, but the local file
  write still affects only the resolved local skill file.
- Deno runtime env permissions must include `LOR_SKILL_ROOTS` when used.

## 9. Decision Log

- 2026-07-19: Add local skill sync as a separate approval-gated workflow after
  stored skill context proposals are applied.
- 2026-07-19: Use a delimited managed Markdown section instead of rewriting the
  whole `SKILL.md` file.
- 2026-08-04: Implement local skill sync support for global skills using the
  same managed section and configured skill roots.
