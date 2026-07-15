import { assertEquals, assertRejects } from "@std/assert";
import { join } from "@std/path";
import { SqliteCatalogRepository } from "@src/catalog/sqlite_repository.ts";
import type { VerificationMetadata } from "@src/catalog/types.ts";
import {
  createInitializedRepository,
  FIXED_NOW,
  seedAgent,
  seedSkill,
} from "@test/helpers/catalog_fixtures.ts";

Deno.test("SqliteCatalogRepository stores agents and skills by workspace", async () => {
  const repo = await createInitializedRepository();
  try {
    await seedAgent(repo, "workspace-a", "agent-1", {
      displayName: "Backend Agent",
    });
    await seedSkill(repo, "workspace-b", "backend-skill", {
      projectName: "Other Project",
      displayName: "Backend Skill",
    });

    const workspaceAEntries = await repo.listEntries("workspace-a", {
      workspace: "workspace-a",
    });
    const workspaceBEntries = await repo.listEntries("workspace-b", {
      workspace: "workspace-b",
    });

    assertEquals(workspaceAEntries.map((entry) => entry.entryKey), ["agent-1"]);
    assertEquals(workspaceBEntries.map((entry) => entry.entryKey), [
      "backend-skill",
    ]);
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository enforces workspace-local duplicates", async () => {
  const repo = await createInitializedRepository();
  try {
    await seedAgent(repo, "workspace-a", "agent-1");
    await seedAgent(repo, "workspace-b", "agent-1");

    await assertRejects(
      () => seedAgent(repo, "workspace-a", "agent-1"),
      Error,
      "duplicate_entry",
    );
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository round-trips stored verification status", async () => {
  const repo = await createInitializedRepository();
  try {
    const unverified: VerificationMetadata = {
      verificationStatus: "unverified",
      verificationSource: "health_check",
      verifiedAt: "2026-07-12T01:00:00.000Z",
      verificationMessage: "Agent session was not found during health check.",
    };
    const unknown: VerificationMetadata = {
      verificationStatus: "unknown",
      verificationSource: "health_check",
      verifiedAt: "2026-07-12T02:00:00.000Z",
      verificationMessage: "Skill health source was unavailable.",
    };

    await seedAgent(repo, "workspace-a", "agent-1", {
      displayName: "Backend Agent",
      verification: unverified,
      now: "2026-07-12T01:00:00.000Z",
    });
    await seedSkill(repo, "workspace-a", "backend-skill", {
      displayName: "Backend Skill",
      verification: unknown,
      now: "2026-07-12T02:00:00.000Z",
    });

    const agent = await repo.getEntry("workspace-a", {
      workspace: "workspace-a",
      entryType: "agent",
      entryKey: "agent-1",
    });
    const skill = await repo.getEntry("workspace-a", {
      workspace: "workspace-a",
      entryType: "skill",
      entryKey: "backend-skill",
    });

    assertEquals(agent?.verificationStatus, "unverified");
    assertEquals(agent?.verificationSource, "health_check");
    assertEquals(
      agent?.verificationMessage,
      "Agent session was not found during health check.",
    );
    assertEquals(skill?.verificationStatus, "unknown");
    assertEquals(skill?.verificationSource, "health_check");
    assertEquals(
      skill?.verificationMessage,
      "Skill health source was unavailable.",
    );
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository clears agents and skills by workspace only", async () => {
  const repo = await createInitializedRepository();
  try {
    await seedAgent(repo, "workspace-a", "agent-a");
    await seedSkill(repo, "workspace-a", "skill-a");
    await seedAgent(repo, "workspace-b", "agent-b");
    await seedSkill(repo, "workspace-b", "skill-b");

    const result = await repo.clearEntries("workspace-a", {
      workspace: "workspace-a",
      confirm: true,
    });
    const workspaceAEntries = await repo.listEntries("workspace-a", {
      workspace: "workspace-a",
    });
    const workspaceBEntries = await repo.listEntries("workspace-b", {
      workspace: "workspace-b",
    });

    assertEquals(result, {
      workspace: "workspace-a",
      entryType: undefined,
      deletedAgents: 1,
      deletedSkills: 1,
      deletedTotal: 2,
    });
    assertEquals(workspaceAEntries, []);
    assertEquals(workspaceBEntries.map((entry) => entry.entryKey), [
      "agent-b",
      "skill-b",
    ]);
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository clears only agents when filtered", async () => {
  const repo = await createInitializedRepository();
  try {
    await seedAgent(repo, "workspace-a", "agent-a");
    await seedSkill(repo, "workspace-a", "skill-a");

    const result = await repo.clearEntries("workspace-a", {
      workspace: "workspace-a",
      confirm: true,
      entryType: "agent",
    });
    const entries = await repo.listEntries("workspace-a", {
      workspace: "workspace-a",
    });

    assertEquals(result, {
      workspace: "workspace-a",
      entryType: "agent",
      deletedAgents: 1,
      deletedSkills: 0,
      deletedTotal: 1,
    });
    assertEquals(entries.map((entry) => entry.entryKey), ["skill-a"]);
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository clears only skills when filtered", async () => {
  const repo = await createInitializedRepository();
  try {
    await seedAgent(repo, "workspace-a", "agent-a");
    await seedSkill(repo, "workspace-a", "skill-a");

    const result = await repo.clearEntries("workspace-a", {
      workspace: "workspace-a",
      confirm: true,
      entryType: "skill",
    });
    const entries = await repo.listEntries("workspace-a", {
      workspace: "workspace-a",
    });

    assertEquals(result, {
      workspace: "workspace-a",
      entryType: "skill",
      deletedAgents: 0,
      deletedSkills: 1,
      deletedTotal: 1,
    });
    assertEquals(entries.map((entry) => entry.entryKey), ["agent-a"]);
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository returns zero counts for empty workspace clear", async () => {
  const repo = await createInitializedRepository();
  try {
    const result = await repo.clearEntries("workspace-a", {
      workspace: "workspace-a",
      confirm: true,
    });

    assertEquals(result, {
      workspace: "workspace-a",
      entryType: undefined,
      deletedAgents: 0,
      deletedSkills: 0,
      deletedTotal: 0,
    });
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository migrates legacy catalogNamespace columns", async () => {
  const dir = await Deno.makeTempDir();
  const dbPath = join(dir, "catalog.db");
  const { Database } = await import("@db/sqlite");
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE schema_migrations (
      version INTEGER PRIMARY KEY,
      appliedAt TEXT NOT NULL
    );
    INSERT INTO schema_migrations(version, appliedAt)
    VALUES (1, '2026-07-12T00:00:00.000Z');
    CREATE TABLE introduced_agents (
      catalogNamespace TEXT NOT NULL,
      codexSessionId TEXT NOT NULL,
      projectName TEXT NOT NULL,
      displayName TEXT NOT NULL,
      primarySpecialty TEXT NOT NULL,
      specialtyTags TEXT NOT NULL,
      handoff TEXT,
      verificationStatus TEXT NOT NULL,
      verificationSource TEXT NOT NULL,
      verifiedAt TEXT NOT NULL,
      verificationMessage TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      PRIMARY KEY (catalogNamespace, codexSessionId)
    );
    CREATE TABLE introduced_skills (
      catalogNamespace TEXT NOT NULL,
      skillName TEXT NOT NULL,
      projectName TEXT NOT NULL,
      displayName TEXT NOT NULL,
      primarySpecialty TEXT NOT NULL,
      specialtyTags TEXT NOT NULL,
      verificationStatus TEXT NOT NULL,
      verificationSource TEXT NOT NULL,
      verifiedAt TEXT NOT NULL,
      verificationMessage TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      PRIMARY KEY (catalogNamespace, skillName)
    );
    INSERT INTO introduced_agents (
      catalogNamespace, codexSessionId, projectName, displayName,
      primarySpecialty, specialtyTags, handoff, verificationStatus,
      verificationSource, verifiedAt, verificationMessage, createdAt, updatedAt
    ) VALUES (
      'Agentic-Router', 'agent-1', 'Agentic Router', 'Backend Agent',
      'backend api', '["api"]', NULL, 'verified', 'test',
      '${FIXED_NOW}', NULL, '${FIXED_NOW}', '${FIXED_NOW}'
    );
  `);
  db.close();

  const repo = new SqliteCatalogRepository(dbPath);
  await repo.initialize();

  const entries = await repo.listEntries("Agentic-Router", {
    workspace: "Agentic-Router",
  });

  assertEquals(entries.map((entry) => entry.workspace), ["Agentic-Router"]);
  assertEquals(entries.map((entry) => entry.entryKey), ["agent-1"]);

  repo.close();
});
