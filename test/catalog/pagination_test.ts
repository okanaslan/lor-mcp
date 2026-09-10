import {
  assert,
  assertEquals,
  assertExists,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { Database } from "@db/sqlite";
import { join } from "@std/path";
import { SqliteCatalogRepository } from "@src/catalog/sqlite_repository.ts";
import { CatalogService } from "@src/catalog/service.ts";
import { paginationState } from "@src/catalog/pagination.ts";
import {
  FIXED_NOW,
  seedAgent,
  seedSkill,
  seedSubagent,
} from "@test/helpers/catalog_fixtures.ts";

Deno.test("SQL pages filter scopes and projects, export all entry kinds, and reject stale or cross-filter cursors", async () => {
  const root = await Deno.makeTempDir();
  const path = join(root, "catalog.db");
  let repo = new SqliteCatalogRepository(path);
  await repo.initialize();
  let service = new CatalogService({ repository: repo, now: () => FIXED_NOW });
  const filter = {
    workspace: "w",
    scope: "workspace" as const,
    entryType: "skill" as const,
  };
  try {
    for (let i = 0; i < 7; i++) await seedSkill(repo, "w", "skill-" + i);
    await seedSkill(repo, "other", "invisible");
    await seedSubagent(repo, "w", "subagent");
    await seedAgent(repo, "w", "agent");
    await service.introduceSkill({
      workspace: "w",
      scope: "global",
      skillName: "skill-0",
      projectName: "global-project",
      displayName: "Global",
      primarySpecialty: "api",
      specialtyTags: ["api"],
    });
    const first = await service.listCatalogPage(filter, { limit: 2 });
    assertEquals(first.total, 7);
    assertEquals(first.items.length, 2);
    assertExists(first.nextCursor);
    const seen = first.items.map((entry) => entry.entryKey);
    let cursor: string | undefined = first.nextCursor;
    // Reopening does not invalidate cursors; usage accounting does not either.
    repo.close();
    repo = new SqliteCatalogRepository(path);
    await repo.initialize();
    service = new CatalogService({ repository: repo, now: () => FIXED_NOW });
    while (cursor) {
      const page = await service.listCatalogPage(filter, { limit: 2, cursor });
      seen.push(...page.items.map((entry) => entry.entryKey));
      cursor = page.nextCursor;
    }
    assertEquals(seen.length, 7);
    assertEquals(new Set(seen).size, 7);
    assertEquals(
      (await service.listCatalogPage({ ...filter, scope: "global" }, {})).total,
      1,
    );
    assertEquals(
      (await service.listCatalogPage({ ...filter, scope: undefined }, {}))
        .total,
      8,
    );
    assertEquals(
      (await service.listCatalogPage({ ...filter, projectName: "missing" }, {}))
        .total,
      0,
    );
    for (
      const changed of [{ ...filter, workspace: "other" }, {
        ...filter,
        scope: "global" as const,
      }]
    ) {
      await assertRejects(
        () =>
          service.listCatalogPage(changed, {
            limit: 2,
            cursor: first.nextCursor,
          }),
        Error,
        "invalid_cursor",
      );
    }
    await assertRejects(
      () =>
        service.listCatalogPage(filter, { limit: 3, cursor: first.nextCursor }),
      Error,
      "invalid_cursor",
    );
    let exported = await service.exportCatalogPage({ workspace: "w" }, {
      limit: 2,
    });
    const exportedKinds = exported.entries.map((entry) => entry.entryType);
    while (exported.nextCursor) {
      exported = await service.exportCatalogPage({ workspace: "w" }, {
        limit: 2,
        cursor: exported.nextCursor,
      });
      exportedKinds.push(...exported.entries.map((entry) => entry.entryType));
    }
    assertEquals(exportedKinds.length, 9);
    assert(
      exportedKinds.includes("agent") && exportedKinds.includes("skill") &&
        exportedKinds.includes("subagent"),
    );
    const entry = first.items[0];
    await service.updateSkill({
      workspace: "w",
      scope: "workspace",
      skillName: entry.entryKey,
      displayName: "Updated at the same timestamp",
      expectedRevision: entry.revision,
    });
    await assertRejects(
      () =>
        service.listCatalogPage(filter, { limit: 2, cursor: first.nextCursor }),
      Error,
      "invalid_cursor",
    );
    const fresh = await service.listCatalogPage(filter, { limit: 2 });
    await service.removeSkill({
      workspace: "w",
      scope: "workspace",
      skillName: fresh.items[0].entryKey,
      expectedRevision: fresh.items[0].revision,
    });
    await assertRejects(
      () =>
        service.listCatalogPage(filter, { limit: 2, cursor: fresh.nextCursor }),
      Error,
      "invalid_cursor",
    );
  } finally {
    repo.close();
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("SQL paging never decodes unselected payloads and filters note tags without loading bodies", async () => {
  const root = await Deno.makeTempDir();
  const path = join(root, "catalog.db");
  const repo = new SqliteCatalogRepository(path);
  await repo.initialize();
  const service = new CatalogService({ repository: repo });
  try {
    await seedSkill(repo, "w", "selected");
    await seedSkill(repo, "w", "unread");
    const db = new Database(path);
    try {
      db.exec(
        "UPDATE introduced_skills SET skillContext = 'invalid-json' WHERE skillName = 'unread'",
      );
    } finally {
      db.close();
    }
    const page = await repo.listEntryPage("w", {
      workspace: "w",
      entryType: "skill",
      scope: "workspace",
    }, { limit: 1 });
    assertEquals(page.items[0].entryKey, "selected");
    assertEquals(page.total, 2);
    for (const tags of [["a", "b"], ["a"], ["b"], ["a", "b"]]) {
      await service.rememberWorkspaceNote({
        workspace: "w",
        title: tags.join(),
        body: "not returned",
        tags,
      });
    }
    const notes = await service.listWorkspaceNotePage({
      workspace: "w",
      tags: ["a", "b"],
      limit: 1,
    });
    assertEquals(notes.total, 2);
    assertEquals("body" in notes.notes[0], false);
    assertExists(notes.nextCursor);
    const next = await service.listWorkspaceNotePage({
      workspace: "w",
      tags: ["a", "b"],
      limit: 1,
      cursor: notes.nextCursor,
    });
    assertEquals(next.notes.length, 1);
    assertEquals(next.nextCursor, undefined);
    assertEquals(
      (await service.listWorkspaceNotePage({
        workspace: "w",
        tags: ["' OR 1=1 --"],
      })).total,
      0,
    );
    await service.rememberWorkspaceNote({
      workspace: "w",
      title: "new",
      body: "new",
    });
    await assertRejects(
      () =>
        service.listWorkspaceNotePage({
          workspace: "w",
          tags: ["a", "b"],
          limit: 1,
          cursor: notes.nextCursor,
        }),
      Error,
      "invalid_cursor",
    );
  } finally {
    repo.close();
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("SQL page inputs reject invalid limits and malformed cursor tokens", () => {
  for (const limit of [0, 101, 1.5, NaN]) {
    assertThrows(() => paginationState({ limit }, {}, "generation"));
  }
  for (const cursor of ["!", "x".repeat(513), btoa("{}")]) {
    assertThrows(() => paginationState({ cursor }, {}, "generation"));
  }
});
