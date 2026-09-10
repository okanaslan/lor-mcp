import { outputSchemaFor } from "@src/tools/output_schemas.ts";
import { BUILD_IDENTITY } from "@src/build.ts";
import { fingerprint } from "@src/catalog/revision.ts";
import { compactMatches, entrySummary } from "@src/tools/discovery.ts";
import { catalogResourceUri } from "@src/catalog/context.ts";
import * as z from "zod/v4";
import { toolEffectDescription, toolPolicy } from "@src/tools/policy.ts";
import type { McpServer } from "@mcp/server";
import { generateAgentPrompt } from "@src/agent_prompts/generator.ts";
import {
  applySkillFileSyncInputSchema,
  type ApplySkillFileSyncToolInput,
  applySkillUpdateInputSchema,
  type ApplySkillUpdateToolInput,
  applyWorkspaceCatalogSyncInputSchema,
  type ApplyWorkspaceCatalogSyncToolInput,
  checkCatalogHealthInputSchema,
  type CheckCatalogHealthToolInput,
  clearWorkspaceSkillsInputSchema,
  type ClearWorkspaceSkillsToolInput,
  clearWorkspaceSubagentsInputSchema,
  type ClearWorkspaceSubagentsToolInput,
  exportCatalogInputSchema,
  type ExportCatalogToolInput,
  findMatchingSkillInputSchema,
  type FindMatchingSkillToolInput,
  findMatchingSubagentInputSchema,
  type FindMatchingSubagentToolInput,
  findMatchingWorkspaceNoteInputSchema,
  type FindMatchingWorkspaceNoteToolInput,
  generateAgentPromptInputSchema,
  type GenerateAgentPromptToolInput,
  getSkillDetailInputSchema,
  type GetSkillDetailToolInput,
  getSubagentDetailInputSchema,
  type GetSubagentDetailToolInput,
  getUsageAnalyticsInputSchema,
  type GetUsageAnalyticsToolInput,
  getWorkspaceDiagnosticsInputSchema,
  type GetWorkspaceDiagnosticsToolInput,
  getWorkspaceNoteInputSchema,
  type GetWorkspaceNoteToolInput,
  importCatalogInputSchema,
  type ImportCatalogToolInput,
  introduceSkillInputSchema,
  type IntroduceSkillToolInput,
  introduceSubagentInputSchema,
  type IntroduceSubagentToolInput,
  listSkillsInputSchema,
  type ListSkillsToolInput,
  listSubagentsInputSchema,
  type ListSubagentsToolInput,
  listWorkspaceNotesInputSchema,
  type ListWorkspaceNotesToolInput,
  previewSkillFileSyncInputSchema,
  type PreviewSkillFileSyncToolInput,
  previewWorkspaceCatalogSyncInputSchema,
  type PreviewWorkspaceCatalogSyncToolInput,
  promoteSkillToGlobalInputSchema,
  type PromoteSkillToGlobalToolInput,
  proposeSkillUpdateInputSchema,
  type ProposeSkillUpdateToolInput,
  registerWorkspaceAliasInputSchema,
  type RegisterWorkspaceAliasToolInput,
  rememberWorkspaceNoteInputSchema,
  type RememberWorkspaceNoteToolInput,
  removeSkillInputSchema,
  type RemoveSkillToolInput,
  removeSubagentInputSchema,
  type RemoveSubagentToolInput,
  removeWorkspaceNoteInputSchema,
  type RemoveWorkspaceNoteToolInput,
  updateSkillInputSchema,
  type UpdateSkillToolInput,
  updateSubagentInputSchema,
  type UpdateSubagentToolInput,
} from "@src/tools/schemas.ts";
import {
  correlateResult,
  errorResult,
  okResult,
  statusResult,
  type ToolResult,
} from "@src/tools/response.ts";
import { createDefaultRuntime, type ToolRuntime } from "@src/tools/runtime.ts";
import { LorError, toLorError } from "@src/errors.ts";
import {
  createNoopLogger,
  type LogFields,
  type LorLogger,
} from "@src/logger.ts";

export interface CatalogToolOptions {
  registerTool?: McpServer["registerTool"];
  toolContractFingerprint?: () => string;
  runtimeFactory?: () => Promise<ToolRuntime>;
  logger?: LorLogger;
}

export function registerCatalogTools(
  server: McpServer,
  options: CatalogToolOptions = {},
): void {
  const registerTool = options.registerTool ?? server.registerTool.bind(server);
  const logger = (options.logger ?? createNoopLogger()).child({
    component: "tools",
  });
  const runtimeFactory = options.runtimeFactory ??
    (() => createDefaultRuntime({ logger }));

  registerTool(
    "get_operation",
    {
      description:
        "Read a durable operation receipt after an uncertain write. A pending receipt must not be blindly retried. Requires access to the workspace and original operation.",
      annotations: toolPolicy("get_operation"),
      inputSchema: z.strictObject({
        workspace: z.string().min(1).max(16000),
        operationKey: z.string().min(1).max(120),
      }),
      outputSchema: outputSchemaFor("get_operation"),
    },
    (
      input: { workspace: string; operationKey: string },
      extra: { signal: AbortSignal },
    ) =>
      withLoggedRuntime(
        "get_operation",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        (runtime) => {
          const receipt = runtime.getOperation?.(
            input.workspace,
            input.operationKey,
          );
          if (!receipt) {
            throw new LorError(
              "not_found",
              "Operation receipt not found.",
            );
          }
          return okResult(
            {
              operationKey: receipt.operationKey,
              status: receipt.status,
              createdAt: receipt.createdAt,
            },
            "Operation receipt found. Retry the original request with its original key to retrieve a completed result.",
          );
        },
      ),
  );

  registerTool(
    "introduce_skill",
    {
      annotations: toolPolicy("introduce_skill"),
      description: "Introduce an existing Codex skill to the catalog." +
        toolEffectDescription("introduce_skill"),
      inputSchema: introduceSkillInputSchema,
      outputSchema: outputSchemaFor("introduce_skill"),
    },
    (input: IntroduceSkillToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "introduce_skill",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const entry = await runtime.service.introduceSkill(input);
          return okResult(entry, `Introduced skill ${entry.displayName}.`);
        },
      ),
  );

  registerTool(
    "introduce_subagent",
    {
      annotations: toolPolicy("introduce_subagent"),
      description:
        "Introduce a reusable subagent prompt profile to the catalog." +
        toolEffectDescription("introduce_subagent"),
      inputSchema: introduceSubagentInputSchema,
      outputSchema: outputSchemaFor("introduce_subagent"),
    },
    (input: IntroduceSubagentToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "introduce_subagent",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const entry = await runtime.service.introduceSubagent(input);
          return okResult(entry, `Introduced subagent ${entry.displayName}.`);
        },
      ),
  );

  registerTool(
    "list_skills",
    {
      annotations: toolPolicy("list_skills"),
      description:
        "List introduced skills visible to a workspace, including global skills by default." +
        toolEffectDescription("list_skills"),
      inputSchema: listSkillsInputSchema,
      outputSchema: outputSchemaFor("list_skills"),
    },
    (input: ListSkillsToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "list_skills",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const { items, ...pagination } = await runtime.service
            .listCatalogPage({
              entryType: "skill",
              workspace: input.workspace,
              scope: input.scope,
              projectName: input.projectName,
            }, input);
          return okResult(
            {
              skills: items.map((entry) =>
                entrySummary(entry, input.workspace)
              ),
              ...pagination,
            },
            `Returned ${items.length} of ${pagination.total} skills. Use get_skill_detail for instructions.`,
          );
        },
      ),
  );

  registerTool(
    "list_subagents",
    {
      annotations: toolPolicy("list_subagents"),
      description:
        "List introduced reusable subagent prompt profiles visible to a workspace." +
        toolEffectDescription("list_subagents"),
      inputSchema: listSubagentsInputSchema,
      outputSchema: outputSchemaFor("list_subagents"),
    },
    (input: ListSubagentsToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "list_subagents",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const { items, ...pagination } = await runtime.service
            .listCatalogPage({
              entryType: "subagent",
              workspace: input.workspace,
              scope: input.scope,
              projectName: input.projectName,
            }, input);
          return okResult(
            {
              subagents: items.map((entry) =>
                entrySummary(entry, input.workspace)
              ),
              ...pagination,
            },
            `Returned ${items.length} of ${pagination.total} subagents. Use get_subagent_detail for the prompt.`,
          );
        },
      ),
  );

  registerTool(
    "clear_workspace_skills",
    {
      annotations: toolPolicy("clear_workspace_skills"),
      description:
        "Clear introduced workspace-local skills from one workspace after explicit confirmation." +
        toolEffectDescription("clear_workspace_skills"),
      inputSchema: clearWorkspaceSkillsInputSchema,
      outputSchema: outputSchemaFor("clear_workspace_skills"),
    },
    (input: ClearWorkspaceSkillsToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "clear_workspace_skills",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const result = await runtime.service.clearWorkspaceSkills(input);
          return okResult(result, `Cleared ${result.deletedSkills} skills.`);
        },
      ),
  );

  registerTool(
    "clear_workspace_subagents",
    {
      annotations: toolPolicy("clear_workspace_subagents"),
      description:
        "Clear introduced workspace-local subagent prompt profiles from one workspace after explicit confirmation." +
        toolEffectDescription("clear_workspace_subagents"),
      inputSchema: clearWorkspaceSubagentsInputSchema,
      outputSchema: outputSchemaFor("clear_workspace_subagents"),
    },
    (input: ClearWorkspaceSubagentsToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "clear_workspace_subagents",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const result = await runtime.service.clearWorkspaceSubagents(input);
          return okResult(
            result,
            `Cleared ${result.deletedSubagents} subagents.`,
          );
        },
      ),
  );

  registerTool(
    "register_workspace_alias",
    {
      annotations: toolPolicy("register_workspace_alias"),
      description: "Register an alternate name for a workspace catalog." +
        toolEffectDescription("register_workspace_alias"),
      inputSchema: registerWorkspaceAliasInputSchema,
      outputSchema: outputSchemaFor("register_workspace_alias"),
    },
    (input: RegisterWorkspaceAliasToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "register_workspace_alias",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const result = await runtime.service.registerWorkspaceAlias(input);
          return okResult(
            result,
            `Registered workspace alias ${result.alias}.`,
          );
        },
      ),
  );

  registerTool(
    "promote_skill_to_global",
    {
      annotations: toolPolicy("promote_skill_to_global"),
      description:
        "Copy one workspace skill into global skill scope without removing the source skill." +
        toolEffectDescription("promote_skill_to_global"),
      inputSchema: promoteSkillToGlobalInputSchema,
      outputSchema: outputSchemaFor("promote_skill_to_global"),
    },
    (input: PromoteSkillToGlobalToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "promote_skill_to_global",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const result = await runtime.service.promoteSkillToGlobal(input);
          return okResult(
            result,
            `Promoted skill ${result.globalSkill.displayName} to global scope.`,
          );
        },
      ),
  );

  registerTool(
    "get_skill_detail",
    {
      annotations: toolPolicy("get_skill_detail"),
      description: "Get full metadata for one introduced skill." +
        toolEffectDescription("get_skill_detail"),
      inputSchema: getSkillDetailInputSchema,
      outputSchema: outputSchemaFor("get_skill_detail"),
    },
    (input: GetSkillDetailToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "get_skill_detail",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const entry = await runtime.service.getSkillDetail(input);
          if (!entry) {
            throw new LorError("not_found", "Skill was not found.", {
              entryType: "skill",
            });
          }
          return okResult(entry, `Found ${entry.displayName}.`);
        },
      ),
  );

  registerTool(
    "get_subagent_detail",
    {
      annotations: toolPolicy("get_subagent_detail"),
      description:
        "Get full metadata and rendered prompt for one introduced subagent profile." +
        toolEffectDescription("get_subagent_detail"),
      inputSchema: getSubagentDetailInputSchema,
      outputSchema: outputSchemaFor("get_subagent_detail"),
    },
    (input: GetSubagentDetailToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "get_subagent_detail",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const entry = await runtime.service.getSubagentDetail(input);
          if (!entry) {
            throw new LorError("not_found", "Subagent was not found.", {
              entryType: "subagent",
            });
          }
          return okResult(entry, `Found ${entry.displayName}.`);
        },
      ),
  );

  registerTool(
    "update_skill",
    {
      annotations: toolPolicy("update_skill"),
      description: "Update editable metadata for one introduced skill." +
        toolEffectDescription("update_skill"),
      inputSchema: updateSkillInputSchema,
      outputSchema: outputSchemaFor("update_skill"),
    },
    (input: UpdateSkillToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "update_skill",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const entry = await runtime.service.updateSkill(input);
          return okResult(entry, `Updated ${entry.displayName}.`);
        },
      ),
  );

  registerTool(
    "update_subagent",
    {
      annotations: toolPolicy("update_subagent"),
      description:
        "Update editable metadata for one introduced subagent prompt profile." +
        toolEffectDescription("update_subagent"),
      inputSchema: updateSubagentInputSchema,
      outputSchema: outputSchemaFor("update_subagent"),
    },
    (input: UpdateSubagentToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "update_subagent",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const entry = await runtime.service.updateSubagent(input);
          return okResult(entry, `Updated ${entry.displayName}.`);
        },
      ),
  );

  registerTool(
    "propose_skill_update",
    {
      annotations: toolPolicy("propose_skill_update"),
      description:
        "Propose an approval-gated update to stored context for a registered skill." +
        toolEffectDescription("propose_skill_update"),
      inputSchema: proposeSkillUpdateInputSchema,
      outputSchema: outputSchemaFor("propose_skill_update"),
    },
    (input: ProposeSkillUpdateToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "propose_skill_update",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const result = await runtime.service.proposeSkillUpdate(input);
          return okResult(
            result,
            `Proposed update ${result.proposal.proposalId} for ${result.after.displayName}.`,
          );
        },
      ),
  );

  registerTool(
    "apply_skill_update",
    {
      annotations: toolPolicy("apply_skill_update"),
      description:
        "Apply a pending registered skill update proposal after explicit confirmation." +
        toolEffectDescription("apply_skill_update"),
      inputSchema: applySkillUpdateInputSchema,
      outputSchema: outputSchemaFor("apply_skill_update"),
    },
    (input: ApplySkillUpdateToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "apply_skill_update",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const result = await runtime.service.applySkillUpdate(input);
          return okResult(
            result,
            `Applied update ${result.proposal.proposalId} for ${result.after.displayName}.`,
          );
        },
      ),
  );

  registerTool(
    "preview_skill_file_sync",
    {
      annotations: toolPolicy("preview_skill_file_sync"),
      description:
        "Preview writing approved registered skill context into a local SKILL.md managed section." +
        toolEffectDescription("preview_skill_file_sync"),
      inputSchema: previewSkillFileSyncInputSchema,
      outputSchema: outputSchemaFor("preview_skill_file_sync"),
    },
    (input: PreviewSkillFileSyncToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "preview_skill_file_sync",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const result = await runtime.service.previewSkillFileSync(input);
          return okResult(
            result,
            `Previewed local sync for ${result.skillName}.`,
          );
        },
      ),
  );

  registerTool(
    "apply_skill_file_sync",
    {
      annotations: toolPolicy("apply_skill_file_sync"),
      description:
        "Write approved registered skill context into a local SKILL.md managed section after explicit confirmation." +
        toolEffectDescription("apply_skill_file_sync"),
      inputSchema: applySkillFileSyncInputSchema,
      outputSchema: outputSchemaFor("apply_skill_file_sync"),
    },
    (input: ApplySkillFileSyncToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "apply_skill_file_sync",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const result = await runtime.service.applySkillFileSync(input);
          return okResult(
            result,
            result.written
              ? `Synced local skill file for ${result.skillName}.`
              : `Local skill file already matched ${result.skillName}.`,
          );
        },
      ),
  );

  registerTool(
    "remove_skill",
    {
      annotations: toolPolicy("remove_skill"),
      description: "Remove one introduced skill from a workspace or scope." +
        toolEffectDescription("remove_skill"),
      inputSchema: removeSkillInputSchema,
      outputSchema: outputSchemaFor("remove_skill"),
    },
    (input: RemoveSkillToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "remove_skill",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const result = await runtime.service.removeSkill(input);
          return okResult(result, `Removed skill ${result.entryKey}.`);
        },
      ),
  );

  registerTool(
    "remove_subagent",
    {
      annotations: toolPolicy("remove_subagent"),
      description:
        "Remove one introduced subagent prompt profile from a workspace or scope." +
        toolEffectDescription("remove_subagent"),
      inputSchema: removeSubagentInputSchema,
      outputSchema: outputSchemaFor("remove_subagent"),
    },
    (input: RemoveSubagentToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "remove_subagent",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const result = await runtime.service.removeSubagent(input);
          return okResult(result, `Removed subagent ${result.entryKey}.`);
        },
      ),
  );

  registerTool(
    "export_catalog",
    {
      annotations: toolPolicy("export_catalog"),
      description: "Export workspace catalog entries as portable JSON data." +
        toolEffectDescription("export_catalog"),
      inputSchema: exportCatalogInputSchema,
      outputSchema: outputSchemaFor("export_catalog"),
    },
    (input: ExportCatalogToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "export_catalog",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const catalog = await runtime.service.exportCatalogPage(input, input);
          return okResult(
            catalog,
            `Exported ${catalog.entries.length} of ${catalog.total} catalog entries. Follow nextCursor for remaining pages.`,
          );
        },
      ),
  );

  registerTool(
    "import_catalog",
    {
      annotations: toolPolicy("import_catalog"),
      description: "Import workspace catalog entries from exported JSON data." +
        toolEffectDescription("import_catalog"),
      inputSchema: importCatalogInputSchema,
      outputSchema: outputSchemaFor("import_catalog"),
    },
    (input: ImportCatalogToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "import_catalog",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const result = await runtime.service.importCatalog(input);
          return okResult(
            result,
            `Imported ${result.importedCount} catalog entries.`,
          );
        },
      ),
  );

  registerTool(
    "preview_workspace_catalog_sync",
    {
      annotations: toolPolicy("preview_workspace_catalog_sync"),
      description:
        "Preview skill and subagent catalog sync from one workspace catalog into another." +
        toolEffectDescription("preview_workspace_catalog_sync"),
      inputSchema: previewWorkspaceCatalogSyncInputSchema,
      outputSchema: outputSchemaFor("preview_workspace_catalog_sync"),
    },
    (
      input: PreviewWorkspaceCatalogSyncToolInput,
      extra: { signal: AbortSignal },
    ) =>
      withLoggedRuntime(
        "preview_workspace_catalog_sync",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const preview = await runtime.service.previewWorkspaceCatalogSync(
            input,
          );
          return okResult(
            preview,
            `Previewed ${preview.summary.skillsToCopy} skills and ${preview.summary.subagentsToCopy} subagents to copy.`,
          );
        },
      ),
  );

  registerTool(
    "apply_workspace_catalog_sync",
    {
      annotations: toolPolicy("apply_workspace_catalog_sync"),
      description:
        "Copy previewed skill and subagent catalog entries into a target workspace after explicit confirmation." +
        toolEffectDescription("apply_workspace_catalog_sync"),
      inputSchema: applyWorkspaceCatalogSyncInputSchema,
      outputSchema: outputSchemaFor("apply_workspace_catalog_sync"),
    },
    (
      input: ApplyWorkspaceCatalogSyncToolInput,
      extra: { signal: AbortSignal },
    ) =>
      withLoggedRuntime(
        "apply_workspace_catalog_sync",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const result = await runtime.service.applyWorkspaceCatalogSync(input);
          return okResult(
            result,
            `Copied ${result.importResult.importedCount} catalog entries into ${result.targetWorkspace}.`,
          );
        },
      ),
  );

  registerTool(
    "check_catalog_health",
    {
      annotations: toolPolicy("check_catalog_health"),
      description:
        "Report workspace catalog health from stored verification metadata." +
        toolEffectDescription("check_catalog_health"),
      inputSchema: checkCatalogHealthInputSchema,
      outputSchema: outputSchemaFor("check_catalog_health"),
    },
    (input: CheckCatalogHealthToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "check_catalog_health",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const report = await runtime.service.checkCatalogHealth(input);
          return okResult(
            report,
            `Checked ${report.summary.total} catalog entries.`,
          );
        },
      ),
  );

  registerTool(
    "get_workspace_diagnostics",
    {
      annotations: toolPolicy("get_workspace_diagnostics"),
      description:
        "Report sanitized workspace resolution, alias, catalog count, and setup diagnostics." +
        toolEffectDescription("get_workspace_diagnostics"),
      inputSchema: getWorkspaceDiagnosticsInputSchema,
      outputSchema: outputSchemaFor("get_workspace_diagnostics"),
    },
    (input: GetWorkspaceDiagnosticsToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "get_workspace_diagnostics",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const report = await runtime.service.getWorkspaceDiagnostics(input);
          return okResult(
            {
              ...report,
              runtimeStatus: {
                ...report.runtimeStatus,
                ...BUILD_IDENTITY,
                toolContractFingerprint: options.toolContractFingerprint?.() ??
                  fingerprint([]),
              },
            },
            `Resolved workspace ${report.resolvedWorkspace}.`,
          );
        },
      ),
  );

  registerTool(
    "get_usage_analytics",
    {
      annotations: toolPolicy("get_usage_analytics"),
      description:
        "Read local aggregate usage counters for skills, subagents, and workspace notes." +
        toolEffectDescription("get_usage_analytics"),
      inputSchema: getUsageAnalyticsInputSchema,
      outputSchema: outputSchemaFor("get_usage_analytics"),
    },
    (input: GetUsageAnalyticsToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "get_usage_analytics",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const report = await runtime.service.getUsageAnalytics(input);
          return okResult(
            report,
            `Found ${report.summary.totalCount} recorded usage events across ${report.summary.totalEntries} entries.`,
          );
        },
      ),
  );

  registerTool(
    "remember_workspace_note",
    {
      annotations: toolPolicy("remember_workspace_note"),
      description:
        "Store a durable workspace-scoped coordination note outside the catalog." +
        toolEffectDescription("remember_workspace_note"),
      inputSchema: rememberWorkspaceNoteInputSchema,
      outputSchema: outputSchemaFor("remember_workspace_note"),
    },
    (input: RememberWorkspaceNoteToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "remember_workspace_note",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const note = await runtime.service.rememberWorkspaceNote(input);
          return okResult(note, `Remembered workspace note ${note.noteId}.`);
        },
      ),
  );

  registerTool(
    "list_workspace_notes",
    {
      annotations: toolPolicy("list_workspace_notes"),
      description:
        "List workspace note summaries, optionally filtered by tags." +
        toolEffectDescription("list_workspace_notes"),
      inputSchema: listWorkspaceNotesInputSchema,
      outputSchema: outputSchemaFor("list_workspace_notes"),
    },
    (input: ListWorkspaceNotesToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "list_workspace_notes",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const result = await runtime.service.listWorkspaceNotePage(input);
          return okResult(
            {
              ...result,
              notes: result.notes.map((note) => ({
                ...note,
                resourceUri: catalogResourceUri(
                  "note",
                  input.workspace,
                  "workspace",
                  note.noteId,
                ),
              })),
            },
            `Returned ${result.notes.length} of ${result.total} workspace notes.`,
          );
        },
      ),
  );

  registerTool(
    "find_matching_workspace_note",
    {
      annotations: toolPolicy("find_matching_workspace_note"),
      description:
        "Find matching workspace note summaries by query, optionally filtered by tags." +
        toolEffectDescription("find_matching_workspace_note"),
      inputSchema: findMatchingWorkspaceNoteInputSchema,
      outputSchema: outputSchemaFor("find_matching_workspace_note"),
    },
    (
      input: FindMatchingWorkspaceNoteToolInput,
      extra: { signal: AbortSignal },
    ) =>
      withLoggedRuntime(
        "find_matching_workspace_note",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const result = await runtime.service.findMatchingWorkspaceNotes(
            input,
          );
          if (result.status === "ok") {
            return okResult(
              result,
              `Found ${result.notes.length} matching workspace notes.`,
            );
          }
          return statusResult(
            "no_match",
            result,
            "No matching workspace notes found.",
          );
        },
      ),
  );

  registerTool(
    "get_workspace_note",
    {
      annotations: toolPolicy("get_workspace_note"),
      description: "Get a workspace note by note id." +
        toolEffectDescription("get_workspace_note"),
      inputSchema: getWorkspaceNoteInputSchema,
      outputSchema: outputSchemaFor("get_workspace_note"),
    },
    (input: GetWorkspaceNoteToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "get_workspace_note",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const note = await runtime.service.getWorkspaceNote(input);
          return okResult(note, `Fetched workspace note ${note.noteId}.`);
        },
      ),
  );

  registerTool(
    "remove_workspace_note",
    {
      annotations: toolPolicy("remove_workspace_note"),
      description: "Remove a workspace note by note id." +
        toolEffectDescription("remove_workspace_note"),
      inputSchema: removeWorkspaceNoteInputSchema,
      outputSchema: outputSchemaFor("remove_workspace_note"),
    },
    (input: RemoveWorkspaceNoteToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "remove_workspace_note",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) => {
          const result = await runtime.service.removeWorkspaceNote(input);
          return okResult(result, `Removed workspace note ${result.noteId}.`);
        },
      ),
  );

  registerTool(
    "generate_agent_prompt",
    {
      annotations: toolPolicy("generate_agent_prompt"),
      description: "Generate a manual starter prompt for an empty Codex chat." +
        toolEffectDescription("generate_agent_prompt"),
      inputSchema: generateAgentPromptInputSchema,
      outputSchema: outputSchemaFor("generate_agent_prompt"),
    },
    (input: GenerateAgentPromptToolInput) =>
      withLoggedToolErrors("generate_agent_prompt", input, logger, () => {
        const result = generateAgentPrompt(input);
        return okResult(
          result,
          `Generated ${result.displayName} starter prompt.`,
        );
      }),
  );

  registerTool(
    "find_matching_skill",
    {
      annotations: toolPolicy("find_matching_skill"),
      description: "Find matching introduced skills for a task." +
        toolEffectDescription("find_matching_skill"),
      inputSchema: findMatchingSkillInputSchema,
      outputSchema: outputSchemaFor("find_matching_skill"),
    },
    (input: FindMatchingSkillToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "find_matching_skill",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) =>
          matchToolResult(
            await runtime.service.findMatchingSkills(input),
            "skill",
          ),
      ),
  );

  registerTool(
    "find_matching_subagent",
    {
      annotations: toolPolicy("find_matching_subagent"),
      description:
        "Find matching reusable subagent prompt profiles for a task." +
        toolEffectDescription("find_matching_subagent"),
      inputSchema: findMatchingSubagentInputSchema,
      outputSchema: outputSchemaFor("find_matching_subagent"),
    },
    (input: FindMatchingSubagentToolInput, extra: { signal: AbortSignal }) =>
      withLoggedRuntime(
        "find_matching_subagent",
        input,
        logger,
        runtimeFactory,
        extra.signal,
        async (runtime) =>
          matchToolResult(
            await runtime.service.findMatchingSubagents(input),
            "subagent",
          ),
      ),
  );
}

function matchToolResult(
  result: Awaited<ReturnType<ToolRuntime["service"]["findMatchingEntries"]>>,
  entryLabel: "agent" | "skill" | "subagent",
): ToolResult {
  const data = compactMatches(result.data);
  if (result.status === "no_match") {
    return statusResult(
      "no_match",
      data,
      `No matching ${entryLabel}s.`,
    );
  }
  if (result.status === "conflict") {
    return statusResult(
      "conflict",
      data,
      "Multiple catalog entries matched with near-equal strength.",
    );
  }
  return okResult(data, `Found matching ${entryLabel}s.`);
}

function withLoggedToolErrors(
  toolName: string,
  input: unknown,
  logger: LorLogger,
  handler: () => ToolResult,
): ToolResult {
  const startedAt = performance.now();
  const result = correlateResult(withToolErrors(handler), crypto.randomUUID());
  logToolCall(logger, toolName, input, result, startedAt);
  return result;
}

async function withLoggedRuntime(
  toolName: string,
  input: unknown,
  logger: LorLogger,
  runtimeFactory: () => Promise<ToolRuntime>,
  signal: AbortSignal,
  handler: (runtime: ToolRuntime) => Promise<ToolResult> | ToolResult,
): Promise<ToolResult> {
  const startedAt = performance.now();
  const result = correlateResult(
    await withRuntime(runtimeFactory, async (runtime) => {
      if (signal.aborted) {
        throw new LorError(
          "request_cancelled",
          "Request cancelled before execution.",
        );
      }
      await runtime.authorize?.(toolName, input);
      if (signal.aborted) {
        throw new LorError(
          "request_cancelled",
          "Request cancelled before execution.",
        );
      }
      return runtime.execute
        ? await runtime.execute(
          toolName,
          input,
          () => Promise.resolve(handler(runtime)),
        )
        : await handler(runtime);
    }),
    crypto.randomUUID(),
  );
  logToolCall(logger, toolName, input, result, startedAt);
  return result;
}

function withToolErrors(handler: () => ToolResult): ToolResult {
  try {
    return handler();
  } catch (error) {
    const appError = toLorError(error);
    return errorResult(
      appError.code,
      stripErrorPrefix(appError.message, appError.code),
      appError.details,
    );
  }
}

async function withRuntime(
  runtimeFactory: () => Promise<ToolRuntime>,
  handler: (runtime: ToolRuntime) => Promise<ToolResult>,
): Promise<ToolResult> {
  let runtime: ToolRuntime | undefined;
  try {
    runtime = await runtimeFactory();
    return await handler(runtime);
  } catch (error) {
    const appError = toLorError(error);
    return errorResult(
      appError.code,
      stripErrorPrefix(appError.message, appError.code),
      appError.details,
    );
  } finally {
    runtime?.close();
  }
}

function stripErrorPrefix(message: string, code: string): string {
  return message.startsWith(`${code}: `)
    ? message.slice(code.length + 2)
    : message;
}

function logToolCall(
  logger: LorLogger,
  toolName: string,
  input: unknown,
  result: ToolResult,
  startedAt: number,
): void {
  const status = getResultStatus(result);
  const errorCode = getErrorCode(result);
  const fields: LogFields = {
    event: "mcp_tool_call",
    toolName,
    requestId: result.structuredContent.requestId,
    status,
    durationMs: durationMs(startedAt),
    ...safeInputFields(input),
    ...safeResultFields(result),
  };
  if (errorCode) {
    fields.errorCode = errorCode;
  }

  const message = "MCP tool call completed.";
  if (
    ["storage_error", "setup_error", "internal_error"].includes(errorCode ?? "")
  ) {
    logger.error(fields, message);
    return;
  }
  if (errorCode && errorCode !== "request_cancelled") {
    logger.warn(fields, message);
    return;
  }
  logger.info(fields, message);
}

function getResultStatus(result: ToolResult): string {
  const status = result.structuredContent.status;
  return typeof status === "string" ? status : "unknown";
}

function getErrorCode(result: ToolResult): string | undefined {
  const error = result.structuredContent.error;
  if (!isRecord(error)) {
    return undefined;
  }
  return typeof error.code === "string" ? error.code : undefined;
}

function safeInputFields(input: unknown): LogFields {
  if (!isRecord(input)) {
    return {};
  }
  const fields: LogFields = {};
  if (typeof input.workspace === "string") {
    fields.workspace = input.workspace;
  }
  if (typeof input.entryType === "string") {
    fields.entryType = input.entryType;
  }
  if (typeof input.entryKey === "string") {
    fields.entryKey = input.entryKey;
  }
  if (typeof input.agentEntryKey === "string") {
    fields.agentEntryKey = input.agentEntryKey;
  }
  if (typeof input.skillName === "string") {
    fields.skillName = input.skillName;
  }
  if (typeof input.name === "string") {
    fields.subagentName = input.name;
  }
  if (typeof input.subagentName === "string") {
    fields.subagentName = input.subagentName;
  }
  if (typeof input.proposalId === "string") {
    fields.proposalId = input.proposalId;
  }
  if (typeof input.noteId === "string") {
    fields.noteId = input.noteId;
  }
  if (typeof input.alias === "string") {
    fields.alias = input.alias;
  }
  if (typeof input.sourceWorkspace === "string") {
    fields.sourceWorkspace = input.sourceWorkspace;
  }
  if (typeof input.targetWorkspace === "string") {
    fields.targetWorkspace = input.targetWorkspace;
  }
  return fields;
}

function safeResultFields(result: ToolResult): LogFields {
  const data = result.structuredContent.data;
  if (!isRecord(data) || !isRecord(data.summary)) {
    return {};
  }

  const fields: LogFields = {};
  for (
    const key of [
      "selectedSkills",
      "skillsToCopy",
      "duplicateSkills",
      "missingSkills",
      "selectedSubagents",
      "subagentsToCopy",
      "duplicateSubagents",
      "missingSubagents",
      "generatedAgentPrompts",
      "copiedSkills",
      "copiedSubagents",
    ]
  ) {
    const value = data.summary[key];
    if (typeof value === "number") {
      fields[key] = value;
    }
  }
  return fields;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function durationMs(startedAt: number): number {
  return Math.round((performance.now() - startedAt) * 100) / 100;
}
