import { assertEquals, assertRejects } from "@std/assert";
import { join } from "@std/path";
import { CatalogService } from "@src/catalog/service.ts";
import { SqliteCatalogRepository } from "@src/catalog/sqlite_repository.ts";

Deno.test("CatalogService introduces verified agents with optional handoff metadata", async () => {
  const dir = await Deno.makeTempDir();
  const registryPath = join(dir, "agents.json");
  await Deno.writeTextFile(
    registryPath,
    JSON.stringify({ agents: [{ codexSessionId: "agent-1" }] }),
  );

  const repo = new SqliteCatalogRepository(join(dir, "catalog.db"));
  await repo.initialize();
  const service = new CatalogService({
    repository: repo,
    agentRegistryPath: registryPath,
    skillRoots: [],
    now: () => "2026-07-12T00:00:00.000Z",
  });

  const created = await service.introduceAgent("workspace-a", {
    codexSessionId: "agent-1",
    projectName: "Agentic Router",
    displayName: "Backend Agent",
    primarySpecialty: "backend api",
    specialtyTags: ["api"],
    handoff: {
      whenToUse: "Backend API changes",
      handoffPromptTemplate: "Handle {task}",
      requiredContext: ["task"],
      expectedOutput: "Patch summary",
      constraints: ["Stay scoped"],
    },
  });

  const detail = await service.getEntryDetail("workspace-a", {
    entryType: "agent",
    entryKey: "agent-1",
  });

  assertEquals(created.verificationStatus, "verified");
  if (detail?.entryType !== "agent") {
    throw new Error("Expected agent detail.");
  }
  assertEquals(detail.handoff?.whenToUse, "Backend API changes");

  repo.close();
});

Deno.test("CatalogService blocks unverified skills before storage", async () => {
  const dir = await Deno.makeTempDir();
  const repo = new SqliteCatalogRepository(join(dir, "catalog.db"));
  await repo.initialize();
  const service = new CatalogService({
    repository: repo,
    agentRegistryPath: join(dir, "agents.json"),
    skillRoots: [dir],
    now: () => "2026-07-12T00:00:00.000Z",
  });

  await assertRejects(
    () =>
      service.introduceSkill("workspace-a", {
        skillName: "missing-skill",
        projectName: "Agentic Router",
        displayName: "Missing Skill",
        primarySpecialty: "backend api",
        specialtyTags: ["api"],
      }),
    Error,
    "verification_failed",
  );

  const entries = await service.listEntries("workspace-a", {});
  assertEquals(entries, []);

  repo.close();
});
