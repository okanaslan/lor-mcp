import { assertEquals } from "@std/assert";
import { Database } from "@db/sqlite";
import { join } from "@std/path";
import { SqliteCatalogRepository } from "@src/catalog/sqlite_repository.ts";
import { CatalogService } from "@src/catalog/service.ts";
import { FIXED_NOW } from "@test/helpers/catalog_fixtures.ts";
Deno.test("schema 17 database migrates without inventing reviews or changing skill instructions", async () => {
  const root = await Deno.makeTempDir(), path = join(root, "catalog.db");
  let repo = new SqliteCatalogRepository(path);
  try {
    await repo.initialize();
    let service = new CatalogService({
      repository: repo,
      now: () => FIXED_NOW,
    });
    await service.introduceSkill({
      workspace: "legacy",
      scope: "workspace",
      skillName: "legacy",
      projectName: "test",
      displayName: "legacy",
      primarySpecialty: "review",
      specialtyTags: ["review"],
      skillContext: { usageNotes: "Preserve these instructions" },
    });
    repo.close();
    const db = new Database(path);
    try {
      db.exec("ALTER TABLE introduced_skills DROP COLUMN governance");
      db.exec(
        "ALTER TABLE skill_update_proposals DROP COLUMN proposedGovernance",
      );
      db.exec("ALTER TABLE skill_update_proposals DROP COLUMN dependencies");
      db.exec("DELETE FROM schema_migrations WHERE version = 18");
      db.exec(
        "INSERT OR IGNORE INTO schema_migrations(version,appliedAt) VALUES (17,?)",
        FIXED_NOW,
      );
    } finally {
      db.close();
    }
    repo = new SqliteCatalogRepository(path);
    await repo.initialize();
    service = new CatalogService({ repository: repo, now: () => FIXED_NOW });
    const entry = await service.getSkillDetail({
      workspace: "legacy",
      scope: "workspace",
      skillName: "legacy",
    });
    assertEquals(
      entry?.skillContext?.usageNotes,
      "Preserve these instructions",
    );
    assertEquals(entry?.freshness, "unreviewed");
    assertEquals(entry?.governance, undefined);
    assertEquals(await repo.getSchemaVersion(), 18);
  } finally {
    repo.close();
    await Deno.remove(root, { recursive: true });
  }
});
