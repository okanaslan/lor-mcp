import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { CatalogService } from "@src/catalog/service.ts";
import { SqliteCatalogRepository } from "@src/catalog/sqlite_repository.ts";

Deno.test("CatalogService introduces agents without registry pre-registration", async () => {
  const dir = await Deno.makeTempDir();
  const repo = new SqliteCatalogRepository(join(dir, "catalog.db"));
  await repo.initialize();
  const service = new CatalogService({
    repository: repo,
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
  assertEquals(created.verificationSource, "mcp_introduction");
  if (detail?.entryType !== "agent") {
    throw new Error("Expected agent detail.");
  }
  assertEquals(detail.handoff?.whenToUse, "Backend API changes");

  repo.close();
});

Deno.test("CatalogService introduces skills without skill root pre-registration", async () => {
  const dir = await Deno.makeTempDir();
  const repo = new SqliteCatalogRepository(join(dir, "catalog.db"));
  await repo.initialize();
  const service = new CatalogService({
    repository: repo,
    now: () => "2026-07-12T00:00:00.000Z",
  });

  const created = await service.introduceSkill("workspace-a", {
    skillName: "missing-skill",
    projectName: "Agentic Router",
    displayName: "Missing Skill",
    primarySpecialty: "backend api",
    specialtyTags: ["api"],
  });

  const entries = await service.listEntries("workspace-a", {});
  assertEquals(created.verificationStatus, "verified");
  assertEquals(created.verificationSource, "mcp_introduction");
  assertEquals(entries.map((entry) => entry.entryKey), ["missing-skill"]);

  repo.close();
});
