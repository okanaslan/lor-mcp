import {
  type AgentCatalogEntry,
  type ApplySkillUpdateInput,
  type CatalogEntry,
  type CatalogEntryUpdate,
  type CatalogExport,
  type CatalogExportFilter,
  type CatalogHealthEntry,
  type CatalogHealthFilter,
  type CatalogHealthIssue,
  type CatalogHealthReport,
  type CatalogHealthSummary,
  type CatalogImportInput,
  type CatalogImportIssue,
  type CatalogImportResult,
  type CatalogRepository,
  type ClearWorkspaceCatalogInput,
  type ClearWorkspaceCatalogResult,
  type EntryLookup,
  type IntroduceAgentInput,
  type IntroduceSkillInput,
  type ListEntriesFilter,
  type MatchRequest,
  type MatchResult,
  type PrepareAgentHandoffInput,
  type PrepareAgentHandoffResult,
  type ProposeSkillUpdateInput,
  type RegisterWorkspaceAliasInput,
  type RegisterWorkspaceAliasResult,
  type RemoveCatalogEntryResult,
  type SkillCatalogEntry,
  type SkillContext,
  type SkillMetadataUpdate,
  type SkillUpdateProposal,
  type SkillUpdateProposalResult,
  type VerificationMetadata,
} from "@src/catalog/types.ts";
import {
  validateApplySkillUpdate,
  validateCatalogEntryUpdate,
  validateCatalogExportFilter,
  validateCatalogHealthFilter,
  validateCatalogImportInput,
  validateEntryLookup,
  validateIntroduceAgent,
  validateIntroduceSkill,
  validatePrepareAgentHandoff,
  validateProposeSkillUpdate,
  validateRegisterWorkspaceAlias,
  validateWorkspace,
} from "@src/catalog/validation.ts";
import { findCatalogMatches } from "@src/catalog/matcher.ts";
import { LorError } from "@src/errors.ts";

interface CatalogServiceOptions {
  repository: CatalogRepository;
  now?: () => string;
}

export class CatalogService {
  readonly #repository: CatalogRepository;
  readonly #now: () => string;

  constructor(options: CatalogServiceOptions) {
    this.#repository = options.repository;
    this.#now = options.now ?? (() => new Date().toISOString());
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
      verification: introductionVerification(now),
      now,
    });
  }

  async listEntries(
    filter: ListEntriesFilter,
  ): Promise<CatalogEntry[]> {
    const workspace = await this.resolveWorkspace(filter.workspace);
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
    const updated = await this.#repository.updateEntry(workspace, {
      ...validated,
      workspace,
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

  async proposeSkillUpdate(
    input: ProposeSkillUpdateInput,
  ): Promise<SkillUpdateProposalResult> {
    const validated = validateProposeSkillUpdate(input);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const existing = await this.#repository.getEntry(workspace, {
      workspace,
      entryType: "skill",
      entryKey: validated.skillName,
    });
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

  async removeCatalogEntry(
    lookup: EntryLookup,
  ): Promise<RemoveCatalogEntryResult> {
    const validated = validateEntryLookup(lookup);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const removed = await this.#repository.removeEntry(
      workspace,
      { ...validated, workspace },
    );
    if (!removed) {
      throw new LorError(
        "not_found",
        "Catalog entry was not found.",
        { entryType: validated.entryType },
      );
    }
    return { ...validated, workspace, removed: true };
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
      const existing = await this.#repository.getEntry(workspace, {
        workspace,
        entryType: entry.entryType,
        entryKey: entry.entryType === "agent"
          ? entry.codexSessionId
          : entry.skillName,
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
          handoff: entry.handoff,
          verification: {
            verificationStatus: entry.verificationStatus,
            verificationSource: entry.verificationSource,
            verifiedAt: entry.verifiedAt,
            verificationMessage: entry.verificationMessage,
          },
          now,
        });
      } else {
        await this.#repository.createSkill(workspace, {
          workspace,
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

  async checkCatalogHealth(
    filter: CatalogHealthFilter,
  ): Promise<CatalogHealthReport> {
    const validated = validateCatalogHealthFilter(filter);
    const workspace = await this.resolveWorkspace(validated.workspace);
    const entries = await this.#repository.listEntries(workspace, {
      workspace,
      entryType: validated.entryType,
      projectName: validated.projectName,
    });
    const filteredEntries = validated.entryKey
      ? entries.filter((entry) => entry.entryKey === validated.entryKey)
      : entries;
    const healthEntries = filteredEntries.map(toHealthEntry);

    return {
      checkedAt: this.#now(),
      workspace,
      filters: {
        entryType: validated.entryType,
        projectName: validated.projectName,
        entryKey: validated.entryKey,
      },
      summary: summarizeHealth(healthEntries),
      entries: healthEntries,
    };
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
    return findCatalogMatches(entries, { ...request, workspace });
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

  private async findImportConflicts(
    input: CatalogImportInput & {
      conflictStrategy: "skip" | "fail";
    },
  ): Promise<CatalogImportIssue[]> {
    const issues: CatalogImportIssue[] = [];
    const seen = new Set<string>();
    for (let index = 0; index < input.catalog.entries.length; index++) {
      const entry = input.catalog.entries[index];
      const entryKey = entry.entryType === "agent"
        ? entry.codexSessionId
        : entry.skillName;
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
      handoff: entry.handoff,
    };
  }

  return {
    ...base,
    entryType: "skill",
    skillName: entry.skillName,
    skillContext: entry.skillContext,
  };
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

function toHealthEntry(entry: CatalogEntry): CatalogHealthEntry {
  return {
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
