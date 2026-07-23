# Initialize Workspace

## 1. Summary

Draft. This feature defines helper tools for bootstrapping an empty LOR
workspace catalog from an existing workspace. V1 copies skill catalog entries
only, then returns starter prompt metadata that can help the user create fresh
workspace-specific Codex agents.

## 2. Goals

- Help users initialize a new workspace when its LOR catalog is empty.
- Copy selected skills from a source workspace into a target workspace.
- Preserve copied skill metadata, including stored `skillContext`.
- Preview the initialization before mutating the target workspace.
- Support new-agent bootstrapping through existing generated prompt flows.

## 3. Non-Goals

- Copy registered agents or `codexSessionId` values.
- Create Codex chats.
- Dispatch prompts to Codex agents.
- Write local `SKILL.md` files during workspace initialization.
- Replace lower-level catalog import/export tools.

## 4. Functional Requirements

- The server must expose `preview_workspace_initialization`.
- The server must expose `apply_workspace_initialization`.
- `preview_workspace_initialization` must accept:
  - `sourceWorkspace`
  - `targetWorkspace`
  - optional `projectName`
  - optional `skillNames`
  - optional `agentPromptRoles`
- `apply_workspace_initialization` must accept the same selection fields and
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
- The implementation should reuse existing catalog export/import behavior where
  practical.

## 5. User Stories / Use Cases

- [Initialize New Workspace From Existing Skills](../use-cases/initialize-new-workspace-from-existing-skills.md)

## 6. Data Model

Conceptual `WorkspaceInitializationPreview` fields:

- `sourceWorkspace`: resolved source workspace.
- `targetWorkspace`: resolved target workspace.
- `skillsToCopy`: selected skill entries from the source workspace.
- `duplicateSkills`: skills already present in the target workspace.
- `missingSkills`: requested skill names that were not found in the source
  workspace.
- `agentPromptRoles`: requested starter prompt roles.
- `generatedAgentPrompts`: generated prompt metadata for requested roles.
- `summary`: counts for selected, copied, skipped, missing, and generated prompt
  items.

## 7. Error Handling

- Missing source or target workspace must return `validation_error`.
- `confirm` missing or false on apply must return `validation_error`.
- Invalid role presets must return `validation_error`.
- Missing source workspace skills should return an empty preview unless specific
  missing `skillNames` were requested.
- Storage failures must return `storage_error`.

## 8. Security and Permissions

- V1 must not copy agents or Codex session IDs across workspaces.
- V1 must not write local skill files.
- V1 must not create or message Codex chats.
- V1 must keep source and target workspace catalog records isolated.
- Tool responses must not expose entries outside the requested source and target
  workspaces.

## 9. Open Questions

- Should future versions support overwrite conflict behavior for target skills?
- Should future versions support reusable named initialization templates?
- Should agent prompt roles be inferred from copied skill specialties?

## 10. Decision Log

- 2026-07-23: Define workspace initialization as skill-copying plus generated
  prompt metadata, not agent copying.
- 2026-07-23: Require preview before apply and `confirm: true` for mutation.
- 2026-07-23: Keep local skill-file sync separate from workspace initialization.
