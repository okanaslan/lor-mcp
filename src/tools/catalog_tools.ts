import type { McpServer } from "@mcp/server";
import { generateAgentPrompt } from "@src/agent_prompts/generator.ts";
import {
  appendAgentContextInputSchema,
  type AppendAgentContextToolInput,
  applySkillFileSyncInputSchema,
  type ApplySkillFileSyncToolInput,
  applySkillUpdateInputSchema,
  type ApplySkillUpdateToolInput,
  applyWorkspaceCatalogSyncInputSchema,
  type ApplyWorkspaceCatalogSyncToolInput,
  checkCatalogHealthInputSchema,
  type CheckCatalogHealthToolInput,
  clearWorkspaceAgentsInputSchema,
  type ClearWorkspaceAgentsToolInput,
  clearWorkspaceSkillsInputSchema,
  type ClearWorkspaceSkillsToolInput,
  clearWorkspaceSubagentsInputSchema,
  type ClearWorkspaceSubagentsToolInput,
  exportCatalogInputSchema,
  type ExportCatalogToolInput,
  findMatchingAgentInputSchema,
  type FindMatchingAgentToolInput,
  findMatchingSkillInputSchema,
  type FindMatchingSkillToolInput,
  findMatchingSubagentInputSchema,
  type FindMatchingSubagentToolInput,
  generateAgentPromptInputSchema,
  type GenerateAgentPromptToolInput,
  getAgentDetailInputSchema,
  type GetAgentDetailToolInput,
  getAgentTaskResultInputSchema,
  type GetAgentTaskResultToolInput,
  getAgentTaskStatusInputSchema,
  type GetAgentTaskStatusToolInput,
  getSkillDetailInputSchema,
  type GetSkillDetailToolInput,
  getSubagentDetailInputSchema,
  type GetSubagentDetailToolInput,
  getWorkspaceDiagnosticsInputSchema,
  type GetWorkspaceDiagnosticsToolInput,
  getWorkspaceNoteInputSchema,
  type GetWorkspaceNoteToolInput,
  importCatalogInputSchema,
  type ImportCatalogToolInput,
  introduceAgentInputSchema,
  type IntroduceAgentToolInput,
  introduceSkillInputSchema,
  type IntroduceSkillToolInput,
  introduceSubagentInputSchema,
  type IntroduceSubagentToolInput,
  listActiveTasksInputSchema,
  type ListActiveTasksToolInput,
  listAgentsInputSchema,
  type ListAgentsToolInput,
  listSkillsInputSchema,
  type ListSkillsToolInput,
  listSubagentsInputSchema,
  type ListSubagentsToolInput,
  listWorkspaceNotesInputSchema,
  type ListWorkspaceNotesToolInput,
  prepareAgentHandoffInputSchema,
  type PrepareAgentHandoffToolInput,
  prepareAgentRegenerationInputSchema,
  type PrepareAgentRegenerationToolInput,
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
  removeAgentInputSchema,
  type RemoveAgentToolInput,
  removeSkillInputSchema,
  type RemoveSkillToolInput,
  removeSubagentInputSchema,
  type RemoveSubagentToolInput,
  removeWorkspaceNoteInputSchema,
  type RemoveWorkspaceNoteToolInput,
  retireAgentInputSchema,
  type RetireAgentToolInput,
  sendAgentTaskInputSchema,
  type SendAgentTaskToolInput,
  toolOutputSchema,
  updateAgentInputSchema,
  type UpdateAgentToolInput,
  updateSkillInputSchema,
  type UpdateSkillToolInput,
  updateSubagentInputSchema,
  type UpdateSubagentToolInput,
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
    "introduce_subagent",
    {
      description:
        "Introduce a reusable subagent prompt profile to the catalog.",
      inputSchema: introduceSubagentInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: IntroduceSubagentToolInput) =>
      withLoggedRuntime(
        "introduce_subagent",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const entry = await runtime.service.introduceSubagent(input);
          return okResult(entry, `Introduced subagent ${entry.displayName}.`);
        },
      ),
  );

  server.registerTool(
    "list_agents",
    {
      description: "List introduced Codex agents in a workspace.",
      inputSchema: listAgentsInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: ListAgentsToolInput) =>
      withLoggedRuntime(
        "list_agents",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const agents = await runtime.service.listAgents(input);
          return okResult({ agents }, `Found ${agents.length} agents.`);
        },
      ),
  );

  server.registerTool(
    "list_skills",
    {
      description:
        "List introduced skills visible to a workspace, including global skills by default.",
      inputSchema: listSkillsInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: ListSkillsToolInput) =>
      withLoggedRuntime(
        "list_skills",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const skills = await runtime.service.listSkills(input);
          return okResult({ skills }, `Found ${skills.length} skills.`);
        },
      ),
  );

  server.registerTool(
    "list_subagents",
    {
      description:
        "List introduced reusable subagent prompt profiles visible to a workspace.",
      inputSchema: listSubagentsInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: ListSubagentsToolInput) =>
      withLoggedRuntime(
        "list_subagents",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const subagents = await runtime.service.listSubagents(input);
          return okResult(
            { subagents },
            `Found ${subagents.length} subagents.`,
          );
        },
      ),
  );

  server.registerTool(
    "clear_workspace_agents",
    {
      description:
        "Clear introduced agents from one workspace after explicit confirmation.",
      inputSchema: clearWorkspaceAgentsInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: ClearWorkspaceAgentsToolInput) =>
      withLoggedRuntime(
        "clear_workspace_agents",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.clearWorkspaceAgents(input);
          return okResult(result, `Cleared ${result.deletedAgents} agents.`);
        },
      ),
  );

  server.registerTool(
    "clear_workspace_skills",
    {
      description:
        "Clear introduced workspace-local skills from one workspace after explicit confirmation.",
      inputSchema: clearWorkspaceSkillsInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: ClearWorkspaceSkillsToolInput) =>
      withLoggedRuntime(
        "clear_workspace_skills",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.clearWorkspaceSkills(input);
          return okResult(result, `Cleared ${result.deletedSkills} skills.`);
        },
      ),
  );

  server.registerTool(
    "clear_workspace_subagents",
    {
      description:
        "Clear introduced workspace-local subagent prompt profiles from one workspace after explicit confirmation.",
      inputSchema: clearWorkspaceSubagentsInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: ClearWorkspaceSubagentsToolInput) =>
      withLoggedRuntime(
        "clear_workspace_subagents",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.clearWorkspaceSubagents(input);
          return okResult(
            result,
            `Cleared ${result.deletedSubagents} subagents.`,
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
    "promote_skill_to_global",
    {
      description:
        "Copy one workspace skill into global skill scope without removing the source skill.",
      inputSchema: promoteSkillToGlobalInputSchema,
      outputSchema: toolOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    (input: PromoteSkillToGlobalToolInput) =>
      withLoggedRuntime(
        "promote_skill_to_global",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.promoteSkillToGlobal(input);
          return okResult(
            result,
            `Promoted skill ${result.globalSkill.displayName} to global scope.`,
          );
        },
      ),
  );

  server.registerTool(
    "get_agent_detail",
    {
      description: "Get full metadata for one introduced Codex agent.",
      inputSchema: getAgentDetailInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: GetAgentDetailToolInput) =>
      withLoggedRuntime(
        "get_agent_detail",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const entry = await runtime.service.getAgentDetail(input);
          if (!entry) {
            throw new LorError("not_found", "Agent was not found.", {
              entryType: "agent",
            });
          }
          return okResult(entry, `Found ${entry.displayName}.`);
        },
      ),
  );

  server.registerTool(
    "get_skill_detail",
    {
      description: "Get full metadata for one introduced skill.",
      inputSchema: getSkillDetailInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: GetSkillDetailToolInput) =>
      withLoggedRuntime(
        "get_skill_detail",
        input,
        logger,
        runtimeFactory,
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

  server.registerTool(
    "get_subagent_detail",
    {
      description:
        "Get full metadata and rendered prompt for one introduced subagent profile.",
      inputSchema: getSubagentDetailInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: GetSubagentDetailToolInput) =>
      withLoggedRuntime(
        "get_subagent_detail",
        input,
        logger,
        runtimeFactory,
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

  server.registerTool(
    "update_agent",
    {
      description: "Update editable metadata for one introduced Codex agent.",
      inputSchema: updateAgentInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: UpdateAgentToolInput) =>
      withLoggedRuntime(
        "update_agent",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const entry = await runtime.service.updateAgent(input);
          return okResult(entry, `Updated ${entry.displayName}.`);
        },
      ),
  );

  server.registerTool(
    "update_skill",
    {
      description: "Update editable metadata for one introduced skill.",
      inputSchema: updateSkillInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: UpdateSkillToolInput) =>
      withLoggedRuntime(
        "update_skill",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const entry = await runtime.service.updateSkill(input);
          return okResult(entry, `Updated ${entry.displayName}.`);
        },
      ),
  );

  server.registerTool(
    "update_subagent",
    {
      description:
        "Update editable metadata for one introduced subagent prompt profile.",
      inputSchema: updateSubagentInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: UpdateSubagentToolInput) =>
      withLoggedRuntime(
        "update_subagent",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const entry = await runtime.service.updateSubagent(input);
          return okResult(entry, `Updated ${entry.displayName}.`);
        },
      ),
  );

  server.registerTool(
    "retire_agent",
    {
      description:
        "Mark one introduced Codex agent as retired after explicit confirmation.",
      inputSchema: retireAgentInputSchema,
      outputSchema: toolOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    (input: RetireAgentToolInput) =>
      withLoggedRuntime(
        "retire_agent",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.retireAgent(input);
          return okResult(
            result,
            `Retired agent ${result.agent.displayName}.`,
          );
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
    "remove_agent",
    {
      description: "Remove one introduced Codex agent from a workspace.",
      inputSchema: removeAgentInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: RemoveAgentToolInput) =>
      withLoggedRuntime(
        "remove_agent",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.removeAgent(input);
          return okResult(result, `Removed agent ${result.entryKey}.`);
        },
      ),
  );

  server.registerTool(
    "remove_skill",
    {
      description: "Remove one introduced skill from a workspace or scope.",
      inputSchema: removeSkillInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: RemoveSkillToolInput) =>
      withLoggedRuntime(
        "remove_skill",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.removeSkill(input);
          return okResult(result, `Removed skill ${result.entryKey}.`);
        },
      ),
  );

  server.registerTool(
    "remove_subagent",
    {
      description:
        "Remove one introduced subagent prompt profile from a workspace or scope.",
      inputSchema: removeSubagentInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: RemoveSubagentToolInput) =>
      withLoggedRuntime(
        "remove_subagent",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.removeSubagent(input);
          return okResult(result, `Removed subagent ${result.entryKey}.`);
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
        "Preview skill and subagent catalog sync from one workspace catalog into another.",
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
            `Previewed ${preview.summary.skillsToCopy} skills and ${preview.summary.subagentsToCopy} subagents to copy.`,
          );
        },
      ),
  );

  server.registerTool(
    "apply_workspace_catalog_sync",
    {
      description:
        "Copy previewed skill and subagent catalog entries into a target workspace after explicit confirmation.",
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
            `Copied ${result.importResult.importedCount} catalog entries into ${result.targetWorkspace}.`,
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
    "get_workspace_diagnostics",
    {
      description:
        "Report sanitized workspace resolution, alias, catalog count, and setup diagnostics.",
      inputSchema: getWorkspaceDiagnosticsInputSchema,
      outputSchema: toolOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    (input: GetWorkspaceDiagnosticsToolInput) =>
      withLoggedRuntime(
        "get_workspace_diagnostics",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const report = await runtime.service.getWorkspaceDiagnostics(input);
          return okResult(
            report,
            `Resolved workspace ${report.resolvedWorkspace}.`,
          );
        },
      ),
  );

  server.registerTool(
    "remember_workspace_note",
    {
      description:
        "Store a durable workspace-scoped coordination note outside the catalog.",
      inputSchema: rememberWorkspaceNoteInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: RememberWorkspaceNoteToolInput) =>
      withLoggedRuntime(
        "remember_workspace_note",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const note = await runtime.service.rememberWorkspaceNote(input);
          return okResult(note, `Remembered workspace note ${note.noteId}.`);
        },
      ),
  );

  server.registerTool(
    "list_workspace_notes",
    {
      description:
        "List workspace note summaries, optionally filtered by tags.",
      inputSchema: listWorkspaceNotesInputSchema,
      outputSchema: toolOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    (input: ListWorkspaceNotesToolInput) =>
      withLoggedRuntime(
        "list_workspace_notes",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.listWorkspaceNotes(input);
          return okResult(
            result,
            `Listed ${result.notes.length} workspace notes.`,
          );
        },
      ),
  );

  server.registerTool(
    "get_workspace_note",
    {
      description: "Get a workspace note by note id.",
      inputSchema: getWorkspaceNoteInputSchema,
      outputSchema: toolOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    (input: GetWorkspaceNoteToolInput) =>
      withLoggedRuntime(
        "get_workspace_note",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const note = await runtime.service.getWorkspaceNote(input);
          return okResult(note, `Fetched workspace note ${note.noteId}.`);
        },
      ),
  );

  server.registerTool(
    "remove_workspace_note",
    {
      description: "Remove a workspace note by note id.",
      inputSchema: removeWorkspaceNoteInputSchema,
      outputSchema: toolOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    (input: RemoveWorkspaceNoteToolInput) =>
      withLoggedRuntime(
        "remove_workspace_note",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.removeWorkspaceNote(input);
          return okResult(result, `Removed workspace note ${result.noteId}.`);
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
    "send_agent_task",
    {
      description:
        "Create and dispatch or queue a delegated task for a registered Codex agent.",
      inputSchema: sendAgentTaskInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: SendAgentTaskToolInput) =>
      withLoggedRuntime(
        "send_agent_task",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.sendAgentTask(input);
          return okResult(
            result,
            `Created delegated task ${result.task.taskId}.`,
          );
        },
      ),
  );

  server.registerTool(
    "get_agent_task_status",
    {
      description: "Get the status of a delegated agent task.",
      inputSchema: getAgentTaskStatusInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: GetAgentTaskStatusToolInput) =>
      withLoggedRuntime(
        "get_agent_task_status",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const task = await runtime.service.getAgentTaskStatus(input);
          if (!task) {
            throw new LorError(
              "not_found",
              "Delegated agent task was not found.",
            );
          }
          return okResult(task, `Found delegated task ${task.taskId}.`);
        },
      ),
  );

  server.registerTool(
    "list_active_tasks",
    {
      description: "List active delegated agent tasks in a workspace.",
      inputSchema: listActiveTasksInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: ListActiveTasksToolInput) =>
      withLoggedRuntime(
        "list_active_tasks",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.listActiveTasks(input);
          return okResult(
            result,
            `Found ${result.tasks.length} active delegated tasks.`,
          );
        },
      ),
  );

  server.registerTool(
    "append_agent_context",
    {
      description:
        "Append follow-up context to an active delegated agent task.",
      inputSchema: appendAgentContextInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: AppendAgentContextToolInput) =>
      withLoggedRuntime(
        "append_agent_context",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.appendAgentContext(input);
          return okResult(
            result,
            `Appended context to delegated task ${result.task.taskId}.`,
          );
        },
      ),
  );

  server.registerTool(
    "get_agent_task_result",
    {
      description: "Get result metadata for a delegated agent task.",
      inputSchema: getAgentTaskResultInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: GetAgentTaskResultToolInput) =>
      withLoggedRuntime(
        "get_agent_task_result",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.getAgentTaskResult(input);
          return okResult(
            result,
            result.resultAvailable
              ? `Found result for delegated task ${result.taskId}.`
              : `Delegated task ${result.taskId} has no result yet.`,
          );
        },
      ),
  );

  server.registerTool(
    "prepare_agent_regeneration",
    {
      description:
        "Prepare a manual prompt for regenerating a registered Codex agent in a fresh chat.",
      inputSchema: prepareAgentRegenerationInputSchema,
      outputSchema: toolOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    (input: PrepareAgentRegenerationToolInput) =>
      withLoggedRuntime(
        "prepare_agent_regeneration",
        input,
        logger,
        runtimeFactory,
        async (runtime) => {
          const result = await runtime.service.prepareAgentRegeneration(input);
          return okResult(
            result,
            `Prepared regeneration prompt for ${result.sourceAgent.displayName}.`,
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
    "find_matching_agent",
    {
      description: "Find matching introduced Codex agents for a task.",
      inputSchema: findMatchingAgentInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: FindMatchingAgentToolInput) =>
      withLoggedRuntime(
        "find_matching_agent",
        input,
        logger,
        runtimeFactory,
        async (runtime) =>
          matchToolResult(
            await runtime.service.findMatchingAgents(input),
            "agent",
          ),
      ),
  );

  server.registerTool(
    "find_matching_skill",
    {
      description: "Find matching introduced skills for a task.",
      inputSchema: findMatchingSkillInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: FindMatchingSkillToolInput) =>
      withLoggedRuntime(
        "find_matching_skill",
        input,
        logger,
        runtimeFactory,
        async (runtime) =>
          matchToolResult(
            await runtime.service.findMatchingSkills(input),
            "skill",
          ),
      ),
  );

  server.registerTool(
    "find_matching_subagent",
    {
      description:
        "Find matching reusable subagent prompt profiles for a task.",
      inputSchema: findMatchingSubagentInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: FindMatchingSubagentToolInput) =>
      withLoggedRuntime(
        "find_matching_subagent",
        input,
        logger,
        runtimeFactory,
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
  if (result.status === "no_match") {
    return statusResult(
      "no_match",
      result.data,
      `No matching ${entryLabel}s.`,
    );
  }
  if (result.status === "conflict") {
    return statusResult(
      "conflict",
      result.data,
      "Multiple agents matched with near-equal strength.",
    );
  }
  return okResult(result.data, `Found matching ${entryLabel}s.`);
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
