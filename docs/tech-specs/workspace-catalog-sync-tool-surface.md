# Workspace Catalog Sync Tool Surface

## 1. Summary

Draft. This tech spec defines the MCP tool surface for Workspace Catalog Sync,
which copies selected skill catalog entries from a source workspace catalog into
a target workspace catalog.

V1 adds preview/apply helper tools that copy skills only. The tools are useful
for initializing empty workspaces, but they are general sync/migration helpers
that can be used any time. They never copy agents, never copy `codexSessionId`
values, never create Codex chats, never dispatch prompts, and never write local
`SKILL.md` files.

## 2. Context

The feature spec defines two helper tools:

- `preview_workspace_catalog_sync`
- `apply_workspace_catalog_sync`

The current catalog already supports workspace alias resolution, skill export,
catalog import with duplicate skipping, and deterministic
`generate_agent_prompt` output. Workspace Catalog Sync should compose those
existing behaviors rather than replace lower-level `export_catalog`,
`import_catalog`, or `generate_agent_prompt`.

## 3. Goals

- Define stable MCP inputs and outputs for the two helper tools.
- Keep mutation behind preview and `confirm: true`.
- Preserve copied skill metadata, verification metadata, and `skillContext`.
- Report missing requested skills and target duplicates without failing preview.
- Include optional generated starter prompt metadata for requested roles.
- Keep the tools valid for both initialization and later catalog maintenance.

## 4. Non-Goals

- Copy agents or `codexSessionId` values.
- Add overwrite conflict behavior.
- Add move/delete semantics.
- Create, message, or verify Codex chats.
- Write local `SKILL.md` files or trigger local skill sync.
- Change public `export_catalog`, `import_catalog`, or `generate_agent_prompt`
  schemas.

## 5. Proposed Tool Inputs

`preview_workspace_catalog_sync` input:

- `sourceWorkspace`: required non-empty string.
- `targetWorkspace`: required non-empty string.
- `projectName`: optional non-empty string.
- `skillNames`: optional non-empty string array.
- `agentPromptRoles`: optional non-empty string array of supported
  `generate_agent_prompt` role names.

`apply_workspace_catalog_sync` input:

- Same selection fields as preview.
- `confirm`: literal `true`.

Validation rules:

- Trim all string fields.
- Reject missing or empty source and target workspaces with `validation_error`.
- Reject source and target values that resolve to the same canonical workspace.
- Reject empty `skillNames` or empty `agentPromptRoles` arrays when present.
- Reject unknown agent prompt roles using the existing prompt-generation
  validation path.
- Do not add overwrite, move, or conflict strategy input in v1.

## 6. Proposed Tool Outputs

Both tools should return the existing structured MCP response envelope with
`status: "ok"` on success and a `data` payload.

Output `data` fields:

- `sourceWorkspace`: resolved canonical source workspace.
- `targetWorkspace`: resolved canonical target workspace.
- `projectName`: included when supplied.
- `requestedSkillNames`: normalized requested names when supplied.
- `requestedAgentPromptRoles`: normalized requested roles when supplied.
- `skillsToCopy`: selected source skill export entries that are not duplicates.
- `duplicateSkills`: selected source skill names already present in the target.
- `missingSkills`: requested skill names not found in the selected source set.
- `generatedAgentPrompts`: prompt-generation results for requested roles.
- `summary`: counts for `selectedSkills`, `skillsToCopy`, `duplicateSkills`,
  `missingSkills`, `generatedAgentPrompts`, and, on apply, `copiedSkills`.

Apply output should use the same shape as preview and add:

- `copiedSkills`: copied skill names.

Existing target skills are skipped by default. Skipping duplicates is a
successful outcome, not a tool error.

## 7. Error Handling

- Missing or invalid input returns `validation_error`.
- Missing source skills without explicit `skillNames` returns success with zero
  selected skills.
- Requested but missing source skills are reported in `missingSkills`.
- Storage failures return `storage_error`.
- Prompt-generation validation failures return `validation_error`.
- Apply without `confirm: true` returns `validation_error`.

## 8. Tool Registration Notes

`preview_workspace_catalog_sync` annotations:

- `readOnlyHint: true`
- `destructiveHint: false`
- `idempotentHint: true`
- `openWorldHint: false`

`apply_workspace_catalog_sync` annotations:

- `readOnlyHint: false`
- `destructiveHint: false`
- `idempotentHint: true`
- `openWorldHint: false`

The apply tool mutates catalog storage, but it is idempotent for the same input
because existing target skills are skipped.

Logging should include tool name, source workspace, target workspace, status,
counts, error code, and duration. Logs must not include generated prompt text or
full copied skill payloads.

## 9. Verification Plan

When implemented, verification should include:

- Zod schema tests for required fields, `confirm: true`, non-empty arrays, and
  invalid roles.
- Service tests proving preview does not mutate target workspace.
- Service tests proving apply copies only skills and skips duplicates.
- Service tests proving agents and `codexSessionId` values are never copied.
- Service tests proving verification metadata and `skillContext` round-trip.
- Service tests proving sync can run against a non-empty target workspace.
- HTTP `tools/list` coverage for both new tools.
- HTTP tool-call tests for preview and apply.
- Logging tests proving generated prompt text and copied skill payloads are not
  logged.
- Full verification with `deno task check`, `deno task test`, `deno task lint`,
  `deno task fmt`, and `git diff --check`.

For this docs-only change, verification is limited to formatting touched docs
and running `git diff --check`.

## 10. Decision Log

- 2026-07-23: Define Workspace Catalog Sync as preview/apply helper tools that
  copy only skills and generate optional starter prompt metadata.
- 2026-07-23: Use duplicate skipping as the only v1 conflict behavior.
- 2026-07-23: Keep the tool names general so they can support initialization,
  migration, and ongoing workspace maintenance.
