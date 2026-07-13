import {
  type CatalogEntry,
  type CatalogRepository,
  type EntryLookup,
  type IntroduceAgentInput,
  type IntroduceSkillInput,
  type ListEntriesFilter,
  type MatchRequest,
  type MatchResult,
} from "@src/catalog/types.ts";
import {
  validateIntroduceAgent,
  validateIntroduceSkill,
} from "@src/catalog/validation.ts";
import { verifyAgentExists, verifySkillExists } from "@src/catalog/verifier.ts";
import { findCatalogMatches } from "@src/catalog/matcher.ts";
import { AgenticRouterError } from "@src/errors.ts";

interface CatalogServiceOptions {
  repository: CatalogRepository;
  agentRegistryPath: string;
  skillRoots: string[];
  now?: () => string;
}

export class CatalogService {
  readonly #repository: CatalogRepository;
  readonly #agentRegistryPath: string;
  readonly #skillRoots: string[];
  readonly #now: () => string;

  constructor(options: CatalogServiceOptions) {
    this.#repository = options.repository;
    this.#agentRegistryPath = options.agentRegistryPath;
    this.#skillRoots = options.skillRoots;
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  async introduceAgent(
    namespace: string,
    input: IntroduceAgentInput,
  ): Promise<CatalogEntry> {
    const validated = validateIntroduceAgent(input);
    const verification = await verifyAgentExists(
      validated.codexSessionId,
      this.#agentRegistryPath,
      this.#now,
    );
    return await this.#repository.createAgent(namespace, {
      ...validated,
      verification,
      now: this.#now(),
    });
  }

  async introduceSkill(
    namespace: string,
    input: IntroduceSkillInput,
  ): Promise<CatalogEntry> {
    const validated = validateIntroduceSkill(input);
    const verification = await verifySkillExists(
      validated.skillName,
      this.#skillRoots,
      this.#now,
    );
    return await this.#repository.createSkill(namespace, {
      ...validated,
      verification,
      now: this.#now(),
    });
  }

  async listEntries(
    namespace: string,
    filter: ListEntriesFilter,
  ): Promise<CatalogEntry[]> {
    return await this.#repository.listEntries(namespace, filter);
  }

  async getEntryDetail(
    namespace: string,
    lookup: EntryLookup,
  ): Promise<CatalogEntry | undefined> {
    return await this.#repository.getEntry(namespace, lookup);
  }

  async findMatchingEntries(
    namespace: string,
    request: MatchRequest,
  ): Promise<MatchResult> {
    if (!request.task?.trim()) {
      throw new AgenticRouterError("validation_error", "task is required.", {
        field: "task",
      });
    }

    const entries = await this.#repository.listEntries(namespace, {});
    return findCatalogMatches(entries, request);
  }
}
