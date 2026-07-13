import { assertEquals, assertRejects } from "@std/assert";
import { join } from "@std/path";
import { SqliteCatalogRepository } from "@src/catalog/sqlite_repository.ts";
import type { VerificationMetadata } from "@src/catalog/types.ts";

const verification: VerificationMetadata = {
  verificationStatus: "verified",
  verificationSource: "test",
  verifiedAt: "2026-07-12T00:00:00.000Z",
};

Deno.test("SqliteCatalogRepository stores agents and skills by namespace", async () => {
  const dir = await Deno.makeTempDir();
  const repo = new SqliteCatalogRepository(join(dir, "catalog.db"));
  await repo.initialize();

  await repo.createAgent("workspace-a", {
    codexSessionId: "agent-1",
    projectName: "Agentic Router",
    displayName: "Backend Agent",
    primarySpecialty: "backend api",
    specialtyTags: ["api"],
    verification,
    now: "2026-07-12T00:00:00.000Z",
  });
  await repo.createSkill("workspace-b", {
    skillName: "backend-skill",
    projectName: "Other Project",
    displayName: "Backend Skill",
    primarySpecialty: "backend api",
    specialtyTags: ["api"],
    verification,
    now: "2026-07-12T00:00:00.000Z",
  });

  const workspaceAEntries = await repo.listEntries("workspace-a", {});
  const workspaceBEntries = await repo.listEntries("workspace-b", {});

  assertEquals(workspaceAEntries.map((entry) => entry.entryKey), ["agent-1"]);
  assertEquals(workspaceBEntries.map((entry) => entry.entryKey), [
    "backend-skill",
  ]);

  repo.close();
});

Deno.test("SqliteCatalogRepository enforces namespace-local duplicates", async () => {
  const dir = await Deno.makeTempDir();
  const repo = new SqliteCatalogRepository(join(dir, "catalog.db"));
  await repo.initialize();

  const input = {
    codexSessionId: "agent-1",
    projectName: "Agentic Router",
    displayName: "Backend Agent",
    primarySpecialty: "backend api",
    specialtyTags: ["api"],
    verification,
    now: "2026-07-12T00:00:00.000Z",
  };

  await repo.createAgent("workspace-a", input);
  await repo.createAgent("workspace-b", input);

  await assertRejects(
    () => repo.createAgent("workspace-a", input),
    Error,
    "duplicate_entry",
  );

  repo.close();
});
