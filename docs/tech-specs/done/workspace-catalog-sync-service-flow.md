# Workspace Catalog Sync Service Flow

## 1. Summary

Implemented for v1. This tech spec defines the service-level data flow for
Workspace Catalog Sync. The implementation composes existing catalog
export/import and agent prompt generation behavior while keeping the public
lower-level tools unchanged.

## 2. Context

Current LOR behavior already provides the building blocks needed for workspace
catalog sync:

- Workspace alias resolution in catalog service/repository code.
- Skill filtering through catalog list/export behavior.
- Duplicate skipping through import behavior.
- Deterministic role preset rendering through `generate_agent_prompt`.

Workspace Catalog Sync should live in catalog service/tool layers as a helper
workflow. It should not add SQLite tables or schema migrations.

## 3. Goals

- Resolve source and target workspaces consistently with existing catalog tools.
- Select source skills using existing catalog filters where practical.
- Build a skill-only import payload for apply.
- Preserve skill metadata exactly, including verification metadata and
  `skillContext`.
- Generate optional agent starter prompt metadata without persistence.
- Support empty target workspaces and already-populated target workspaces.

## 4. Non-Goals

- Add a new persistence model.
- Add a new import/export file format.
- Change import conflict behavior.
- Infer roles from copied skills.
- Persist generated prompts.
- Delete or mutate source workspace entries.

## 5. Preview Flow

`previewWorkspaceCatalogSync` should:

1. Validate and normalize input.
2. Resolve `sourceWorkspace` and `targetWorkspace` through existing workspace
   alias resolution.
3. Reject source and target resolving to the same canonical workspace.
4. Export or list source skills with `entryType: "skill"` and optional
   `projectName`.
5. If `skillNames` is supplied, keep only matching source skills and report
   requested names missing from the selected source set.
6. Read target skills for duplicate detection.
7. Split selected source skills into `skillsToCopy` and `duplicateSkills`.
8. Render requested agent prompt roles with existing `generateAgentPrompt`,
   using the resolved target workspace and optional `projectName`.
9. Return the preview payload without writing to SQLite or local files.

`projectName` is both a source skill filter and the project name passed to
generated prompt metadata. When omitted, source skills are not filtered by
project, and prompt generation should keep its existing default project-name
behavior.

## 6. Apply Flow

`applyWorkspaceCatalogSync` should:

1. Validate input and require `confirm: true`.
2. Recompute the preview from current storage state.
3. Build a version 1 catalog import object from `skillsToCopy` only.
4. Set the import object's `workspace` to the resolved source workspace for
   traceability, while importing into the resolved target workspace.
5. Call the same internal import path used by `import_catalog` with
   `conflictStrategy: "skip"`.
6. Return the recomputed preview fields plus `copiedSkills` and copied count
   from the import result.

Apply must not trust a client-supplied preview result. The preview is for user
approval; apply must recompute from storage to avoid stale or tampered payloads.

## 7. Data Preservation

Copied skill entries must preserve:

- `skillName`
- `projectName`
- `displayName`
- `primarySpecialty`
- `specialtyTags`
- `verificationStatus`
- `verificationSource`
- `verifiedAt`
- optional `verificationMessage`
- optional `skillContext`

Apply should write new target rows with target workspace scope. It may use the
current service clock for target `createdAt` and `updatedAt`, matching existing
import behavior.

Agents must be excluded before building the import payload. No output should
include source agent entries or source `codexSessionId` values.

## 8. Suggested Types

Add catalog-domain types equivalent to:

- `WorkspaceCatalogSyncSelection`
- `WorkspaceCatalogSyncPreviewInput`
- `ApplyWorkspaceCatalogSyncInput`
- `WorkspaceCatalogSyncPreview`
- `WorkspaceCatalogSyncApplyResult`
- `WorkspaceCatalogSyncSummary`

`WorkspaceCatalogSyncSummary` should include:

- `selectedSkills`
- `skillsToCopy`
- `duplicateSkills`
- `missingSkills`
- `generatedAgentPrompts`
- `copiedSkills` on apply

The MCP tool input schemas should live with existing tool schemas. Domain
validation should live with existing catalog validation helpers.

## 9. Failure Modes

- If source workspace has no matching skills and no specific `skillNames` were
  requested, return a successful empty preview.
- If all selected skills are duplicates, return success with zero
  `skillsToCopy`.
- If apply sees duplicates that preview did not, skip them and report them as
  duplicates in the recomputed output.
- If import fails after validation due to storage failure, return
  `storage_error`.
- If prompt generation fails due to an invalid role, return `validation_error`
  and do not apply catalog writes.

## 10. Verification Plan

Implementation verification includes:

- Source and target workspace aliases resolve before all reads and writes.
- Preview returns skills to copy, duplicates, missing requested skills, prompt
  metadata, and counts.
- Preview does not mutate target entries.
- Apply recomputes preview and does not accept client preview payloads.
- Apply copies skills only and never creates target agent rows.
- Apply preserves verification metadata and `skillContext`.
- Apply skips existing target skills by default.
- Apply works when the target workspace is empty.
- Apply works when the target workspace already contains unrelated skills.
- Apply reports missing requested source skills without failing.
- Generated prompt metadata uses existing deterministic role preset behavior and
  is not persisted.
- Existing `export_catalog`, `import_catalog`, and `generate_agent_prompt`
  public behavior remains unchanged.

## 11. Decision Log

- 2026-07-23: Reuse existing export/import and prompt-generation behavior
  internally rather than adding a new storage path.
- 2026-07-23: Recompute preview during apply so mutation is based on current
  storage state.
- 2026-07-23: Generalize the service flow from one-time initialization to
  reusable catalog sync between workspaces.
- 2026-07-23: Implement preview and apply service methods without adding SQLite
  tables or schema migrations.
