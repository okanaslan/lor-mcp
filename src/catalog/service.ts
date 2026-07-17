import {
  type AgentCatalogEntry,
  type CatalogEntry,
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
  type VerificationMetadata,
} from "@src/catalog/types.ts";
import {
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
    const workspace = validateWorkspace(lookup.workspace);
    return await this.#repository.getEntry(workspace, {
      ...lookup,
      workspace,
    });
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
}

function introductionVerification(now: string): VerificationMetadata {
  return {
    verificationStatus: "verified",
    verificationSource: "mcp_introduction",
    verifiedAt: now,
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
