import {
  type AgentCatalogEntry,
  type CatalogEntry,
  type CatalogEntryUpdate,
  type CatalogExport,
  type CatalogExportFilter,
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
  type RemoveCatalogEntryResult,
  type VerificationMetadata,
} from "@src/catalog/types.ts";
import {
  validateCatalogEntryUpdate,
  validateCatalogExportFilter,
  validateCatalogImportInput,
  validateEntryLookup,
  validateIntroduceAgent,
  validateIntroduceSkill,
  validatePrepareAgentHandoff,
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
    return await this.#repository.createAgent(validated.workspace, {
      ...validated,
      verification: introductionVerification(now),
      now,
    });
  }

  async introduceSkill(
    input: IntroduceSkillInput,
  ): Promise<CatalogEntry> {
    const validated = validateIntroduceSkill(input);
    const now = this.#now();
    return await this.#repository.createSkill(validated.workspace, {
      ...validated,
      verification: introductionVerification(now),
      now,
    });
  }

  async listEntries(
    filter: ListEntriesFilter,
  ): Promise<CatalogEntry[]> {
    const workspace = validateWorkspace(filter.workspace);
    return await this.#repository.listEntries(workspace, {
      ...filter,
      workspace,
    });
  }

  async clearWorkspaceCatalog(
    input: ClearWorkspaceCatalogInput,
  ): Promise<ClearWorkspaceCatalogResult> {
    const workspace = validateWorkspace(input.workspace);
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
    const workspace = validateWorkspace(validated.workspace);
    return await this.#repository.getEntry(workspace, {
      ...validated,
      workspace,
    });
  }

  async updateCatalogEntry(
    input: CatalogEntryUpdate,
  ): Promise<CatalogEntry> {
    const validated = validateCatalogEntryUpdate(input);
    const updated = await this.#repository.updateEntry(validated.workspace, {
      ...validated,
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

  async removeCatalogEntry(
    lookup: EntryLookup,
  ): Promise<RemoveCatalogEntryResult> {
    const validated = validateEntryLookup(lookup);
    const removed = await this.#repository.removeEntry(
      validated.workspace,
      validated,
    );
    if (!removed) {
      throw new LorError(
        "not_found",
        "Catalog entry was not found.",
        { entryType: validated.entryType },
      );
    }
    return { ...validated, removed: true };
  }

  async exportCatalog(
    filter: CatalogExportFilter,
  ): Promise<CatalogExport> {
    const validated = validateCatalogExportFilter(filter);
    const entries = await this.#repository.listEntries(validated.workspace, {
      workspace: validated.workspace,
      entryType: validated.entryType,
      projectName: validated.projectName,
    });

    return {
      version: 1,
      exportedAt: this.#now(),
      workspace: validated.workspace,
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
    const duplicateIssues = await this.findImportConflicts(validated);
    if (validated.conflictStrategy === "fail" && duplicateIssues.length > 0) {
      return {
        workspace: validated.workspace,
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
    for (let index = 0; index < validated.catalog.entries.length; index++) {
      const entry = validated.catalog.entries[index];
      const existing = await this.#repository.getEntry(validated.workspace, {
        workspace: validated.workspace,
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
        await this.#repository.createAgent(validated.workspace, {
          workspace: validated.workspace,
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
        await this.#repository.createSkill(validated.workspace, {
          workspace: validated.workspace,
          skillName: entry.skillName,
          projectName: entry.projectName,
          displayName: entry.displayName,
          primarySpecialty: entry.primarySpecialty,
          specialtyTags: entry.specialtyTags,
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
      workspace: validated.workspace,
      version: validated.catalog.version,
      conflictStrategy: validated.conflictStrategy,
      importedCount,
      skippedCount,
      failedCount: 0,
      errors: [],
    };
  }

  async prepareAgentHandoff(
    input: PrepareAgentHandoffInput,
  ): Promise<PrepareAgentHandoffResult> {
    const validated = validatePrepareAgentHandoff(input);
    const entry = await this.#repository.getEntry(validated.workspace, {
      workspace: validated.workspace,
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
      workspace: validated.workspace,
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
    const workspace = validateWorkspace(request.workspace);
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
  };
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
