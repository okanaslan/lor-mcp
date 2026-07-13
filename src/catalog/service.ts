import {
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
  type VerificationMetadata,
} from "@src/catalog/types.ts";
import {
  validateIntroduceAgent,
  validateIntroduceSkill,
  validateWorkspace,
} from "@src/catalog/validation.ts";
import { findCatalogMatches } from "@src/catalog/matcher.ts";
import { AgenticRouterError } from "@src/errors.ts";

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
      throw new AgenticRouterError(
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

  async findMatchingEntries(
    request: MatchRequest,
  ): Promise<MatchResult> {
    const workspace = validateWorkspace(request.workspace);
    if (!request.task?.trim()) {
      throw new AgenticRouterError("validation_error", "task is required.", {
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
