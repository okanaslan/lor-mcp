import { join } from "@std/path";
import { CatalogService } from "@src/catalog/service.ts";
import { SqliteCatalogRepository } from "@src/catalog/sqlite_repository.ts";
import type {
  IntroduceAgentInput,
  IntroduceSkillInput,
  VerificationMetadata,
} from "@src/catalog/types.ts";

export const FIXED_NOW = "2026-07-12T00:00:00.000Z";

export const verification: VerificationMetadata = {
  verificationStatus: "verified",
  verificationSource: "test",
  verifiedAt: FIXED_NOW,
};

export async function createInitializedRepository(): Promise<
  SqliteCatalogRepository
> {
  const dir = await Deno.makeTempDir();
  const repo = new SqliteCatalogRepository(join(dir, "catalog.db"));
  await repo.initialize();
  return repo;
}

export async function createCatalogService(): Promise<{
  repo: SqliteCatalogRepository;
  service: CatalogService;
}> {
  const repo = await createInitializedRepository();
  const service = new CatalogService({
    repository: repo,
    now: () => FIXED_NOW,
  });
  return { repo, service };
}

export async function seedAgent(
  repo: SqliteCatalogRepository,
  workspace: string,
  codexSessionId: string,
  overrides: SeedAgentOverrides = {},
): Promise<void> {
  await repo.createAgent(workspace, {
    workspace,
    codexSessionId,
    projectName: overrides.projectName ?? "Agentic Router",
    displayName: overrides.displayName ?? `Agent ${codexSessionId}`,
    primarySpecialty: overrides.primarySpecialty ?? "backend api",
    specialtyTags: overrides.specialtyTags ?? ["api"],
    handoff: overrides.handoff,
    verification: overrides.verification ?? verification,
    now: overrides.now ?? FIXED_NOW,
  });
}

export async function seedSkill(
  repo: SqliteCatalogRepository,
  workspace: string,
  skillName: string,
  overrides: SeedSkillOverrides = {},
): Promise<void> {
  await repo.createSkill(workspace, {
    workspace,
    skillName,
    projectName: overrides.projectName ?? "Agentic Router",
    displayName: overrides.displayName ?? `Skill ${skillName}`,
    primarySpecialty: overrides.primarySpecialty ?? "backend api",
    specialtyTags: overrides.specialtyTags ?? ["api"],
    verification: overrides.verification ?? verification,
    now: overrides.now ?? FIXED_NOW,
  });
}

type SeedAgentOverrides =
  & Partial<Omit<IntroduceAgentInput, "workspace" | "codexSessionId">>
  & {
    verification?: VerificationMetadata;
    now?: string;
  };

type SeedSkillOverrides =
  & Partial<Omit<IntroduceSkillInput, "workspace" | "skillName">>
  & {
    verification?: VerificationMetadata;
    now?: string;
  };
