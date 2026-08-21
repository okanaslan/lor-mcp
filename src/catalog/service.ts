import {
  type AgentCatalogEntry,
  type ApplySkillFileSyncInput,
  type ApplySkillUpdateInput,
  type ApplyWorkspaceCatalogSyncInput,
  type CatalogCoverageDimension,
  type CatalogCoverageHealth,
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
  type EntryLookup,
  type EntryType,
  type FindMatchingWorkspaceNoteInput,
  type FindMatchingWorkspaceNoteResult,
  type GetWorkspaceNoteInput,
  type IntroduceAgentInput,
  type IntroduceSkillInput,
  type IntroduceSubagentInput,
  type ListEntriesFilter,
  type ListWorkspaceNotesInput,
  type ListWorkspaceNotesResult,
  type LocalInstructionSource,
  type MatchCandidate,
  type MatchRequest,
  type MatchResult,
  type PrepareAgentInitializationInput,
  type PrepareAgentInitializationResult,
  type PromoteSkillToGlobalInput,
  type PromoteSkillToGlobalResult,
  type ProposeSkillUpdateInput,
  type RecordAgentDispatchFailureInput,
  type RecordAgentDispatchSuccessInput,
  type RegisterWorkspaceAliasInput,
  type RegisterWorkspaceAliasResult,
  type RememberWorkspaceNoteInput,
  type RemoveCatalogEntryResult,
  type RemoveWorkspaceNoteInput,
  type RemoveWorkspaceNoteResult,
  type RetireAgentInput,
  type RetireAgentResult,
  type SkillCatalogEntry,
  type SkillContext,
  type SkillFileSyncApplyResult,
  type SkillFileSyncInput,
  type SkillFileSyncPreview,
  type SkillMetadataUpdate,
  type SkillUpdateProposal,
  type SkillUpdateProposalResult,
  type SubagentCatalogEntry,
  type UsageAnalyticsEntry,
  type UsageAnalyticsFilter,
  type UsageAnalyticsReport,
  type UsageAnalyticsSummary,
  type UsageCounterIncrement,
  type UsageCounterRecord,
  type UsageOperation,
  type VerificationMetadata,
  type WorkspaceCatalogSyncApplyResult,
  type WorkspaceCatalogSyncInput,
  type WorkspaceCatalogSyncPreview,
  type WorkspaceDiagnosticsInput,
  type WorkspaceDiagnosticsLocalContext,
  type WorkspaceDiagnosticsReport,
  type WorkspaceNote,
  type WorkspaceNoteMatch,
  type WorkspaceNoteSummary,
} from "@src/catalog/types.ts";
import {
  validateApplySkillFileSync,
  validateApplySkillUpdate,
  validateApplyWorkspaceCatalogSync,
  validateCatalogEntryUpdate,
  validateCatalogExportFilter,
  validateCatalogHealthFilter,
  validateCatalogImportInput,
  validateEntryLookup,
  validateFindMatchingWorkspaceNote,
  validateGetWorkspaceNote,
  validateIntroduceAgent,
  validateIntroduceSkill,
  validateIntroduceSubagent,
  validateListWorkspaceNotes,
  validatePrepareAgentInitialization,
  validatePromoteSkillToGlobal,
  validateProposeSkillUpdate,
  validateRegisterWorkspaceAlias,
  validateRememberWorkspaceNote,
  validateRemoveWorkspaceNote,
  validateRetireAgent,
  validateSkillFileSyncInput,
  validateUsageAnalyticsFilter,
  validateWorkspace,
  validateWorkspaceCatalogSyncInput,
  validateWorkspaceDiagnosticsInput,
} from "@src/catalog/validation.ts";
import { findCatalogMatches } from "@src/catalog/matcher.ts";
import { LorError, toLorError } from "@src/errors.ts";
import { LocalSkillSync } from "@src/skills/local_skill_sync.ts";
import { generateAgentPrompt } from "@src/agent_prompts/generator.ts";
import { isAbsolute, join } from "@std/path";
import { createNoopLogger, type LorLogger } from "@src/logger.ts";

interface CatalogServiceOptions {
  repository: CatalogRepository;
  skillRoots?: readonly string[];
  now?: () => string;
  logger?: LorLogger;
}

interface WorkspaceCatalogSyncPlan {
  preview: WorkspaceCatalogSyncPreview;
}

export class CatalogService {
  readonly #repository: CatalogRepository;
  readonly #localSkillSync: LocalSkillSync;
  readonly #now: () => string;
  readonly #logger: LorLogger;

  constructor(options: CatalogServiceOptions) {
    this.#repository = options.repository;
    this.#localSkillSync = new LocalSkillSync({
      skillRoots: options.skillRoots ?? [],
    });
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#logger = (options.logger ?? createNoopLogger()).child({
      component: "catalog_service",
    });
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
      scope: validated.scope ?? "global",
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
      scope: validated.scope ?? "global",
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

  async listAgents(
    filter: Omit<ListEntriesFilter, "entryType" | "scope">,
  ): Promise<AgentCatalogEntry[]> {
    const entries = await this.listEntries({
      ...filter,
      entryType: "agent",
    });
    return entries.filter((entry): entry is AgentCatalogEntry =>
      entry.entryType === "agent"
    );
  }

  async listSkills(
    filter: Omit<ListEntriesFilter, "entryType">,
  ): Promise<SkillCatalogEntry[]> {
    const workspace = await this.resolveWorkspace(filter.workspace);
    validateListScope("skill", filter.scope);
    const entries = await this.#repository.listEntries(workspace, {
      ...filter,
      workspace,
      entryType: "skill",
    });
    const skills = entries.filter((entry): entry is SkillCatalogEntry =>
      entry.entryType === "skill"
    ).map(compactSkillCatalogEntry);
    await this.recordUsage(
      skills.map((entry) => usageFromCatalogEntry(workspace, entry, "listed")),
    );
    return skills;
  }

  async listSubagents(
    filter: Omit<ListEntriesFilter, "entryType">,
  ): Promise<SubagentCatalogEntry[]> {
    const workspace = await this.resolveWorkspace(filter.workspace);
    validateListScope("subagent", filter.scope);
    const entries = await this.#repository.listEntries(workspace, {
      ...filter,
      workspace,
      entryType: "subagent",
    });
    const subagents = entries.filter((entry): entry is SubagentCatalogEntry =>
      entry.entryType === "subagent"
    );
    await this.recordUsage(
      subagents.map((entry) =>
        usageFromCatalogEntry(workspace, entry, "listed")
      ),
    );
    return subagents;
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

  async clearWorkspaceAgents(
    input: Omit<ClearWorkspaceCatalogInput, "entryType">,
  ): Promise<ClearWorkspaceCatalogResult> {
    return await this.clearWorkspaceCatalog({ ...input, entryType: "agent" });
  }

  async clearWorkspaceSkills(
    input: Omit<ClearWorkspaceCatalogInput, "entryType">,
  ): Promise<ClearWorkspaceCatalogResult> {
    return await this.clearWorkspaceCatalog({ ...input, entryType: "skill" });
  }

  async clearWorkspaceSubagents(
    input: Omit<ClearWorkspaceCatalogInput, "entryType">,
  ): Promise<ClearWorkspaceCatalogResult> {
    return await this.clearWorkspaceCatalog({
      ...input,
      entryType: "subagent",
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

  async getAgentDetail(
    input: { workspace: string; agentEntryKey: string },
  ): Promise<AgentCatalogEntry | undefined> {
    const entry = await this.getEntryDetail({
      workspace: input.workspace,
      entryType: "agent",
      entryKey: input.agentEntryKey,
    });
    return entry?.entryType === "agent" ? entry : undefined;
  }

  async getSkillDetail(
    input: { workspace: string; skillName: string; scope?: CatalogScope },
  ): Promise<SkillCatalogEntry | undefined> {
    const workspace = await this.resolveWorkspace(input.workspace);
    const entry = await this.resolveScopedEntry(workspace, {
      workspace,
      entryType: "skill",
      entryKey: input.skillName,
      scope: input.scope,
    });
    const skill = entry?.entryType === "skill" ? entry : undefined;
    if (skill) {
      await this.recordUsage([
        usageFromCatalogEntry(workspace, skill, "detailed"),
      ]);
    }
    return skill;
  }

  async getSubagentDetail(
    input: { workspace: string; subagentName: string; scope?: CatalogScope },
  ): Promise<SubagentCatalogEntry | undefined> {
    const workspace = await this.resolveWorkspace(input.workspace);
    const entry = await this.resolveScopedEntry(workspace, {
      workspace,
      entryType: "subagent",
      entryKey: input.subagentName,
      scope: input.scope,
    });
    const subagent = entry?.entryType === "subagent" ? entry : undefined;
    if (subagent) {
      await this.recordUsage([
        usageFromCatalogEntry(workspace, subagent, "detailed"),
      ]);
    }
    return subagent;
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

  async updateAgent(
    input: Omit<CatalogEntryUpdate, "entryType" | "entryKey" | "scope"> & {
      agentEntryKey: string;
    },
  ): Promise<AgentCatalogEntry> {
    const entry = await this.updateCatalogEntry({
      ...input,
      entryType: "agent",
      entryKey: input.agentEntryKey,
    });
    return entry as AgentCatalogEntry;
  }

  async updateSkill(
    input: Omit<CatalogEntryUpdate, "entryType" | "entryKey"> & {
      skillName: string;
    },
  ): Promise<SkillCatalogEntry> {
    const entry = await this.updateCatalogEntry({
      ...input,
      entryType: "skill",
      entryKey: input.skillName,
    });
    return entry as SkillCatalogEntry;
  }

  async updateSubagent(
    input: Omit<CatalogEntryUpdate, "entryType" | "entryKey"> & {
      subagentName: string;
    },
  ): Promise<SubagentCatalogEntry> {
    const entry = await this.updateCatalogEntry({
      ...input,
      entryType: "subagent",
      entryKey: input.subagentName,
    });
    return entry as SubagentCatalogEntry;
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

  // Registered-agent dispatch paths are retained for service/storage
  // compatibility. They are not registered in the normal public V2 MCP surface.
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

  async removeAgent(
    input: { workspace: string; agentEntryKey: string },
  ): Promise<RemoveCatalogEntryResult> {
    return await this.removeCatalogEntry({
      workspace: input.workspace,
      entryType: "agent",
      entryKey: input.agentEntryKey,
    });
  }

  async removeSkill(
    input: { workspace: string; skillName: string; scope?: CatalogScope },
  ): Promise<RemoveCatalogEntryResult> {
    return await this.removeCatalogEntry({
      workspace: input.workspace,
      entryType: "skill",
      entryKey: input.skillName,
      scope: input.scope,
    });
  }

  async removeSubagent(
    input: { workspace: string; subagentName: string; scope?: CatalogScope },
  ): Promise<RemoveCatalogEntryResult> {
    return await this.removeCatalogEntry({
      workspace: input.workspace,
      entryType: "subagent",
      entryKey: input.subagentName,
      scope: input.scope,
    });
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
          negativeRouting: entry.negativeRouting,
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
    const coverageEntries = await this.#repository.listEntries(workspace, {
      workspace,
      projectName: validated.projectName,
      scope: validated.scope,
    });

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
      coverage: summarizeCoverage(coverageEntries),
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
        localContext: await this.localContextDiagnostics(workspace, entries),
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
        localContext: emptyLocalContextDiagnostics(),
        checkedAt,
      };
    }
  }

  async rememberWorkspaceNote(
    input: RememberWorkspaceNoteInput,
  ): Promise<WorkspaceNote> {
    const validated = validateRememberWorkspaceNote(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    return await this.#repository.createWorkspaceNote({
      noteId: crypto.randomUUID(),
      workspace,
      title: validated.title,
      body: validated.body,
      tags: validated.tags ?? [],
      createdAt: this.#now(),
      updatedAt: this.#now(),
    });
  }

  async listWorkspaceNotes(
    input: ListWorkspaceNotesInput,
  ): Promise<ListWorkspaceNotesResult> {
    const validated = validateListWorkspaceNotes(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const notes = await this.#repository.listWorkspaceNotes(workspace, {
      tags: validated.tags,
    });
    await this.recordUsage(
      notes.map((note) => usageFromWorkspaceNote(workspace, note, "listed")),
    );
    return {
      workspace,
      filters: {
        tags: validated.tags,
      },
      notes: notes.map(toWorkspaceNoteSummary),
    };
  }

  async findMatchingWorkspaceNotes(
    input: FindMatchingWorkspaceNoteInput,
  ): Promise<FindMatchingWorkspaceNoteResult> {
    const validated = validateFindMatchingWorkspaceNote(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const limit = validated.limit ?? 5;
    const notes = await this.#repository.listWorkspaceNotes(workspace, {
      tags: validated.tags,
    });
    const matches = notes
      .map((note) => scoreWorkspaceNote(note, validated.query))
      .filter((match): match is WorkspaceNoteMatch => match !== undefined)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, limit);
    await this.recordUsage(
      matches.map((note) => usageFromWorkspaceNoteMatch(workspace, note)),
    );

    return {
      status: matches.length > 0 ? "ok" : "no_match",
      workspace,
      query: validated.query,
      filters: {
        tags: validated.tags,
        limit,
      },
      notes: matches,
    };
  }

  async getWorkspaceNote(
    input: GetWorkspaceNoteInput,
  ): Promise<WorkspaceNote> {
    const validated = validateGetWorkspaceNote(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const note = await this.#repository.getWorkspaceNote(
      workspace,
      validated.noteId,
    );
    if (!note) {
      throw new LorError(
        "not_found",
        "Workspace note was not found.",
        { noteId: validated.noteId },
      );
    }
    await this.recordUsage([
      usageFromWorkspaceNote(workspace, note, "detailed"),
    ]);
    return note;
  }

  async getUsageAnalytics(
    input: UsageAnalyticsFilter,
  ): Promise<UsageAnalyticsReport> {
    const validated = validateUsageAnalyticsFilter(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const records = await this.#repository.getUsageCounters(workspace, {
      entryType: validated.entryType,
      scope: validated.scope,
      entryKey: validated.entryKey,
      projectName: validated.projectName,
    });
    const entries = usageAnalyticsEntries(workspace, records);
    return {
      workspace,
      checkedAt: this.#now(),
      filters: {
        entryType: validated.entryType,
        scope: validated.scope,
        entryKey: validated.entryKey,
        projectName: validated.projectName,
      },
      summary: summarizeUsageAnalytics(entries),
      entries,
      recommendedActions: usageAnalyticsRecommendedActions(entries),
    };
  }

  async removeWorkspaceNote(
    input: RemoveWorkspaceNoteInput,
  ): Promise<RemoveWorkspaceNoteResult> {
    const validated = validateRemoveWorkspaceNote(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const removed = await this.#repository.removeWorkspaceNote(
      workspace,
      validated.noteId,
    );
    if (!removed) {
      throw new LorError(
        "not_found",
        "Workspace note was not found.",
        { noteId: validated.noteId },
      );
    }
    return {
      workspace,
      noteId: validated.noteId,
      removed,
    };
  }

  async prepareAgentInitialization(
    input: PrepareAgentInitializationInput,
  ): Promise<PrepareAgentInitializationResult> {
    const validated = validatePrepareAgentInitialization(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const matchResult = await this.findMatchingEntries({
      workspace,
      task: validated.task,
      projectName: validated.projectName,
      specialtyHints: validated.specialtyHints
        ? [...validated.specialtyHints]
        : undefined,
    });
    const localInstructionSources = defaultLocalInstructionSources();
    const nextSteps = agentInitializationNextSteps(
      matchResult.data.skills.length,
      matchResult.data.subagents.length,
    );
    const failureGuidance = agentInitializationFailureGuidance(
      matchResult.data.skills.length,
      matchResult.data.subagents.length,
    );

    return {
      workspace,
      task: validated.task,
      recommendedSkills: matchResult.data.skills,
      recommendedSubagents: matchResult.data.subagents,
      localInstructionSources,
      prompt: renderAgentInitializationPrompt({
        workspace,
        task: validated.task,
        projectName: validated.projectName,
        specialtyHints: validated.specialtyHints,
        skills: matchResult.data.skills,
        subagents: matchResult.data.subagents,
        localInstructionSources,
        nextSteps,
        failureGuidance,
      }),
      nextSteps,
      failureGuidance,
      delivery: {
        mode: "manual",
        instruction:
          "Paste this prompt into a new or current Codex chat. LOR does not create, message, or steer Codex chats.",
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

  async findMatchingAgents(
    request: Omit<MatchRequest, "preferredType">,
  ): Promise<MatchResult> {
    return filterMatchResult(
      await this.findMatchingEntries({ ...request, preferredType: "agent" }),
      "agent",
    );
  }

  async findMatchingSkills(
    request: Omit<MatchRequest, "preferredType">,
  ): Promise<MatchResult> {
    const result = filterMatchResult(
      await this.findMatchingEntries({ ...request, preferredType: "skill" }),
      "skill",
    );
    const workspace = await this.resolveWorkspace(request.workspace);
    await this.recordUsage(
      result.data.skills.map((candidate) =>
        usageFromMatchCandidate(workspace, candidate, "matched")
      ),
    );
    return result;
  }

  async findMatchingSubagents(
    request: Omit<MatchRequest, "preferredType">,
  ): Promise<MatchResult> {
    const result = filterMatchResult(
      await this.findMatchingEntries({ ...request, preferredType: "subagent" }),
      "subagent",
    );
    const workspace = await this.resolveWorkspace(request.workspace);
    await this.recordUsage(
      result.data.subagents.map((candidate) =>
        usageFromMatchCandidate(workspace, candidate, "matched")
      ),
    );
    return result;
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

  private async localContextDiagnostics(
    workspace: string,
    entries: readonly CatalogEntry[],
  ): Promise<WorkspaceDiagnosticsLocalContext> {
    const registeredSkills = entries.filter((
      entry,
    ): entry is SkillCatalogEntry => entry.entryType === "skill");
    const inventory = await this.safeLocalSkillInventory();
    const discoveredSkillNames = [...inventory];
    const registeredSkillsWithLocalFile: string[] = [];
    const registeredSkillsWithoutLocalFile: string[] = [];

    for (const skill of registeredSkills) {
      if (await this.safeHasSkillFile(skill.skillName)) {
        registeredSkillsWithLocalFile.push(skill.skillName);
      } else {
        registeredSkillsWithoutLocalFile.push(skill.skillName);
      }
    }

    const registeredSkillNames = new Set(
      registeredSkills.map((skill) => skill.skillName),
    );
    const unregisteredLocalSkillNames = discoveredSkillNames.filter((name) =>
      !registeredSkillNames.has(name)
    );
    const agentsMd = await agentsMdStatus(workspace);

    return {
      agentsMd,
      skills: {
        configuredRoots: this.#localSkillSync.configuredRootCount,
        discoveredSkillNames,
        registeredSkillsWithLocalFile: registeredSkillsWithLocalFile.sort(),
        registeredSkillsWithoutLocalFile: registeredSkillsWithoutLocalFile
          .sort(),
        unregisteredLocalSkillNames,
      },
      recommendedActions: localContextRecommendedActions({
        agentsMdStatus: agentsMd.status,
        registeredSkillsWithoutLocalFile,
        unregisteredLocalSkillNames,
      }),
    };
  }

  private async safeLocalSkillInventory(): Promise<readonly string[]> {
    try {
      return (await this.#localSkillSync.inventory()).skillNames;
    } catch {
      return [];
    }
  }

  private async safeHasSkillFile(skillName: string): Promise<boolean> {
    try {
      return await this.#localSkillSync.hasSkillFile(skillName);
    } catch {
      return false;
    }
  }

  private async recordUsage(
    increments: readonly UsageCounterIncrement[],
  ): Promise<void> {
    if (increments.length === 0) {
      return;
    }

    try {
      await this.#repository.recordUsageCounters(increments, {
        now: this.#now(),
      });
    } catch (error) {
      const appError = toLorError(error);
      this.#logger.warn(
        {
          event: "usage_analytics_write_failed",
          errorCode: appError.code,
        },
        "Usage analytics write failed after a successful operation.",
      );
    }
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
    negativeRouting: entry.negativeRouting,
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

function sanitizeReachabilityError(error: string): string {
  const sanitized = error.trim().replace(/(^|\s)\/\S+/g, "$1[path]");
  return sanitized.length > 240 ? `${sanitized.slice(0, 237)}...` : sanitized;
}

function isRoutableEntry(entry: CatalogEntry): boolean {
  return entry.entryType !== "agent" || entry.agentStatus === "active";
}

function filterMatchResult(
  result: MatchResult,
  entryType: EntryType,
): MatchResult {
  const agents = entryType === "agent" ? result.data.agents : [];
  const skills = entryType === "skill" ? result.data.skills : [];
  const subagents = entryType === "subagent" ? result.data.subagents : [];
  const hasCandidate = agents.length > 0 ||
    skills.length > 0 ||
    subagents.length > 0;

  return {
    status: hasCandidate ? result.status : "no_match",
    data: {
      agents,
      skills,
      subagents,
      agentsAmbiguous: entryType === "agent" && result.data.agentsAmbiguous,
      conflict: entryType === "agent" ? result.data.conflict : undefined,
    },
  };
}

function usageFromCatalogEntry(
  workspace: string,
  entry: SkillCatalogEntry | SubagentCatalogEntry,
  operation: UsageOperation,
): UsageCounterIncrement {
  return {
    workspace,
    entryType: entry.entryType,
    scope: entry.scope,
    entryKey: entry.entryKey,
    projectName: entry.projectName,
    operation,
  };
}

function usageFromMatchCandidate(
  workspace: string,
  candidate: MatchCandidate,
  operation: UsageOperation,
): UsageCounterIncrement {
  return {
    workspace,
    entryType: candidate.entryType === "subagent" ? "subagent" : "skill",
    scope: candidate.scope,
    entryKey: candidate.entryKey,
    projectName: candidate.projectName,
    operation,
  };
}

function usageFromWorkspaceNote(
  workspace: string,
  note: WorkspaceNote,
  operation: UsageOperation,
): UsageCounterIncrement {
  return {
    workspace,
    entryType: "note",
    scope: "workspace",
    entryKey: note.noteId,
    operation,
  };
}

function usageFromWorkspaceNoteMatch(
  workspace: string,
  note: WorkspaceNoteMatch,
): UsageCounterIncrement {
  return {
    workspace,
    entryType: "note",
    scope: "workspace",
    entryKey: note.noteId,
    operation: "matched",
  };
}

function usageAnalyticsEntries(
  workspace: string,
  records: readonly UsageCounterRecord[],
): UsageAnalyticsEntry[] {
  const entries = new Map<string, UsageAnalyticsEntry>();
  for (const record of records) {
    const key = [
      record.entryType,
      record.scope,
      record.entryKey,
      record.projectName ?? "",
    ].join(":");
    const current = entries.get(key) ?? {
      workspace,
      entryType: record.entryType,
      scope: record.scope,
      entryKey: record.entryKey,
      projectName: record.projectName,
      listed: 0,
      matched: 0,
      detailed: 0,
      total: 0,
      firstSeenAt: record.firstSeenAt,
      lastSeenAt: record.lastSeenAt,
    };
    current[record.operation] += record.count;
    current.total += record.count;
    current.firstSeenAt = current.firstSeenAt &&
        current.firstSeenAt < record.firstSeenAt
      ? current.firstSeenAt
      : record.firstSeenAt;
    current.lastSeenAt = current.lastSeenAt &&
        current.lastSeenAt > record.lastSeenAt
      ? current.lastSeenAt
      : record.lastSeenAt;
    entries.set(key, current);
  }

  return [...entries.values()].sort((a, b) =>
    a.entryType.localeCompare(b.entryType) ||
    a.scope.localeCompare(b.scope) ||
    (a.projectName ?? "").localeCompare(b.projectName ?? "") ||
    a.entryKey.localeCompare(b.entryKey)
  );
}

function summarizeUsageAnalytics(
  entries: readonly UsageAnalyticsEntry[],
): UsageAnalyticsSummary {
  const summary: UsageAnalyticsSummary = {
    totalEntries: entries.length,
    totalCount: 0,
    byEntryType: {
      skill: emptyUsageTypeSummary(),
      subagent: emptyUsageTypeSummary(),
      note: emptyUsageTypeSummary(),
    },
    byOperation: {
      listed: 0,
      matched: 0,
      detailed: 0,
    },
  };

  for (const entry of entries) {
    const typeSummary = summary.byEntryType[entry.entryType];
    typeSummary.entries++;
    typeSummary.listed += entry.listed;
    typeSummary.matched += entry.matched;
    typeSummary.detailed += entry.detailed;
    typeSummary.total += entry.total;
    summary.byOperation.listed += entry.listed;
    summary.byOperation.matched += entry.matched;
    summary.byOperation.detailed += entry.detailed;
    summary.totalCount += entry.total;
  }

  return summary;
}

function emptyUsageTypeSummary() {
  return {
    entries: 0,
    listed: 0,
    matched: 0,
    detailed: 0,
    total: 0,
  };
}

function usageAnalyticsRecommendedActions(
  entries: readonly UsageAnalyticsEntry[],
): string[] {
  if (entries.length === 0) {
    return [
      "Use list, match, and detail tools to start collecting local aggregate usage counters.",
    ];
  }

  const actions: string[] = [];
  if (entries.some((entry) => entry.matched > entry.detailed)) {
    actions.push(
      "Review entries that are matched more often than opened in detail; their summaries may be enough, or detail metadata may need improvement.",
    );
  }
  if (entries.some((entry) => entry.listed > 0 && entry.matched === 0)) {
    actions.push(
      "Inspect listed entries that are never matched and improve routing metadata where they should be discoverable.",
    );
  }
  if (entries.some((entry) => entry.detailed > 0)) {
    actions.push(
      "Keep frequently opened entries current because agents are using their detailed metadata.",
    );
  }
  return actions.length > 0 ? actions : [
    "Usage counters are being collected; keep monitoring before changing catalog entries.",
  ];
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

  const merged = {
    ...current,
    ...update,
  };
  if (update.negativeRouting === null) {
    delete merged.negativeRouting;
  }
  if (update.implementationGuidance === null) {
    delete merged.implementationGuidance;
  }
  return Object.keys(merged).length > 0 ? merged : undefined;
}

function compactSkillCatalogEntry(entry: SkillCatalogEntry): SkillCatalogEntry {
  return {
    ...entry,
    skillContext: compactSkillContext(entry.skillContext),
  };
}

function compactSkillContext(
  skillContext: SkillContext | undefined,
): SkillContext | undefined {
  if (!skillContext) {
    return undefined;
  }
  const { implementationGuidance: _implementationGuidance, ...compact } =
    skillContext;
  return Object.keys(compact).length > 0 ? compact : undefined;
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

function summarizeCoverage(
  entries: readonly CatalogEntry[],
): CatalogCoverageHealth {
  const skills = entries.filter((entry): entry is SkillCatalogEntry =>
    entry.entryType === "skill"
  );
  const subagents = entries.filter((entry): entry is SubagentCatalogEntry =>
    entry.entryType === "subagent"
  );
  const workspaceSkillCount =
    skills.filter((entry) => entry.scope === "workspace").length;
  const globalSkillCount = skills.filter((entry) => entry.scope === "global")
    .length;
  const workspaceSubagentCount =
    subagents.filter((entry) => entry.scope === "workspace").length;
  const globalSubagentCount =
    subagents.filter((entry) => entry.scope === "global").length;
  const skillCount = workspaceSkillCount + globalSkillCount;
  const subagentCount = workspaceSubagentCount + globalSubagentCount;
  const coverageStatus = coverageStatusFor({
    workspaceSkillCount,
    globalSkillCount,
    workspaceSubagentCount,
    globalSubagentCount,
  });

  return {
    workspaceSkillCount,
    globalSkillCount,
    workspaceSubagentCount,
    globalSubagentCount,
    skillCount,
    subagentCount,
    projectCoverage: coverageBy(entries, (entry) => entry.projectName),
    specialtyCoverage: coverageBy(entries, (entry) => entry.primarySpecialty),
    coverageStatus,
    recommendedActions: coverageRecommendedActions({
      workspaceSkillCount,
      globalSkillCount,
      workspaceSubagentCount,
      globalSubagentCount,
      coverageStatus,
    }),
  };
}

function coverageBy(
  entries: readonly CatalogEntry[],
  keyFor: (entry: CatalogEntry) => string,
): CatalogCoverageDimension[] {
  const dimensions = new Map<string, CatalogCoverageDimension>();
  for (const entry of entries) {
    if (entry.entryType !== "skill" && entry.entryType !== "subagent") {
      continue;
    }
    const key = keyFor(entry);
    const current = dimensions.get(key) ?? {
      name: key,
      skills: 0,
      subagents: 0,
    };
    if (entry.entryType === "skill") {
      current.skills += 1;
    } else {
      current.subagents += 1;
    }
    dimensions.set(key, current);
  }

  return [...dimensions.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function coverageStatusFor(counts: {
  workspaceSkillCount: number;
  globalSkillCount: number;
  workspaceSubagentCount: number;
  globalSubagentCount: number;
}): CatalogCoverageHealth["coverageStatus"] {
  const skillCount = counts.workspaceSkillCount + counts.globalSkillCount;
  const subagentCount = counts.workspaceSubagentCount +
    counts.globalSubagentCount;
  if (skillCount === 0 || subagentCount === 0) {
    return "low_coverage";
  }
  if (
    counts.workspaceSkillCount === 0 ||
    counts.workspaceSubagentCount === 0
  ) {
    return "needs_attention";
  }
  return "healthy";
}

function coverageRecommendedActions(counts: {
  workspaceSkillCount: number;
  globalSkillCount: number;
  workspaceSubagentCount: number;
  globalSubagentCount: number;
  coverageStatus: CatalogCoverageHealth["coverageStatus"];
}): string[] {
  const actions: string[] = [];
  const skillCount = counts.workspaceSkillCount + counts.globalSkillCount;
  const subagentCount = counts.workspaceSubagentCount +
    counts.globalSubagentCount;

  if (skillCount === 0) {
    actions.push(
      "Register at least one workspace skill with introduce_skill before relying on task initialization.",
    );
  } else if (counts.workspaceSkillCount === 0) {
    actions.push(
      "Add a workspace-local skill so global skills do not hide missing project-specific guidance.",
    );
  }

  if (subagentCount === 0) {
    actions.push(
      "Register at least one scoped subagent profile with introduce_subagent for repeatable focused work.",
    );
  } else if (counts.workspaceSubagentCount === 0) {
    actions.push(
      "Add a workspace-local subagent profile for project-specific scoped delegation.",
    );
  }

  if (counts.coverageStatus === "healthy") {
    actions.push(
      "Keep skill and subagent metadata current as project responsibilities change.",
    );
  } else {
    actions.push(
      "Review skill and subagent coverage before relying on LOR for task context.",
    );
  }

  return actions;
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

function emptyLocalContextDiagnostics(): WorkspaceDiagnosticsLocalContext {
  return {
    agentsMd: {
      status: "not_inspected",
      instruction:
        "Local context was not inspected because catalog storage was unavailable.",
    },
    skills: {
      configuredRoots: 0,
      discoveredSkillNames: [],
      registeredSkillsWithLocalFile: [],
      registeredSkillsWithoutLocalFile: [],
      unregisteredLocalSkillNames: [],
    },
    recommendedActions: [
      "Restore catalog storage before relying on local skill or AGENTS.md diagnostics.",
    ],
  };
}

async function agentsMdStatus(
  workspace: string,
): Promise<WorkspaceDiagnosticsLocalContext["agentsMd"]> {
  if (!isAbsolute(workspace)) {
    return {
      status: "not_inspected",
      instruction:
        "Workspace is not an absolute path, so LOR cannot safely inspect AGENTS.md. Read local repository instructions manually.",
    };
  }

  try {
    const stat = await Deno.stat(join(workspace, "AGENTS.md"));
    return {
      status: stat.isFile ? "present" : "missing",
      instruction: stat.isFile
        ? "Read AGENTS.md before changing files."
        : "No AGENTS.md file was found at the workspace root. Read nearby instructions manually or add AGENTS.md if this workspace needs durable guidance.",
    };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return {
        status: "missing",
        instruction:
          "No AGENTS.md file was found at the workspace root. Read nearby instructions manually or add AGENTS.md if this workspace needs durable guidance.",
      };
    }
    return {
      status: "not_inspected",
      instruction:
        "AGENTS.md could not be inspected. Continue from visible repository instructions and report the limitation.",
    };
  }
}

function localContextRecommendedActions(input: {
  agentsMdStatus: WorkspaceDiagnosticsLocalContext["agentsMd"]["status"];
  registeredSkillsWithoutLocalFile: readonly string[];
  unregisteredLocalSkillNames: readonly string[];
}): string[] {
  const actions: string[] = [];
  if (input.agentsMdStatus === "missing") {
    actions.push(
      "Add a workspace AGENTS.md or document which existing local instructions agents should read.",
    );
  } else if (input.agentsMdStatus === "not_inspected") {
    actions.push(
      "Confirm local repository instructions manually before starting implementation.",
    );
  }

  if (input.registeredSkillsWithoutLocalFile.length > 0) {
    actions.push(
      "Resolve registered LOR skills that do not have matching local SKILL.md files in configured skill roots.",
    );
  }
  if (input.unregisteredLocalSkillNames.length > 0) {
    actions.push(
      "Register useful local Codex skills in LOR so task initialization can recommend them.",
    );
  }
  if (actions.length === 0) {
    actions.push(
      "Local instruction and skill metadata alignment looks usable; keep it current as skills change.",
    );
  }
  return actions;
}

function toWorkspaceNoteSummary(note: WorkspaceNote): WorkspaceNoteSummary {
  return {
    noteId: note.noteId,
    workspace: note.workspace,
    title: note.title,
    tags: note.tags,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

type WorkspaceNoteMatchField = "title" | "tags" | "body";

interface WorkspaceNoteFieldScore {
  field: WorkspaceNoteMatchField;
  score: number;
  signals: string[];
}

function scoreWorkspaceNote(
  note: WorkspaceNote,
  query: string,
): WorkspaceNoteMatch | undefined {
  const queryTokens = tokenizeWorkspaceNoteText(query);
  if (queryTokens.length === 0) {
    return undefined;
  }

  const fieldScores = [
    scoreWorkspaceNoteField("title", note.title, queryTokens, 8),
    scoreWorkspaceNoteField("tags", note.tags.join(" "), queryTokens, 7),
    scoreWorkspaceNoteField("body", note.body, queryTokens, 2),
  ].filter((score): score is WorkspaceNoteFieldScore => score !== undefined);
  const score = fieldScores.reduce((sum, field) => sum + field.score, 0);
  if (score < 2) {
    return undefined;
  }

  return {
    ...toWorkspaceNoteSummary(note),
    score,
    matchedFields: [...new Set(fieldScores.map((field) => field.field))],
    matchedSignals: [
      ...new Set(fieldScores.flatMap((field) => field.signals)),
    ],
    preview: workspaceNotePreview(note.body),
  };
}

function scoreWorkspaceNoteField(
  field: WorkspaceNoteMatchField,
  value: string,
  queryTokens: readonly string[],
  weight: number,
): WorkspaceNoteFieldScore | undefined {
  const fieldTokens = tokenizeWorkspaceNoteText(value);
  let score = 0;
  const signals: string[] = [];

  for (const queryToken of queryTokens) {
    for (const fieldToken of fieldTokens) {
      const tokenScore = scoreWorkspaceNoteToken(
        queryToken,
        fieldToken,
        weight,
      );
      if (tokenScore > 0) {
        score += tokenScore;
        signals.push(queryToken);
        break;
      }
    }
  }

  return score > 0
    ? { field, score, signals: [...new Set(signals)] }
    : undefined;
}

function scoreWorkspaceNoteToken(
  queryToken: string,
  fieldToken: string,
  weight: number,
): number {
  if (queryToken === fieldToken) {
    return weight;
  }
  if (fieldToken.startsWith(queryToken) || queryToken.startsWith(fieldToken)) {
    return Math.max(1, Math.floor(weight * 0.6));
  }
  if (fieldToken.includes(queryToken) || queryToken.includes(fieldToken)) {
    return Math.max(1, Math.floor(weight * 0.4));
  }
  return 0;
}

function tokenizeWorkspaceNoteText(value: string): string[] {
  return value.trim().toLowerCase().split(/[^a-z0-9]+/).filter((token) =>
    token.length > 1
  );
}

function workspaceNotePreview(body: string): string {
  const normalized = body.trim().replace(/\s+/g, " ");
  return normalized.length > 180
    ? `${normalized.slice(0, 177)}...`
    : normalized;
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

function defaultLocalInstructionSources(): LocalInstructionSource[] {
  return [{
    name: "AGENTS.md",
    status: "manual_reference",
    instruction:
      "Read the nearest AGENTS.md files before editing. If they are unavailable, continue with the repository's visible README, docs, tests, and current code patterns.",
  }];
}

function agentInitializationNextSteps(
  skillCount: number,
  subagentCount: number,
): string[] {
  const steps = [
    "Read local repository instructions before changing files.",
    "Use the recommended skills when they are available in the Codex skill list.",
    "Use recommended subagent profiles as scoped prompt guidance when the task needs a smaller focused helper.",
    "Keep the task in the current Codex chat unless the user explicitly asks to create or message another chat.",
    "Report exact files changed and exact verification commands/results.",
  ];

  if (skillCount === 0) {
    steps.push(
      "No registered skills matched; proceed from repository instructions and consider registering useful skills after the task.",
    );
  }
  if (subagentCount === 0) {
    steps.push(
      "No registered subagent profiles matched; continue without inventing unavailable subagents.",
    );
  }

  return steps;
}

function agentInitializationFailureGuidance(
  skillCount: number,
  subagentCount: number,
): string[] {
  const guidance = [
    "If a recommended local skill is not installed or visible to Codex, continue without it and mention the missing skill in the handoff.",
    "If local instructions cannot be opened, continue from the visible code/docs and report that limitation.",
    "If recommended context conflicts with repository instructions or the user's latest request, follow the user's latest request and local repository instructions.",
  ];

  if (skillCount === 0) {
    guidance.push(
      "If skill coverage looks weak, suggest registering a LOR skill after completing the current task.",
    );
  }
  if (subagentCount === 0) {
    guidance.push(
      "If the task would benefit from a scoped helper, suggest introducing a reusable subagent profile later.",
    );
  }

  return guidance;
}

function renderAgentInitializationPrompt(input: {
  workspace: string;
  task: string;
  projectName?: string;
  specialtyHints?: readonly string[];
  skills: readonly MatchCandidate[];
  subagents: readonly MatchCandidate[];
  localInstructionSources: readonly LocalInstructionSource[];
  nextSteps: readonly string[];
  failureGuidance: readonly string[];
}): string {
  const sections = [
    "You are a short-lived, task-oriented Codex agent initialized by Local Orchestration Router (LOR).",
    "",
    "Workspace:",
    input.workspace,
  ];

  if (input.projectName) {
    sections.push("", "Project hint:", input.projectName);
  }
  if (input.specialtyHints?.length) {
    sections.push("", "Specialty hints:", input.specialtyHints.join(", "));
  }

  sections.push("", "Task:", input.task);

  sections.push("", "Local instruction guidance:");
  for (const source of input.localInstructionSources) {
    sections.push(`- ${source.name}: ${source.instruction}`);
  }

  sections.push("", "Recommended LOR skills:");
  if (input.skills.length === 0) {
    sections.push(
      "- None matched. Do not invent skills; continue from local instructions and repository context.",
    );
  } else {
    for (const skill of input.skills) {
      sections.push(
        `- ${skill.displayName} (${skill.scope}, key: ${skill.entryKey})`,
        `  Specialty: ${skill.primarySpecialty}`,
        `  Why: ${skill.explanation.summary}`,
      );
      if (skill.skillContext?.whenToUse) {
        sections.push(`  When to use: ${skill.skillContext.whenToUse}`);
      }
    }
  }

  sections.push("", "Recommended LOR subagent profiles:");
  if (input.subagents.length === 0) {
    sections.push(
      "- None matched. Do not invent subagents; keep the task in this Codex chat unless the user asks otherwise.",
    );
  } else {
    for (const subagent of input.subagents) {
      sections.push(
        `- ${subagent.displayName} (${subagent.scope}, key: ${subagent.entryKey})`,
        `  Purpose: ${subagent.purpose ?? subagent.primarySpecialty}`,
        `  Scope: ${
          subagent.limitedScope ?? "Use only for a focused slice of the task."
        }`,
        `  Why: ${subagent.explanation.summary}`,
      );
    }
  }

  sections.push(
    "",
    "Next steps:",
    ...input.nextSteps.map((step) => `- ${step}`),
    "",
    "Failure guidance:",
    ...input.failureGuidance.map((item) => `- ${item}`),
    "",
    "Boundary:",
    "LOR prepared this prompt and catalog context only. It did not create, message, dispatch, or steer any Codex chat.",
  );

  return sections.join("\n");
}
