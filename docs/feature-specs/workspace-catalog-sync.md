# Workspace Catalog Sync

## 1. Summary

Implemented for v1. This feature defines helper tools for syncing skill catalog
entries from one LOR workspace catalog into another. Initializing an empty
workspace is the primary use case, but the tools are general catalog
sync/migration helpers that can be used any time a target workspace should
receive selected skills from a source workspace.

V1 copies skill catalog entries only, then returns starter prompt metadata that
can help the user create fresh workspace-specific Codex agents when needed.

## 2. Goals

- Copy selected skills from a source workspace into a target workspace.
- Support empty-workspace initialization as one use case of catalog sync.
- Support later workspace maintenance and migration flows without requiring the
  target workspace to be empty.
- Preserve copied skill metadata, including stored `skillContext`.
- Preview the sync before mutating the target workspace.
- Support new-agent bootstrapping through existing generated prompt flows.

## 3. Non-Goals

- Copy registered agents or `codexSessionId` values.
- Create Codex chats.
- Dispatch prompts to Codex agents.
- Write local `SKILL.md` files during workspace catalog sync.
- Delete source workspace entries.
- Overwrite existing target skills in v1.
- Replace lower-level catalog import/export tools.

## 4. Functional Requirements

- The server must expose `preview_workspace_catalog_sync`.
- The server must expose `apply_workspace_catalog_sync`.
- `preview_workspace_catalog_sync` must accept:
  - `sourceWorkspace`
  - `targetWorkspace`
  - optional `projectName`
  - optional `skillNames`
  - optional `agentPromptRoles`
- `apply_workspace_catalog_sync` must accept the same selection fields and
  require `confirm: true`.
- The server must copy only skill catalog entries in v1.
- Copied skills must be stored under the resolved target workspace.
- Copied skills must preserve skill metadata, verification metadata, and
  `skillContext`.
- Existing target skills must be skipped by default.
- Requested skills missing from the source workspace must be reported.
- The preview and apply outputs must include:
  - resolved source and target workspace
  - skills selected for copy
  - duplicates that will be skipped
  - missing requested skills
  - generated starter prompt metadata for requested roles
  - summary counts
- The apply output must also include copied skill names and the internal import
  result.
- The implementation should reuse existing catalog export/import behavior where
  practical.

## 5. User Stories / Use Cases

- [Initialize New Workspace From Existing Skills](../use-cases/initialize-new-workspace-from-existing-skills.md)

## 6. Data Model

Conceptual `WorkspaceCatalogSyncPreview` fields:

- `sourceWorkspace`: resolved source workspace.
- `targetWorkspace`: resolved target workspace.
- `skillsToCopy`: selected skill entries from the source workspace.
- `duplicateSkills`: skills already present in the target workspace.
- `missingSkills`: requested skill names that were not found in the source
  workspace.
- `requestedAgentPromptRoles`: requested starter prompt roles.
- `generatedAgentPrompts`: generated prompt metadata for requested roles.
- `summary`: counts for selected, copied, skipped, missing, and generated prompt
  items.

## 7. Error Handling

- Missing source or target workspace must return `validation_error`.
- Source and target resolving to the same workspace must return
  `validation_error`.
- `confirm` missing or false on apply must return `validation_error`.
- Invalid role presets must return `validation_error`.
- Missing source workspace skills should return an empty preview unless specific
  missing `skillNames` were requested.
- Storage failures must return `storage_error`.

## 8. Security and Permissions

- V1 must not copy agents or Codex session IDs across workspaces.
- V1 must not write local skill files.
- V1 must not create or message Codex chats.
- V1 must not delete or mutate source workspace entries.
- V1 must keep source and target workspace catalog records isolated.
- Tool responses must not expose entries outside the requested source and target
  workspaces.

## 9. Open Questions

- Should future versions support overwrite conflict behavior for target skills?
- Should future versions support reusable named sync templates?
- Should agent prompt roles be inferred from copied skill specialties?
- Should future versions support move semantics that remove entries from the
  source after a confirmed migration?

## 10. Decision Log

- 2026-07-23: Define workspace catalog sync as skill-copying plus generated
  prompt metadata, not agent copying.
- 2026-07-23: Require preview before apply and `confirm: true` for mutation.
- 2026-07-23: Keep local skill-file sync separate from workspace catalog sync.
- 2026-07-23: Generalize from workspace initialization to reusable
  sync/migration helper tools.
- 2026-07-23: Implement v1 as `preview_workspace_catalog_sync` and
  `apply_workspace_catalog_sync`, copying only non-duplicate skill entries into
  the resolved target workspace.
