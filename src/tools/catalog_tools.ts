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
  clearWorkspaceCatalogInputSchema,
  type ClearWorkspaceCatalogToolInput,
  exportCatalogInputSchema,
  type ExportCatalogToolInput,
  findMatchingCatalogEntryInputSchema,
  type FindMatchingCatalogEntryToolInput,
  generateAgentPromptInputSchema,
  type GenerateAgentPromptToolInput,
  getCatalogEntryDetailInputSchema,
  type GetCatalogEntryDetailToolInput,
  importCatalogInputSchema,
  type ImportCatalogToolInput,
  introduceAgentInputSchema,
  type IntroduceAgentToolInput,
  introduceSkillInputSchema,
  type IntroduceSkillToolInput,
  listCatalogEntriesInputSchema,
  type ListCatalogEntriesToolInput,
  prepareAgentHandoffInputSchema,
  type PrepareAgentHandoffToolInput,
  previewSkillFileSyncInputSchema,
  type PreviewSkillFileSyncToolInput,
  previewWorkspaceCatalogSyncInputSchema,
  type PreviewWorkspaceCatalogSyncToolInput,
  proposeSkillUpdateInputSchema,
  type ProposeSkillUpdateToolInput,
  registerWorkspaceAliasInputSchema,
  type RegisterWorkspaceAliasToolInput,
  removeCatalogEntryInputSchema,
  type RemoveCatalogEntryToolInput,
  toolOutputSchema,
  updateCatalogEntryInputSchema,
  type UpdateCatalogEntryToolInput,
} from "@src/tools/schemas.ts";
import {
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
  runtimeFactory?: () => Promise<ToolRuntime>;
  logger?: LorLogger;
}

export function registerCatalogTools(
  server: McpServer,
  options: CatalogToolOptions = {},
): void {
  const runtimeFactory = options.runtimeFactory ?? createDefaultRuntime;
  const logger = (options.logger ?? createNoopLogger()).child({
    component: "tools",
  });

  server.registerTool(
    "introduce_agent",
    {
      description: "Introduce an existing Codex agent to the catalog.",
      inputSchema: introduceAgentInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: IntroduceAgentToolInput) =>
      withLoggedRuntime(
        "introduce_agent",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const entry = await runtime.service.introduceAgent(input);
          return okResult(entry, `Introduced agent ${entry.displayName}.`);
        },
      ),
  );

  server.registerTool(
    "introduce_skill",
    {
      description: "Introduce an existing Codex skill to the catalog.",
      inputSchema: introduceSkillInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: IntroduceSkillToolInput) =>
      withLoggedRuntime(
        "introduce_skill",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const entry = await runtime.service.introduceSkill(input);
          return okResult(entry, `Introduced skill ${entry.displayName}.`);
        },
      ),
  );

  server.registerTool(
    "list_catalog_entries",
    {
      description: "List introduced agents and skills in a workspace catalog.",
      inputSchema: listCatalogEntriesInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: ListCatalogEntriesToolInput) =>
      withLoggedRuntime(
        "list_catalog_entries",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const entries = await runtime.service.listEntries(input);
          return okResult(
            { entries },
            `Found ${entries.length} catalog entries.`,
          );
        },
      ),
  );

  server.registerTool(
    "clear_workspace_catalog",
    {
      description:
        "Clear introduced agents and skills from one workspace catalog.",
      inputSchema: clearWorkspaceCatalogInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: ClearWorkspaceCatalogToolInput) =>
      withLoggedRuntime(
        "clear_workspace_catalog",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.clearWorkspaceCatalog(input);
          return okResult(
            result,
            `Cleared ${result.deletedTotal} catalog entries.`,
          );
        },
      ),
  );

  server.registerTool(
    "register_workspace_alias",
    {
      description: "Register an alternate name for a workspace catalog.",
      inputSchema: registerWorkspaceAliasInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: RegisterWorkspaceAliasToolInput) =>
      withLoggedRuntime(
        "register_workspace_alias",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.registerWorkspaceAlias(input);
          return okResult(
            result,
            `Registered workspace alias ${result.alias}.`,
          );
        },
      ),
  );

  server.registerTool(
    "get_catalog_entry_detail",
    {
      description: "Get full metadata for one introduced catalog entry.",
      inputSchema: getCatalogEntryDetailInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: GetCatalogEntryDetailToolInput) =>
      withLoggedRuntime(
        "get_catalog_entry_detail",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const entry = await runtime.service.getEntryDetail(input);
          if (!entry) {
            throw new LorError(
              "not_found",
              "Catalog entry was not found.",
              { entryType: input.entryType },
            );
          }
          return okResult(entry, `Found ${entry.displayName}.`);
        },
      ),
  );

  server.registerTool(
    "update_catalog_entry",
    {
      description: "Update editable metadata for one introduced catalog entry.",
      inputSchema: updateCatalogEntryInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: UpdateCatalogEntryToolInput) =>
      withLoggedRuntime(
        "update_catalog_entry",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const entry = await runtime.service.updateCatalogEntry(input);
          return okResult(entry, `Updated ${entry.displayName}.`);
        },
      ),
  );

  server.registerTool(
    "propose_skill_update",
    {
      description:
        "Propose an approval-gated update to stored context for a registered skill.",
      inputSchema: proposeSkillUpdateInputSchema,
      outputSchema: toolOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    (input: ProposeSkillUpdateToolInput) =>
      withLoggedRuntime(
        "propose_skill_update",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.proposeSkillUpdate(input);
          return okResult(
            result,
            `Proposed update ${result.proposal.proposalId} for ${result.after.displayName}.`,
          );
        },
      ),
  );

  server.registerTool(
    "apply_skill_update",
    {
      description:
        "Apply a pending registered skill update proposal after explicit confirmation.",
      inputSchema: applySkillUpdateInputSchema,
      outputSchema: toolOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    (input: ApplySkillUpdateToolInput) =>
      withLoggedRuntime(
        "apply_skill_update",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.applySkillUpdate(input);
          return okResult(
            result,
            `Applied update ${result.proposal.proposalId} for ${result.after.displayName}.`,
          );
        },
      ),
  );

  server.registerTool(
    "preview_skill_file_sync",
    {
      description:
        "Preview writing approved registered skill context into a local SKILL.md managed section.",
      inputSchema: previewSkillFileSyncInputSchema,
      outputSchema: toolOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    (input: PreviewSkillFileSyncToolInput) =>
      withLoggedRuntime(
        "preview_skill_file_sync",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.previewSkillFileSync(input);
          return okResult(
            result,
            `Previewed local sync for ${result.skillName}.`,
          );
        },
      ),
  );

  server.registerTool(
    "apply_skill_file_sync",
    {
      description:
        "Write approved registered skill context into a local SKILL.md managed section after explicit confirmation.",
      inputSchema: applySkillFileSyncInputSchema,
      outputSchema: toolOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    (input: ApplySkillFileSyncToolInput) =>
      withLoggedRuntime(
        "apply_skill_file_sync",
        input,
        logger,
        runtimeFactory,
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

  server.registerTool(
    "remove_catalog_entry",
    {
      description: "Remove one introduced catalog entry from a workspace.",
      inputSchema: removeCatalogEntryInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: RemoveCatalogEntryToolInput) =>
      withLoggedRuntime(
        "remove_catalog_entry",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.removeCatalogEntry(input);
          return okResult(
            result,
            `Removed ${result.entryType} ${result.entryKey}.`,
          );
        },
      ),
  );

  server.registerTool(
    "export_catalog",
    {
      description: "Export workspace catalog entries as portable JSON data.",
      inputSchema: exportCatalogInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: ExportCatalogToolInput) =>
      withLoggedRuntime(
        "export_catalog",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const catalog = await runtime.service.exportCatalog(input);
          return okResult(
            catalog,
            `Exported ${catalog.entries.length} catalog entries.`,
          );
        },
      ),
  );

  server.registerTool(
    "import_catalog",
    {
      description: "Import workspace catalog entries from exported JSON data.",
      inputSchema: importCatalogInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: ImportCatalogToolInput) =>
      withLoggedRuntime(
        "import_catalog",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.importCatalog(input);
          return okResult(
            result,
            `Imported ${result.importedCount} catalog entries.`,
          );
        },
      ),
  );

  server.registerTool(
    "preview_workspace_catalog_sync",
    {
      description:
        "Preview skill-only catalog sync from one workspace catalog into another.",
      inputSchema: previewWorkspaceCatalogSyncInputSchema,
      outputSchema: toolOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    (input: PreviewWorkspaceCatalogSyncToolInput) =>
      withLoggedRuntime(
        "preview_workspace_catalog_sync",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const preview = await runtime.service.previewWorkspaceCatalogSync(
            input,
          );
          return okResult(
            preview,
            `Previewed ${preview.summary.skillsToCopy} skills to copy.`,
          );
        },
      ),
  );

  server.registerTool(
    "apply_workspace_catalog_sync",
    {
      description:
        "Copy previewed skill-only catalog entries into a target workspace after explicit confirmation.",
      inputSchema: applyWorkspaceCatalogSyncInputSchema,
      outputSchema: toolOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    (input: ApplyWorkspaceCatalogSyncToolInput) =>
      withLoggedRuntime(
        "apply_workspace_catalog_sync",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.applyWorkspaceCatalogSync(input);
          return okResult(
            result,
            `Copied ${result.importResult.importedCount} skills into ${result.targetWorkspace}.`,
          );
        },
      ),
  );

  server.registerTool(
    "check_catalog_health",
    {
      description:
        "Report workspace catalog health from stored verification metadata.",
      inputSchema: checkCatalogHealthInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: CheckCatalogHealthToolInput) =>
      withLoggedRuntime(
        "check_catalog_health",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const report = await runtime.service.checkCatalogHealth(input);
          return okResult(
            report,
            `Checked ${report.summary.total} catalog entries.`,
          );
        },
      ),
  );

  server.registerTool(
    "prepare_agent_handoff",
    {
      description:
        "Prepare a manual handoff prompt for an introduced Codex agent.",
      inputSchema: prepareAgentHandoffInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: PrepareAgentHandoffToolInput) =>
      withLoggedRuntime(
        "prepare_agent_handoff",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.prepareAgentHandoff(input);
          return okResult(
            result,
            `Prepared handoff prompt for ${result.targetAgent.displayName}.`,
          );
        },
      ),
  );

  server.registerTool(
    "generate_agent_prompt",
    {
      description: "Generate a manual starter prompt for an empty Codex chat.",
      inputSchema: generateAgentPromptInputSchema,
      outputSchema: toolOutputSchema,
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

  server.registerTool(
    "find_matching_catalog_entry",
    {
      description: "Find matching introduced agents and skills for a task.",
      inputSchema: findMatchingCatalogEntryInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: FindMatchingCatalogEntryToolInput) =>
      withLoggedRuntime(
        "find_matching_catalog_entry",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.findMatchingEntries(input);
          if (result.status === "no_match") {
            return statusResult(
              "no_match",
              result.data,
              "No matching entries.",
            );
          }
          if (result.status === "conflict") {
            return statusResult(
              "conflict",
              result.data,
              "Multiple agents matched equally well.",
            );
          }
          return okResult(result.data, "Found matching catalog entries.");
        },
      ),
  );
}

function withLoggedToolErrors(
  toolName: string,
  input: unknown,
  logger: LorLogger,
  handler: () => ToolResult,
): ToolResult {
  const startedAt = performance.now();
  const result = withToolErrors(handler);
  logToolCall(logger, toolName, input, result, startedAt);
  return result;
}

async function withLoggedRuntime(
  toolName: string,
  input: unknown,
  logger: LorLogger,
  runtimeFactory: () => Promise<ToolRuntime>,
  handler: (runtime: ToolRuntime) => Promise<ToolResult>,
): Promise<ToolResult> {
  const startedAt = performance.now();
  const result = await withRuntime(runtimeFactory, handler);
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
    status,
    durationMs: durationMs(startedAt),
    ...safeInputFields(input),
    ...safeResultFields(result),
  };
  if (errorCode) {
    fields.errorCode = errorCode;
  }

  const message = "MCP tool call completed.";
  if (errorCode === "storage_error" || errorCode === "setup_error") {
    logger.error(fields, message);
    return;
  }
  if (
    errorCode === "validation_error" ||
    errorCode === "not_found" ||
    errorCode === "duplicate_entry" ||
    errorCode === "session_error" ||
    errorCode === "verification_failed"
  ) {
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
  if (typeof input.proposalId === "string") {
    fields.proposalId = input.proposalId;
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
      "generatedAgentPrompts",
      "copiedSkills",
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
