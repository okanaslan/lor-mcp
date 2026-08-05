import {
  type AgentCatalogEntry,
  type AgentTaskDispatcher,
  type AgentTaskResult,
  type AppendAgentContextInput,
  type AppendAgentContextResult,
  type ApplySkillFileSyncInput,
  type ApplySkillUpdateInput,
  type ApplyWorkspaceCatalogSyncInput,
  type CatalogEntry,
  type CatalogEntryUpdate,
  type CatalogExport,
  type CatalogExportFilter,
  type CatalogExportSkillEntry,
  type CatalogExportSubagentEntry,
  type CatalogHealthEntry,
  type CatalogHealthFilter,
  type CatalogHealthIssue,
  type CatalogHealthReport,
  type CatalogHealthSummary,
  type CatalogImportInput,
  type CatalogImportIssue,
  type CatalogImportResult,
  type CatalogRepository,
  type CatalogScope,
  type ClearWorkspaceCatalogInput,
  type ClearWorkspaceCatalogResult,
  type DelegatedAgentTask,
  type EntryLookup,
  type GetAgentTaskResultInput,
  type GetAgentTaskStatusInput,
  type IntroduceAgentInput,
  type IntroduceSkillInput,
  type IntroduceSubagentInput,
  type ListActiveTasksInput,
  type ListActiveTasksResult,
  type ListEntriesFilter,
  type MatchRequest,
  type MatchResult,
  type PrepareAgentHandoffInput,
  type PrepareAgentHandoffResult,
  type PrepareAgentRegenerationInput,
  type PrepareAgentRegenerationResult,
  type PromoteSkillToGlobalInput,
  type PromoteSkillToGlobalResult,
  type ProposeSkillUpdateInput,
  type RecordAgentDispatchFailureInput,
  type RecordAgentDispatchSuccessInput,
  type RecordAgentTaskResultInput,
  type RegisterWorkspaceAliasInput,
  type RegisterWorkspaceAliasResult,
  type RemoveCatalogEntryResult,
  type RetireAgentInput,
  type RetireAgentResult,
  type SendAgentTaskInput,
  type SendAgentTaskResult,
  type SkillCatalogEntry,
  type SkillContext,
  type SkillFileSyncApplyResult,
  type SkillFileSyncInput,
  type SkillFileSyncPreview,
  type SkillMetadataUpdate,
  type SkillUpdateProposal,
  type SkillUpdateProposalResult,
  type SubagentCatalogEntry,
  type VerificationMetadata,
  type WorkspaceCatalogSyncApplyResult,
  type WorkspaceCatalogSyncInput,
  type WorkspaceCatalogSyncPreview,
  type WorkspaceDiagnosticsInput,
  type WorkspaceDiagnosticsReport,
} from "@src/catalog/types.ts";
import {
  validateAppendAgentContext,
  validateApplySkillFileSync,
  validateApplySkillUpdate,
  validateApplyWorkspaceCatalogSync,
  validateCatalogEntryUpdate,
  validateCatalogExportFilter,
  validateCatalogHealthFilter,
  validateCatalogImportInput,
  validateEntryLookup,
  validateGetAgentTaskResult,
  validateGetAgentTaskStatus,
  validateIntroduceAgent,
  validateIntroduceSkill,
  validateIntroduceSubagent,
  validateListActiveTasks,
  validatePrepareAgentHandoff,
  validatePrepareAgentRegeneration,
  validatePromoteSkillToGlobal,
  validateProposeSkillUpdate,
  validateRecordAgentTaskResult,
  validateRegisterWorkspaceAlias,
  validateRetireAgent,
  validateSendAgentTask,
  validateSkillFileSyncInput,
  validateWorkspace,
  validateWorkspaceCatalogSyncInput,
  validateWorkspaceDiagnosticsInput,
} from "@src/catalog/validation.ts";
import { findCatalogMatches } from "@src/catalog/matcher.ts";
import { LorError } from "@src/errors.ts";
import { LocalSkillSync } from "@src/skills/local_skill_sync.ts";
import { generateAgentPrompt } from "@src/agent_prompts/generator.ts";

interface CatalogServiceOptions {
  repository: CatalogRepository;
  skillRoots?: readonly string[];
  now?: () => string;
  dispatchAgentTask?: AgentTaskDispatcher;
}

interface WorkspaceCatalogSyncPlan {
  preview: WorkspaceCatalogSyncPreview;
}

export class CatalogService {
  readonly #repository: CatalogRepository;
  readonly #localSkillSync: LocalSkillSync;
  readonly #now: () => string;
  readonly #dispatchAgentTask: AgentTaskDispatcher | undefined;

  constructor(options: CatalogServiceOptions) {
    this.#repository = options.repository;
    this.#localSkillSync = new LocalSkillSync({
      skillRoots: options.skillRoots ?? [],
    });
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#dispatchAgentTask = options.dispatchAgentTask;
  }

  async introduceAgent(
    input: IntroduceAgentInput,
  ): Promise<CatalogEntry> {
    const validated = validateIntroduceAgent(input);
    const now = this.#now();
    const workspace = await this.resolveWorkspace(validated.workspace, now);
    return await this.#repository.createAgent(workspace, {
      ...validated,
      workspace,
      verification: introductionVerification(now),
      now,
    });
  }

  async introduceSkill(
    input: IntroduceSkillInput,
  ): Promise<CatalogEntry> {
    const validated = validateIntroduceSkill(input);
    const now = this.#now();
    const workspace = await this.resolveWorkspace(validated.workspace, now);
    return await this.#repository.createSkill(workspace, {
      ...validated,
      workspace,
      scope: validated.scope ?? "workspace",
      verification: introductionVerification(now),
      now,
    });
  }

  async introduceSubagent(
    input: IntroduceSubagentInput,
  ): Promise<CatalogEntry> {
    const validated = validateIntroduceSubagent(input);
    const now = this.#now();
    const workspace = await this.resolveWorkspace(validated.workspace, now);
    return await this.#repository.createSubagent(workspace, {
      ...validated,
      workspace,
      scope: validated.scope ?? "workspace",
      verification: introductionVerification(now),
      now,
    });
  }

  async listEntries(
    filter: ListEntriesFilter,
  ): Promise<CatalogEntry[]> {
    const workspace = await this.resolveWorkspace(filter.workspace);
    validateListScope(filter.entryType, filter.scope);
    return await this.#repository.listEntries(workspace, {
      ...filter,
      workspace,
    });
  }

  async clearWorkspaceCatalog(
    input: ClearWorkspaceCatalogInput,
  ): Promise<ClearWorkspaceCatalogResult> {
    const workspace = await this.resolveWorkspace(input.workspace);
    if (input.confirm !== true) {
      throw new LorError(
        "validation_error",
        "confirm must be true.",
        { field: "confirm" },
      );
    }

    return await this.#repository.clearEntries(workspace, {
      ...input,
      workspace,
    });
  }

  async getEntryDetail(
    lookup: EntryLookup,
  ): Promise<CatalogEntry | undefined> {
    const validated = validateEntryLookup(lookup);
    const workspace = await this.resolveWorkspace(validated.workspace);
    if (validated.entryType === "skill" || validated.entryType === "subagent") {
      return await this.resolveScopedEntry(workspace, validated);
    }
    return await this.#repository.getEntry(workspace, {
      ...validated,
      workspace,
    });
  }

  async updateCatalogEntry(
    input: CatalogEntryUpdate,
  ): Promise<CatalogEntry> {
    const validated = validateCatalogEntryUpdate(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const scopedInput = validated.entryType === "skill" ||
        validated.entryType === "subagent"
      ? await this.resolveScopedLookup(workspace, validated)
      : { ...validated, workspace };
    const updated = await this.#repository.updateEntry(workspace, {
      ...scopedInput,
      now: this.#now(),
    });
    if (!updated) {
      throw new LorError(
        "not_found",
        "Catalog entry was not found.",
        { entryType: validated.entryType },
      );
    }
    return updated;
  }

  async promoteSkillToGlobal(
    input: PromoteSkillToGlobalInput,
  ): Promise<PromoteSkillToGlobalResult> {
    const validated = validatePromoteSkillToGlobal(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const source = await this.#repository.getEntry(workspace, {
      workspace,
      entryType: "skill",
      entryKey: validated.skillName,
      scope: "workspace",
    });
    if (!source || source.entryType !== "skill") {
      throw new LorError(
        "not_found",
        "Workspace skill was not found.",
        { entryType: "skill" },
      );
    }

    const now = this.#now();
    const globalSkill = await this.#repository.createSkill(workspace, {
      workspace,
      scope: "global",
      skillName: source.skillName,
      projectName: source.projectName,
      displayName: source.displayName,
      primarySpecialty: source.primarySpecialty,
      specialtyTags: source.specialtyTags,
      skillContext: source.skillContext,
      verification: {
        verificationStatus: source.verificationStatus,
        verificationSource: source.verificationSource,
        verifiedAt: source.verifiedAt,
        verificationMessage: source.verificationMessage,
      },
      now,
    });

    return {
      workspace,
      sourceSkill: source,
      globalSkill,
      promoted: true,
    };
  }

  async retireAgent(
    input: RetireAgentInput,
  ): Promise<RetireAgentResult> {
    const validated = validateRetireAgent(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    if (validated.replacedByAgentEntryKey === validated.agentEntryKey) {
      throw new LorError(
        "validation_error",
        "replacedByAgentEntryKey must reference a different agent.",
        { field: "replacedByAgentEntryKey" },
      );
    }

    let replacedByAgent: AgentCatalogEntry | undefined;
    if (validated.replacedByAgentEntryKey) {
      const replacement = await this.#repository.getEntry(workspace, {
        workspace,
        entryType: "agent",
        entryKey: validated.replacedByAgentEntryKey,
      });
      if (!replacement || replacement.entryType !== "agent") {
        throw new LorError(
          "not_found",
          "Replacement agent was not found.",
          { entryType: "agent" },
        );
      }
      replacedByAgent = replacement;
    }

    const now = this.#now();
    const agent = await this.#repository.retireAgent(workspace, {
      ...validated,
      workspace,
      now,
    });
    if (!agent) {
      throw new LorError(
        "not_found",
        "Agent was not found.",
        { entryType: "agent" },
      );
    }

    return {
      workspace,
      agent,
      retiredAt: agent.retiredAt ?? now,
      replacedByAgent: replacedByAgent
        ? toHandoffTargetAgent(replacedByAgent)
        : undefined,
    };
  }

  async recordAgentDispatchSuccess(
    input: RecordAgentDispatchSuccessInput,
  ): Promise<AgentCatalogEntry> {
    const workspace = await this.resolveWorkspace(input.workspace);
    const agent = await this.#repository.updateAgentReachability(
      workspace,
      input.agentEntryKey.trim(),
      {
        reachability: {
          reachabilityStatus: "reachable",
          dispatchMode: "codex_thread",
          lastReachabilityCheckAt: input.dispatchedAt,
          lastDispatchAt: input.dispatchedAt,
        },
        updatedAt: input.dispatchedAt,
      },
    );
    if (!agent) {
      throw new LorError(
        "not_found",
        "Agent was not found.",
        { entryType: "agent" },
      );
    }
    return agent;
  }

  async recordAgentDispatchFailure(
    input: RecordAgentDispatchFailureInput,
  ): Promise<AgentCatalogEntry> {
    const workspace = await this.resolveWorkspace(input.workspace);
    const agent = await this.#repository.updateAgentReachability(
      workspace,
      input.agentEntryKey.trim(),
      {
        reachability: {
          reachabilityStatus: "unreachable",
          dispatchMode: "codex_thread",
          lastReachabilityCheckAt: input.checkedAt,
          lastReachabilityError: sanitizeReachabilityError(input.error),
        },
        updatedAt: input.checkedAt,
      },
    );
    if (!agent) {
      throw new LorError(
        "not_found",
        "Agent was not found.",
        { entryType: "agent" },
      );
    }
    return agent;
  }

  async sendAgentTask(
    input: SendAgentTaskInput,
  ): Promise<SendAgentTaskResult> {
    const validated = validateSendAgentTask(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const entry = await this.#repository.getEntry(workspace, {
      workspace,
      entryType: "agent",
      entryKey: validated.agentEntryKey,
    });
    if (!entry || entry.entryType !== "agent") {
      throw new LorError(
        "not_found",
        "Target agent was not found.",
        { entryType: "agent" },
      );
    }
    assertDispatchableAgent(entry);

    const now = this.#now();
    const prompt = entry.handoff
      ? renderHandoffTemplate(entry, validated)
      : renderGenericHandoffPrompt(entry, validated);
    const created = await this.#repository.createDelegatedAgentTask({
      taskId: crypto.randomUUID(),
      workspace,
      agentEntryKey: entry.entryKey,
      codexSessionId: entry.codexSessionId,
      status: "queued",
      task: validated.task,
      context: validated.context,
      createdAt: now,
      updatedAt: now,
    });

    if (!this.#dispatchAgentTask) {
      return {
        workspace,
        targetAgent: toHandoffTargetAgent(entry),
        task: created,
        prompt,
        dispatch: {
          mode: "manual",
          instruction:
            "Send the returned prompt through Codex-native thread tools, then check this LOR task later by taskId.",
        },
      };
    }

    try {
      const outcome = await this.#dispatchAgentTask({
        workspace,
        taskId: created.taskId,
        agentEntryKey: entry.entryKey,
        codexSessionId: entry.codexSessionId,
        prompt,
      });

      if (outcome.status === "failed") {
        const failedAt = outcome.failedAt ?? this.#now();
        const failureMessage = sanitizeReachabilityError(
          outcome.failureMessage,
        );
        const failed = await this.#repository.updateDelegatedAgentTask(
          workspace,
          created.taskId,
          {
            status: "failed",
            updatedAt: failedAt,
            completedAt: failedAt,
            failureMessage,
          },
        );
        await this.recordAgentDispatchFailure({
          workspace,
          agentEntryKey: entry.entryKey,
          error: failureMessage,
          checkedAt: failedAt,
        });
        return {
          workspace,
          targetAgent: toHandoffTargetAgent(entry),
          task: failed ?? created,
          prompt,
          dispatch: {
            mode: "failed",
            failureMessage,
          },
        };
      }

      const sentAt = outcome.sentAt ?? this.#now();
      const sent = await this.#repository.updateDelegatedAgentTask(
        workspace,
        created.taskId,
        {
          status: outcome.status,
          updatedAt: sentAt,
          sentAt,
          externalTaskId: outcome.externalTaskId,
        },
      );
      await this.recordAgentDispatchSuccess({
        workspace,
        agentEntryKey: entry.entryKey,
        dispatchedAt: sentAt,
      });
      return {
        workspace,
        targetAgent: toHandoffTargetAgent(entry),
        task: sent ?? created,
        prompt,
        dispatch: {
          mode: "codex_native",
          externalTaskId: outcome.externalTaskId,
        },
      };
    } catch (error) {
      const failedAt = this.#now();
      const failureMessage = sanitizeReachabilityError(
        error instanceof Error ? error.message : "Dispatch failed.",
      );
      const failed = await this.#repository.updateDelegatedAgentTask(
        workspace,
        created.taskId,
        {
          status: "failed",
          updatedAt: failedAt,
          completedAt: failedAt,
          failureMessage,
        },
      );
      await this.recordAgentDispatchFailure({
        workspace,
        agentEntryKey: entry.entryKey,
        error: failureMessage,
        checkedAt: failedAt,
      });
      return {
        workspace,
        targetAgent: toHandoffTargetAgent(entry),
        task: failed ?? created,
        prompt,
        dispatch: {
          mode: "failed",
          failureMessage,
        },
      };
    }
  }

  async getAgentTaskStatus(
    input: GetAgentTaskStatusInput,
  ): Promise<DelegatedAgentTask | undefined> {
    const validated = validateGetAgentTaskStatus(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    return await this.#repository.getDelegatedAgentTask(
      workspace,
      validated.taskId,
    );
  }

  async listActiveTasks(
    input: ListActiveTasksInput,
  ): Promise<ListActiveTasksResult> {
    const validated = validateListActiveTasks(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const tasks = await this.#repository.listActiveDelegatedAgentTasks(
      workspace,
      { agentEntryKey: validated.agentEntryKey },
    );
    return { workspace, tasks };
  }

  async appendAgentContext(
    input: AppendAgentContextInput,
  ): Promise<AppendAgentContextResult> {
    const validated = validateAppendAgentContext(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const task = await this.#repository.getDelegatedAgentTask(
      workspace,
      validated.taskId,
    );
    if (!task) {
      throw new LorError(
        "not_found",
        "Delegated agent task was not found.",
      );
    }
    if (isClosedTaskStatus(task.status)) {
      throw new LorError(
        "validation_error",
        "Delegated agent task is closed.",
        { taskId: task.taskId, status: task.status },
      );
    }

    const message = await this.#repository.createDelegatedTaskMessage({
      messageId: crypto.randomUUID(),
      taskId: task.taskId,
      workspace,
      direction: "caller_to_agent",
      message: validated.message,
      createdAt: this.#now(),
    });

    return {
      workspace,
      task,
      message,
      delivery: {
        mode: "manual",
        instruction:
          "Forward this follow-up through Codex-native thread tools when available.",
      },
    };
  }

  async getAgentTaskResult(
    input: GetAgentTaskResultInput,
  ): Promise<AgentTaskResult> {
    const validated = validateGetAgentTaskResult(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const result = await this.#repository.getDelegatedAgentTaskResult(
      workspace,
      validated.taskId,
    );
    if (!result) {
      throw new LorError(
        "not_found",
        "Delegated agent task was not found.",
      );
    }
    return result;
  }

  async recordAgentTaskResult(
    input: RecordAgentTaskResultInput,
  ): Promise<AgentTaskResult> {
    const validated = validateRecordAgentTaskResult(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const result = await this.#repository.recordDelegatedAgentTaskResult(
      workspace,
      {
        taskId: validated.taskId,
        summary: validated.summary,
        result: validated.result,
        completedAt: validated.completedAt,
      },
    );
    if (!result) {
      throw new LorError(
        "not_found",
        "Delegated agent task was not found.",
      );
    }
    return result;
  }

  async proposeSkillUpdate(
    input: ProposeSkillUpdateInput,
  ): Promise<SkillUpdateProposalResult> {
    const validated = validateProposeSkillUpdate(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const scopedLookup = await this.resolveScopedLookup(workspace, {
      workspace,
      entryType: "skill",
      entryKey: validated.skillName,
      scope: validated.scope,
    });
    const existing = await this.#repository.getEntry(workspace, scopedLookup);
    if (!existing || existing.entryType !== "skill") {
      throw new LorError(
        "not_found",
        "Skill was not found.",
        { entryType: "skill" },
      );
    }

    const now = this.#now();
    const after = mergeSkillUpdate(existing, {
      skillContext: validated.skillContext,
      metadata: validated.metadata,
      updatedAt: now,
    });
    const proposal: SkillUpdateProposal = {
      proposalId: crypto.randomUUID(),
      workspace,
      scope: scopedLookup.scope ?? "workspace",
      skillName: validated.skillName,
      reason: validated.reason,
      proposedSkillContext: validated.skillContext,
      proposedMetadata: validated.metadata,
      status: "pending",
      createdAt: now,
    };

    const created = await this.#repository.createSkillUpdateProposal(proposal);
    return { proposal: created, before: existing, after };
  }

  async applySkillUpdate(
    input: ApplySkillUpdateInput,
  ): Promise<SkillUpdateProposalResult> {
    const validated = validateApplySkillUpdate(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const proposal = await this.#repository.getSkillUpdateProposal(
      workspace,
      validated.proposalId,
      validated.scope,
    );
    if (!proposal) {
      throw new LorError(
        "not_found",
        "Skill update proposal was not found.",
      );
    }
    if (proposal.status !== "pending") {
      throw new LorError(
        "validation_error",
        "Skill update proposal has already been applied.",
        { field: "proposalId" },
      );
    }

    const existing = await this.#repository.getEntry(workspace, {
      workspace,
      entryType: "skill",
      entryKey: proposal.skillName,
      scope: proposal.scope,
    });
    if (!existing || existing.entryType !== "skill") {
      throw new LorError(
        "not_found",
        "Skill was not found.",
        { entryType: "skill" },
      );
    }

    const appliedAt = this.#now();
    const after = mergeSkillUpdate(existing, {
      skillContext: proposal.proposedSkillContext,
      metadata: proposal.proposedMetadata,
      updatedAt: appliedAt,
    });
    const applied = await this.#repository.applySkillUpdateProposal(
      workspace,
      proposal.proposalId,
      proposal.scope,
      { entry: after, appliedAt },
    );
    if (!applied) {
      throw new LorError(
        "validation_error",
        "Skill update proposal has already been applied.",
        { field: "proposalId" },
      );
    }

    return { proposal: applied, before: existing, after };
  }

  async previewSkillFileSync(
    input: SkillFileSyncInput,
  ): Promise<SkillFileSyncPreview> {
    const validated = validateSkillFileSyncInput(input);
    const { workspace, proposal, entry } = await this.resolveSkillSyncSource(
      validated,
    );
    const preview = await this.#localSkillSync.preview(entry);

    return {
      workspace,
      skillName: proposal.skillName,
      proposalId: proposal.proposalId,
      targetFile: preview.targetFile,
      sectionName: preview.sectionName,
      sectionExists: preview.sectionExists,
      wouldChange: preview.wouldChange,
      renderedSection: preview.renderedSection,
    };
  }

  async applySkillFileSync(
    input: ApplySkillFileSyncInput,
  ): Promise<SkillFileSyncApplyResult> {
    const validated = validateApplySkillFileSync(input);
    const { workspace, proposal, entry } = await this.resolveSkillSyncSource(
      validated,
    );
    const result = await this.#localSkillSync.apply(entry);

    return {
      workspace,
      skillName: proposal.skillName,
      proposalId: proposal.proposalId,
      targetFile: result.targetFile,
      sectionName: result.sectionName,
      sectionExists: result.sectionExists,
      wouldChange: result.wouldChange,
      renderedSection: result.renderedSection,
      written: result.written,
    };
  }

  async removeCatalogEntry(
    lookup: EntryLookup,
  ): Promise<RemoveCatalogEntryResult> {
    const validated = validateEntryLookup(lookup);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const scopedLookup = validated.entryType === "skill" ||
        validated.entryType === "subagent"
      ? await this.resolveScopedLookup(workspace, validated)
      : { ...validated, workspace };
    const removed = await this.#repository.removeEntry(
      workspace,
      scopedLookup,
    );
    if (!removed) {
      throw new LorError(
        "not_found",
        "Catalog entry was not found.",
        { entryType: validated.entryType },
      );
    }
    return { ...scopedLookup, removed: true };
  }

  async exportCatalog(
    filter: CatalogExportFilter,
  ): Promise<CatalogExport> {
    const validated = validateCatalogExportFilter(filter);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const entries = await this.#repository.listEntries(workspace, {
      workspace,
      entryType: validated.entryType,
      projectName: validated.projectName,
      scope: "workspace",
    });

    return {
      version: 1,
      exportedAt: this.#now(),
      workspace,
      filters: {
        entryType: validated.entryType,
        projectName: validated.projectName,
      },
      entries: entries.map(toExportEntry),
    };
  }

  async importCatalog(
    input: CatalogImportInput,
  ): Promise<CatalogImportResult> {
    const validated = validateCatalogImportInput(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const resolvedInput = { ...validated, workspace };
    const duplicateIssues = await this.findImportConflicts(resolvedInput);
    if (validated.conflictStrategy === "fail" && duplicateIssues.length > 0) {
      return {
        workspace,
        version: validated.catalog.version,
        conflictStrategy: validated.conflictStrategy,
        importedCount: 0,
        skippedCount: 0,
        failedCount: duplicateIssues.length,
        errors: duplicateIssues,
      };
    }

    let importedCount = 0;
    let skippedCount = 0;
    const now = this.#now();
    for (let index = 0; index < resolvedInput.catalog.entries.length; index++) {
      const entry = resolvedInput.catalog.entries[index];
      const entryKey = exportEntryKey(entry);
      const existing = await this.#repository.getEntry(workspace, {
        workspace,
        entryType: entry.entryType,
        entryKey,
        scope: "workspace",
      });
      if (existing) {
        skippedCount++;
        continue;
      }

      if (entry.entryType === "agent") {
        await this.#repository.createAgent(workspace, {
          workspace,
          codexSessionId: entry.codexSessionId,
          projectName: entry.projectName,
          displayName: entry.displayName,
          primarySpecialty: entry.primarySpecialty,
          specialtyTags: entry.specialtyTags,
          replacesAgentEntryKey: entry.replacesAgentEntryKey,
          handoff: entry.handoff,
          verification: {
            verificationStatus: entry.verificationStatus,
            verificationSource: entry.verificationSource,
            verifiedAt: entry.verifiedAt,
            verificationMessage: entry.verificationMessage,
          },
          now,
          agentStatus: entry.agentStatus ?? "active",
          retiredAt: entry.retiredAt,
          retirementReason: entry.retirementReason,
          replacedByAgentEntryKey: entry.replacedByAgentEntryKey,
        });
      } else if (entry.entryType === "skill") {
        await this.#repository.createSkill(workspace, {
          workspace,
          scope: "workspace",
          skillName: entry.skillName,
          projectName: entry.projectName,
          displayName: entry.displayName,
          primarySpecialty: entry.primarySpecialty,
          specialtyTags: entry.specialtyTags,
          skillContext: entry.skillContext,
          verification: {
            verificationStatus: entry.verificationStatus,
            verificationSource: entry.verificationSource,
            verifiedAt: entry.verifiedAt,
            verificationMessage: entry.verificationMessage,
          },
          now,
        });
      } else {
        await this.#repository.createSubagent(workspace, {
          workspace,
          scope: "workspace",
          name: entry.name,
          projectName: entry.projectName,
          displayName: entry.displayName,
          purpose: entry.purpose,
          limitedScope: entry.limitedScope,
          primarySpecialty: entry.primarySpecialty,
          specialtyTags: entry.specialtyTags,
          agentReferences: entry.agentReferences,
          skillReferences: entry.skillReferences,
          unresolvedReferences: entry.unresolvedReferences,
          promptTemplate: entry.promptTemplate,
          constraints: entry.constraints,
          expectedOutput: entry.expectedOutput,
          verification: {
            verificationStatus: entry.verificationStatus,
            verificationSource: entry.verificationSource,
            verifiedAt: entry.verifiedAt,
            verificationMessage: entry.verificationMessage,
          },
          now,
        });
      }
      importedCount++;
    }

    return {
      workspace,
      version: validated.catalog.version,
      conflictStrategy: validated.conflictStrategy,
      importedCount,
      skippedCount,
      failedCount: 0,
      errors: [],
    };
  }

  async previewWorkspaceCatalogSync(
    input: WorkspaceCatalogSyncInput,
  ): Promise<WorkspaceCatalogSyncPreview> {
    const validated = validateWorkspaceCatalogSyncInput(input);
    return (await this.buildWorkspaceCatalogSyncPlan(validated)).preview;
  }

  async applyWorkspaceCatalogSync(
    input: ApplyWorkspaceCatalogSyncInput,
  ): Promise<WorkspaceCatalogSyncApplyResult> {
    const validated = validateApplyWorkspaceCatalogSync(input);
    const { preview } = await this.buildWorkspaceCatalogSyncPlan(validated);
    const importResult = await this.importCatalog({
      workspace: preview.targetWorkspace,
      conflictStrategy: "skip",
      catalog: {
        version: 1,
        exportedAt: this.#now(),
        workspace: preview.sourceWorkspace,
        filters: {
          projectName: preview.projectName,
        },
        entries: [...preview.skillsToCopy, ...preview.subagentsToCopy],
      },
    });

    const copiedSkills = preview.skillsToCopy.filter((entry) =>
      !importResult.errors.some((issue) =>
        issue.entryType === "skill" && issue.entryKey === entry.skillName
      )
    ).slice(0, importResult.importedCount).map((entry) => entry.skillName);
    const copiedSubagents = preview.subagentsToCopy.filter((entry) =>
      !importResult.errors.some((issue) =>
        issue.entryType === "subagent" && issue.entryKey === entry.name
      )
    ).slice(0, Math.max(0, importResult.importedCount - copiedSkills.length))
      .map((entry) => entry.name);

    return {
      ...preview,
      summary: {
        ...preview.summary,
        copiedSkills: copiedSkills.length,
        copiedSubagents: copiedSubagents.length,
      },
      copiedSkills,
      copiedSubagents,
      importResult,
    };
  }

  async checkCatalogHealth(
    filter: CatalogHealthFilter,
  ): Promise<CatalogHealthReport> {
    const validated = validateCatalogHealthFilter(filter);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const entries = await this.#repository.listEntries(workspace, {
      workspace,
      entryType: validated.entryType,
      projectName: validated.projectName,
      scope: validated.scope,
    });
    const filteredEntries = validated.entryKey
      ? entries.filter((entry) => entry.entryKey === validated.entryKey)
      : entries;
    const healthEntries = filteredEntries.filter(isHealthEntry).map(
      toHealthEntry,
    );

    return {
      checkedAt: this.#now(),
      workspace,
      filters: {
        entryType: validated.entryType === "subagent"
          ? undefined
          : validated.entryType,
        projectName: validated.projectName,
        scope: validated.scope,
        entryKey: validated.entryKey,
      },
      summary: summarizeHealth(healthEntries),
      entries: healthEntries,
    };
  }

  async getWorkspaceDiagnostics(
    input: WorkspaceDiagnosticsInput,
  ): Promise<WorkspaceDiagnosticsReport> {
    const validated = validateWorkspaceDiagnosticsInput(input);
    const checkedAt = this.#now();
    try {
      const workspace = await this.resolveWorkspace(validated.workspace);
      const [entries, aliases, schemaVersion] = await Promise.all([
        this.#repository.listEntries(workspace, { workspace }),
        this.#repository.listWorkspaceAliases(workspace),
        this.#repository.getSchemaVersion(),
      ]);

      return {
        inputWorkspace: validated.workspace,
        resolvedWorkspace: workspace,
        aliases,
        catalogCounts: countCatalogEntries(entries),
        storageStatus: {
          configured: true,
          reachable: true,
          schemaVersion,
        },
        runtimeStatus: {
          transport: "mcp",
        },
        checkedAt,
      };
    } catch {
      return {
        inputWorkspace: validated.workspace,
        resolvedWorkspace: validated.workspace,
        aliases: [],
        catalogCounts: emptyCatalogCounts(),
        storageStatus: {
          configured: true,
          reachable: false,
          message: "Catalog storage is not reachable.",
        },
        runtimeStatus: {
          transport: "mcp",
        },
        checkedAt,
      };
    }
  }

  async prepareAgentHandoff(
    input: PrepareAgentHandoffInput,
  ): Promise<PrepareAgentHandoffResult> {
    const validated = validatePrepareAgentHandoff(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const entry = await this.#repository.getEntry(workspace, {
      workspace,
      entryType: "agent",
      entryKey: validated.agentEntryKey,
    });
    if (!entry) {
      throw new LorError(
        "not_found",
        "Target agent was not found.",
        { entryType: "agent" },
      );
    }
    if (entry.entryType !== "agent") {
      throw new LorError(
        "not_found",
        "Target agent was not found.",
        { entryType: "agent" },
      );
    }
    if (entry.agentStatus === "retired") {
      throw new LorError(
        "validation_error",
        "Target agent is retired.",
        { entryType: "agent", entryKey: entry.entryKey },
      );
    }
    if (entry.reachability.reachabilityStatus === "unreachable") {
      throw new LorError(
        "validation_error",
        "Target agent is known unreachable.",
        { entryType: "agent", entryKey: entry.entryKey },
      );
    }

    const prompt = entry.handoff
      ? renderHandoffTemplate(entry, validated)
      : renderGenericHandoffPrompt(entry, validated);

    return {
      workspace,
      targetAgent: {
        entryKey: entry.entryKey,
        codexSessionId: entry.codexSessionId,
        displayName: entry.displayName,
        projectName: entry.projectName,
        primarySpecialty: entry.primarySpecialty,
        specialtyTags: entry.specialtyTags,
        reachability: entry.reachability,
      },
      prompt,
      usedStoredHandoff: Boolean(entry.handoff),
      handoff: entry.handoff,
      missingContext: entry.handoff ? [...entry.handoff.requiredContext] : [],
      delivery: {
        mode: "manual",
        instruction:
          "Send this prompt through the available Codex workflow; Local Orchestration Router (LOR) does not dispatch it.",
      },
    };
  }

  async prepareAgentRegeneration(
    input: PrepareAgentRegenerationInput,
  ): Promise<PrepareAgentRegenerationResult> {
    const validated = validatePrepareAgentRegeneration(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const entry = await this.#repository.getEntry(workspace, {
      workspace,
      entryType: "agent",
      entryKey: validated.agentEntryKey,
    });
    if (!entry || entry.entryType !== "agent") {
      throw new LorError(
        "not_found",
        "Source agent was not found.",
        { entryType: "agent" },
      );
    }

    const suggestedReplacementMetadata = {
      projectName: entry.projectName,
      displayName: entry.displayName,
      primarySpecialty: entry.primarySpecialty,
      specialtyTags: entry.specialtyTags,
      replacesAgentEntryKey: entry.entryKey,
      handoff: entry.handoff,
    };

    return {
      workspace,
      sourceAgent: {
        entryKey: entry.entryKey,
        codexSessionId: entry.codexSessionId,
        displayName: entry.displayName,
        projectName: entry.projectName,
        primarySpecialty: entry.primarySpecialty,
        specialtyTags: entry.specialtyTags,
        reachability: entry.reachability,
        handoff: entry.handoff,
      },
      prompt: renderAgentRegenerationPrompt(entry, validated),
      suggestedReplacementMetadata,
      replacementInstructions: replacementInstructions(
        entry,
        validated.includeRegistrationInstructions,
      ),
      catalogAction: {
        mode: "manual",
        instruction:
          `After confirming the replacement works, introduce the replacement agent, then call retire_agent for old catalog entry ${entry.entryKey}; LOR will not mutate the catalog from this preparation step.`,
      },
      delivery: {
        mode: "manual",
        instruction:
          "Paste this prompt into a new empty Codex chat. Local Orchestration Router (LOR) does not create, message, or steer Codex chats.",
      },
    };
  }

  async findMatchingEntries(
    request: MatchRequest,
  ): Promise<MatchResult> {
    const workspace = await this.resolveWorkspace(request.workspace);
    if (!request.task?.trim()) {
      throw new LorError("validation_error", "task is required.", {
        field: "task",
      });
    }

    const entries = await this.#repository.listEntries(workspace, {
      workspace,
    });
    return findCatalogMatches(entries.filter(isRoutableEntry), {
      ...request,
      workspace,
    });
  }

  async registerWorkspaceAlias(
    input: RegisterWorkspaceAliasInput,
  ): Promise<RegisterWorkspaceAliasResult> {
    const validated = validateRegisterWorkspaceAlias(input);
    return await this.#repository.registerWorkspaceAlias({
      ...validated,
      now: this.#now(),
    });
  }

  private async resolveWorkspace(
    workspace: string,
    now = this.#now(),
  ): Promise<string> {
    return await this.#repository.resolveWorkspace(
      validateWorkspace(workspace),
      { now },
    );
  }

  private async resolveSkillSyncSource(
    input: SkillFileSyncInput,
  ): Promise<{
    workspace: string;
    proposal: SkillUpdateProposal;
    entry: SkillCatalogEntry;
  }> {
    const workspace = await this.resolveWorkspace(input.workspace);
    const proposal = await this.#repository.getSkillUpdateProposal(
      workspace,
      input.proposalId,
      input.scope,
    );
    if (!proposal) {
      throw new LorError(
        "not_found",
        "Skill update proposal was not found.",
      );
    }
    if (proposal.skillName !== input.skillName) {
      throw new LorError(
        "validation_error",
        "proposalId does not belong to the requested skill.",
        { field: "proposalId" },
      );
    }
    if (proposal.status !== "applied") {
      throw new LorError(
        "validation_error",
        "Skill update proposal must be applied before local skill sync.",
        { field: "proposalId" },
      );
    }

    const entry = await this.#repository.getEntry(workspace, {
      workspace,
      entryType: "skill",
      entryKey: input.skillName,
      scope: proposal.scope,
    });
    if (!entry || entry.entryType !== "skill") {
      throw new LorError(
        "not_found",
        "Skill was not found.",
        { entryType: "skill" },
      );
    }

    return { workspace, proposal, entry };
  }

  private async resolveScopedEntry(
    workspace: string,
    lookup: EntryLookup,
  ): Promise<CatalogEntry | undefined> {
    const scopedLookup = await this.resolveScopedLookup(workspace, lookup);
    return await this.#repository.getEntry(workspace, scopedLookup);
  }

  private async resolveScopedLookup(
    workspace: string,
    lookup: EntryLookup,
  ): Promise<EntryLookup> {
    if (lookup.entryType !== "skill" && lookup.entryType !== "subagent") {
      return { ...lookup, workspace };
    }
    if (lookup.scope) {
      return { ...lookup, workspace };
    }

    const workspaceLookup = {
      ...lookup,
      workspace,
      scope: "workspace" as const,
    };
    const globalLookup = {
      ...lookup,
      workspace,
      scope: "global" as const,
    };
    const [workspaceEntry, globalEntry] = await Promise.all([
      this.#repository.getEntry(workspace, workspaceLookup),
      this.#repository.getEntry(workspace, globalLookup),
    ]);
    if (workspaceEntry && globalEntry) {
      throw new LorError(
        "validation_error",
        `scope is required when workspace and global ${lookup.entryType}s share the same entryKey.`,
        {
          field: "scope",
          entryType: lookup.entryType,
          entryKey: lookup.entryKey,
          allowedScopes: ["workspace", "global"],
        },
      );
    }
    return globalEntry ? globalLookup : workspaceLookup;
  }

  private async buildWorkspaceCatalogSyncPlan(
    input: WorkspaceCatalogSyncInput,
  ): Promise<WorkspaceCatalogSyncPlan> {
    const now = this.#now();
    const sourceWorkspace = await this.resolveWorkspace(
      input.sourceWorkspace,
      now,
    );
    const targetWorkspace = await this.resolveWorkspace(
      input.targetWorkspace,
      now,
    );
    if (sourceWorkspace === targetWorkspace) {
      throw new LorError(
        "validation_error",
        "sourceWorkspace and targetWorkspace must resolve to different workspaces.",
        { field: "targetWorkspace" },
      );
    }

    const sourceEntries = await this.#repository.listEntries(sourceWorkspace, {
      workspace: sourceWorkspace,
      projectName: input.projectName,
      scope: "workspace",
    });
    const targetEntries = await this.#repository.listEntries(targetWorkspace, {
      workspace: targetWorkspace,
      scope: "workspace",
    });
    const targetSkillNames = new Set(
      targetEntries
        .filter((entry): entry is SkillCatalogEntry =>
          entry.entryType === "skill"
        )
        .map((entry) => entry.skillName),
    );
    const sourceSkills = sourceEntries.filter((
      entry,
    ): entry is SkillCatalogEntry => entry.entryType === "skill");
    const sourceSubagents = sourceEntries.filter((
      entry,
    ): entry is SubagentCatalogEntry => entry.entryType === "subagent");
    const selectedSkills = selectSyncSkills(sourceSkills, input.skillNames);
    const selectedSubagents = selectSyncSubagents(
      sourceSubagents,
      input.subagentNames,
    );
    const sourceSkillNames = new Set(
      sourceSkills.map((entry) => entry.skillName),
    );
    const targetSubagentNames = new Set(
      targetEntries
        .filter((entry): entry is SubagentCatalogEntry =>
          entry.entryType === "subagent"
        )
        .map((entry) => entry.name),
    );
    const sourceSubagentNames = new Set(
      sourceSubagents.map((entry) => entry.name),
    );
    const missingSkills = (input.skillNames ?? []).filter((skillName) =>
      !sourceSkillNames.has(skillName)
    );
    const missingSubagents = (input.subagentNames ?? []).filter((name) =>
      !sourceSubagentNames.has(name)
    );
    const duplicateSkills = selectedSkills
      .filter((entry) => targetSkillNames.has(entry.skillName))
      .map((entry) => entry.skillName);
    const duplicateSubagents = selectedSubagents
      .filter((entry) => targetSubagentNames.has(entry.name))
      .map((entry) => entry.name);
    const skillsToCopy = selectedSkills
      .filter((entry) => !targetSkillNames.has(entry.skillName))
      .map(toExportSkillEntry);
    const subagentsToCopy = selectedSubagents
      .filter((entry) => !targetSubagentNames.has(entry.name))
      .map(toExportSubagentEntry);
    const generatedAgentPrompts = (input.agentPromptRoles ?? []).map((role) =>
      generateAgentPrompt({
        workspace: targetWorkspace,
        role,
        projectName: input.projectName,
      })
    );

    const preview: WorkspaceCatalogSyncPreview = {
      sourceWorkspace,
      targetWorkspace,
      projectName: input.projectName,
      requestedSkillNames: input.skillNames,
      requestedSubagentNames: input.subagentNames,
      requestedAgentPromptRoles: input.agentPromptRoles,
      skillsToCopy,
      subagentsToCopy,
      duplicateSkills,
      duplicateSubagents,
      missingSkills,
      missingSubagents,
      generatedAgentPrompts,
      summary: {
        selectedSkills: selectedSkills.length,
        skillsToCopy: skillsToCopy.length,
        duplicateSkills: duplicateSkills.length,
        missingSkills: missingSkills.length,
        selectedSubagents: selectedSubagents.length,
        subagentsToCopy: subagentsToCopy.length,
        duplicateSubagents: duplicateSubagents.length,
        missingSubagents: missingSubagents.length,
        generatedAgentPrompts: generatedAgentPrompts.length,
      },
    };

    return { preview };
  }

  private async findImportConflicts(
    input: CatalogImportInput & {
      conflictStrategy: "skip" | "fail";
    },
  ): Promise<CatalogImportIssue[]> {
    const issues: CatalogImportIssue[] = [];
    const seen = new Set<string>();
    for (let index = 0; index < input.catalog.entries.length; index++) {
      const entry = input.catalog.entries[index];
      const entryKey = exportEntryKey(entry);
      const duplicateKey = `${entry.entryType}:${entryKey}`;
      if (seen.has(duplicateKey)) {
        issues.push({
          index,
          entryType: entry.entryType,
          entryKey,
          code: "duplicate_import_entry",
          message: "Catalog import contains duplicate entries.",
        });
        continue;
      }
      seen.add(duplicateKey);

      const existing = await this.#repository.getEntry(input.workspace, {
        workspace: input.workspace,
        entryType: entry.entryType,
        entryKey,
        scope: "workspace",
      });
      if (existing) {
        issues.push({
          index,
          entryType: entry.entryType,
          entryKey,
          code: "duplicate_entry",
          message: "Catalog entry already exists in this workspace.",
        });
      }
    }
    return issues;
  }
}

function introductionVerification(now: string): VerificationMetadata {
  return {
    verificationStatus: "verified",
    verificationSource: "mcp_introduction",
    verifiedAt: now,
  };
}

function toExportEntry(entry: CatalogEntry): CatalogExport["entries"][number] {
  const base = {
    projectName: entry.projectName,
    displayName: entry.displayName,
    primarySpecialty: entry.primarySpecialty,
    specialtyTags: entry.specialtyTags,
    verificationStatus: entry.verificationStatus,
    verificationSource: entry.verificationSource,
    verifiedAt: entry.verifiedAt,
    verificationMessage: entry.verificationMessage,
  };

  if (entry.entryType === "agent") {
    return {
      ...base,
      entryType: "agent",
      codexSessionId: entry.codexSessionId,
      agentStatus: entry.agentStatus,
      retiredAt: entry.retiredAt,
      retirementReason: entry.retirementReason,
      replacedByAgentEntryKey: entry.replacedByAgentEntryKey,
      replacesAgentEntryKey: entry.replacesAgentEntryKey,
      handoff: entry.handoff,
    };
  }

  if (entry.entryType === "skill") {
    return {
      ...base,
      entryType: "skill",
      skillName: entry.skillName,
      skillContext: entry.skillContext,
    };
  }

  return {
    ...base,
    entryType: "subagent",
    name: entry.name,
    purpose: entry.purpose,
    limitedScope: entry.limitedScope,
    agentReferences: entry.agentReferences,
    skillReferences: entry.skillReferences,
    unresolvedReferences: entry.unresolvedReferences,
    promptTemplate: entry.promptTemplate,
    constraints: entry.constraints,
    expectedOutput: entry.expectedOutput,
  };
}

function selectSyncSkills(
  sourceSkills: readonly SkillCatalogEntry[],
  skillNames?: readonly string[],
): SkillCatalogEntry[] {
  if (skillNames === undefined) {
    return [...sourceSkills];
  }

  const sourceBySkillName = new Map(
    sourceSkills.map((entry) => [entry.skillName, entry]),
  );
  return skillNames.flatMap((skillName) => {
    const entry = sourceBySkillName.get(skillName);
    return entry ? [entry] : [];
  });
}

function selectSyncSubagents(
  sourceSubagents: readonly SubagentCatalogEntry[],
  subagentNames?: readonly string[],
): SubagentCatalogEntry[] {
  if (subagentNames === undefined) {
    return [...sourceSubagents];
  }

  const sourceByName = new Map(
    sourceSubagents.map((entry) => [entry.name, entry]),
  );
  return subagentNames.flatMap((name) => {
    const entry = sourceByName.get(name);
    return entry ? [entry] : [];
  });
}

function toExportSkillEntry(entry: SkillCatalogEntry): CatalogExportSkillEntry {
  return toExportEntry(entry) as CatalogExportSkillEntry;
}

function toExportSubagentEntry(
  entry: SubagentCatalogEntry,
): CatalogExportSubagentEntry {
  return toExportEntry(entry) as CatalogExportSubagentEntry;
}

function exportEntryKey(entry: CatalogExport["entries"][number]): string {
  if (entry.entryType === "agent") {
    return entry.codexSessionId;
  }
  if (entry.entryType === "skill") {
    return entry.skillName;
  }
  return entry.name;
}

function toHandoffTargetAgent(entry: AgentCatalogEntry) {
  return {
    entryKey: entry.entryKey,
    codexSessionId: entry.codexSessionId,
    displayName: entry.displayName,
    projectName: entry.projectName,
    primarySpecialty: entry.primarySpecialty,
    specialtyTags: entry.specialtyTags,
    reachability: entry.reachability,
  };
}

function assertDispatchableAgent(entry: AgentCatalogEntry): void {
  if (entry.agentStatus === "retired") {
    throw new LorError(
      "validation_error",
      "Target agent is retired.",
      { entryType: "agent", entryKey: entry.entryKey },
    );
  }
  if (
    entry.reachability.reachabilityStatus === "unreachable" ||
    entry.reachability.reachabilityStatus === "unsupported"
  ) {
    throw new LorError(
      "validation_error",
      "Target agent is not reachable for dispatch.",
      { entryType: "agent", entryKey: entry.entryKey },
    );
  }
}

function isClosedTaskStatus(status: DelegatedAgentTask["status"]): boolean {
  return status === "completed" || status === "failed" ||
    status === "cancelled";
}

function sanitizeReachabilityError(error: string): string {
  const sanitized = error.trim().replace(/(^|\s)\/\S+/g, "$1[path]");
  return sanitized.length > 240 ? `${sanitized.slice(0, 237)}...` : sanitized;
}

function isRoutableEntry(entry: CatalogEntry): boolean {
  return entry.entryType !== "agent" || entry.agentStatus === "active";
}

function isHealthEntry(
  entry: CatalogEntry,
): entry is AgentCatalogEntry | SkillCatalogEntry {
  return entry.entryType === "agent" || entry.entryType === "skill";
}

function mergeSkillUpdate(
  entry: SkillCatalogEntry,
  input: {
    skillContext?: SkillContext;
    metadata?: SkillMetadataUpdate;
    updatedAt: string;
  },
): SkillCatalogEntry {
  return {
    ...entry,
    projectName: input.metadata?.projectName ?? entry.projectName,
    displayName: input.metadata?.displayName ?? entry.displayName,
    primarySpecialty: input.metadata?.primarySpecialty ??
      entry.primarySpecialty,
    specialtyTags: input.metadata?.specialtyTags ?? entry.specialtyTags,
    skillContext: mergeSkillContext(entry.skillContext, input.skillContext),
    updatedAt: input.updatedAt,
  };
}

function mergeSkillContext(
  current: SkillContext | undefined,
  update: SkillContext | undefined,
): SkillContext | undefined {
  if (!update) {
    return current;
  }

  return {
    ...current,
    ...update,
  };
}

function toHealthEntry(
  entry: AgentCatalogEntry | SkillCatalogEntry,
): CatalogHealthEntry {
  return {
    scope: entry.scope,
    entryType: entry.entryType,
    entryKey: entry.entryKey,
    displayName: entry.displayName,
    projectName: entry.projectName,
    primarySpecialty: entry.primarySpecialty,
    specialtyTags: entry.specialtyTags,
    verificationStatus: entry.verificationStatus,
    verificationSource: entry.verificationSource,
    verifiedAt: entry.verifiedAt,
    verificationMessage: entry.verificationMessage,
    issues: verificationIssues(entry),
  };
}

function validateListScope(
  entryType: string | undefined,
  scope: CatalogScope | undefined,
): void {
  if (entryType === "agent" && scope === "global") {
    throw new LorError(
      "validation_error",
      "Agents only support workspace scope.",
      { field: "scope" },
    );
  }
}

function summarizeHealth(
  entries: readonly CatalogHealthEntry[],
): CatalogHealthSummary {
  return {
    total: entries.length,
    verified:
      entries.filter((entry) => entry.verificationStatus === "verified").length,
    unverified:
      entries.filter((entry) => entry.verificationStatus === "unverified")
        .length,
    unknown:
      entries.filter((entry) => entry.verificationStatus === "unknown").length,
    agents: entries.filter((entry) => entry.entryType === "agent").length,
    skills: entries.filter((entry) => entry.entryType === "skill").length,
  };
}

function countCatalogEntries(
  entries: readonly CatalogEntry[],
): {
  total: number;
  agents: number;
  skills: number;
  subagents: number;
} {
  const agents = entries.filter((entry) => entry.entryType === "agent").length;
  const skills = entries.filter((entry) => entry.entryType === "skill").length;
  const subagents = entries.filter((entry) => entry.entryType === "subagent")
    .length;
  return {
    total: agents + skills + subagents,
    agents,
    skills,
    subagents,
  };
}

function emptyCatalogCounts(): {
  total: 0;
  agents: 0;
  skills: 0;
  subagents: 0;
} {
  return {
    total: 0,
    agents: 0,
    skills: 0,
    subagents: 0,
  };
}

function verificationIssues(entry: CatalogEntry): CatalogHealthIssue[] {
  if (entry.verificationStatus === "verified") {
    return [];
  }

  if (entry.verificationStatus === "unverified") {
    return [{
      code: "verification_unverified",
      message: "Stored verification metadata marks this entry as unverified.",
    }];
  }

  return [{
    code: "verification_unknown",
    message: "Stored verification metadata marks this entry as unknown.",
  }];
}

function renderHandoffTemplate(
  entry: AgentCatalogEntry,
  input: PrepareAgentHandoffInput,
): string {
  const replacements: Record<string, string> = {
    task: input.task,
    context: input.context ?? "",
    projectName: entry.projectName,
    agentDisplayName: entry.displayName,
    primarySpecialty: entry.primarySpecialty,
    specialtyTags: entry.specialtyTags.join(", "),
  };
  let prompt = entry.handoff?.handoffPromptTemplate ?? "";
  for (const [key, value] of Object.entries(replacements)) {
    prompt = prompt.replaceAll(`{${key}}`, value);
  }
  return prompt;
}

function renderGenericHandoffPrompt(
  entry: AgentCatalogEntry,
  input: PrepareAgentHandoffInput,
): string {
  const sections = [
    `You are ${entry.displayName}, a Codex agent for ${entry.projectName}.`,
    `Primary specialty: ${entry.primarySpecialty}.`,
    `Specialty tags: ${entry.specialtyTags.join(", ")}.`,
    "",
    "Task:",
    input.task,
  ];

  if (input.context) {
    sections.push("", "Context:", input.context);
  }

  sections.push(
    "",
    "Expected output:",
    "Return a concise result that the requesting agent can use to continue the original task.",
  );

  return sections.join("\n");
}

function renderAgentRegenerationPrompt(
  entry: AgentCatalogEntry,
  input:
    & Required<
      Pick<
        PrepareAgentRegenerationInput,
        "workspace" | "agentEntryKey" | "includeRegistrationInstructions"
      >
    >
    & Omit<
      PrepareAgentRegenerationInput,
      "workspace" | "agentEntryKey" | "includeRegistrationInstructions"
    >,
): string {
  const sections = [
    `You are ${entry.displayName}, a regenerated Codex agent for ${entry.projectName}.`,
    "",
    "Source agent being replaced:",
    `- Catalog entry key: ${entry.entryKey}`,
    `- Previous Codex session ID: ${entry.codexSessionId}`,
    "",
    "Role metadata to preserve:",
    `- Project: ${entry.projectName}`,
    `- Display name: ${entry.displayName}`,
    `- Primary specialty: ${entry.primarySpecialty}`,
    `- Specialty tags: ${entry.specialtyTags.join(", ")}`,
  ];

  if (entry.handoff) {
    sections.push(
      "",
      "Stored handoff guidance to preserve:",
      `- When to use: ${entry.handoff.whenToUse}`,
      `- Expected output: ${entry.handoff.expectedOutput}`,
      `- Required context: ${entry.handoff.requiredContext.join(", ")}`,
      `- Constraints: ${entry.handoff.constraints.join(", ")}`,
      "Stored handoff prompt template:",
      entry.handoff.handoffPromptTemplate,
    );
  }

  if (input.reason) {
    sections.push("", "Regeneration reason:", input.reason);
  }
  if (input.carryForwardContext) {
    sections.push("", "Carry-forward context:", input.carryForwardContext);
  }
  if (input.replacementTask) {
    sections.push("", "First replacement task:", input.replacementTask);
  }

  sections.push(
    "",
    "Operating instructions:",
    "- Read the repository instructions and current files before changing code.",
    "- Preserve user work and never revert unrelated changes.",
    "- Keep changes scoped to the requested task and existing project patterns.",
    "- Report exact files changed and exact verification commands/results.",
    "- Ask only questions that materially affect the plan or implementation.",
  );

  if (input.includeRegistrationInstructions) {
    sections.push(
      "",
      "Registration instructions:",
      "- This is a new Codex chat and will have a new Codex session ID.",
      "- Do not reuse the previous Codex session ID.",
      "- After this chat exists, ask the caller to register the new session with `introduce_agent` using the suggested replacement metadata returned by LOR plus the new `codexSessionId`.",
      "- After confirming the replacement works, ask the caller to mark the old agent retired with `retire_agent`.",
    );
  }

  return sections.join("\n");
}

function replacementInstructions(
  entry: AgentCatalogEntry,
  includeRegistrationInstructions: boolean,
): string[] {
  const instructions = [
    "Create a new empty Codex chat and paste the generated prompt.",
  ];
  if (includeRegistrationInstructions) {
    instructions.push(
      "After the new chat has a Codex session ID, call introduce_agent with the suggested replacement metadata and the new codexSessionId.",
      `Do not reuse the old codexSessionId ${entry.codexSessionId}.`,
    );
  } else {
    instructions.push(
      "Registration instructions were omitted from the generated prompt by request.",
    );
  }
  instructions.push(
    `Only call retire_agent for old catalog entry ${entry.entryKey} after confirming the replacement is usable.`,
  );
  return instructions;
}
