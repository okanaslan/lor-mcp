import { assertEquals, assertRejects } from "@std/assert";
import { join } from "@std/path";
import { SqliteCatalogRepository } from "@src/catalog/sqlite_repository.ts";
import type { VerificationMetadata } from "@src/catalog/types.ts";

const verification: VerificationMetadata = {
  verificationStatus: "verified",
  verificationSource: "test",
  verifiedAt: "2026-07-12T00:00:00.000Z",
};

Deno.test("SqliteCatalogRepository stores agents and skills by workspace", async () => {
  const dir = await Deno.makeTempDir();
  const repo = new SqliteCatalogRepository(join(dir, "catalog.db"));
  await repo.initialize();

  await repo.createAgent("workspace-a", {
    workspace: "workspace-a",
    codexSessionId: "agent-1",
    projectName: "Agentic Router",
    displayName: "Backend Agent",
    primarySpecialty: "backend api",
    specialtyTags: ["api"],
    verification,
    now: "2026-07-12T00:00:00.000Z",
  });
  await repo.createSkill("workspace-b", {
    workspace: "workspace-b",
    skillName: "backend-skill",
    projectName: "Other Project",
    displayName: "Backend Skill",
    primarySpecialty: "backend api",
    specialtyTags: ["api"],
    verification,
    now: "2026-07-12T00:00:00.000Z",
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

  repo.close();
});

Deno.test("SqliteCatalogRepository enforces workspace-local duplicates", async () => {
  const dir = await Deno.makeTempDir();
  const repo = new SqliteCatalogRepository(join(dir, "catalog.db"));
  await repo.initialize();

  const input = {
    workspace: "workspace-a",
    codexSessionId: "agent-1",
    projectName: "Agentic Router",
    displayName: "Backend Agent",
    primarySpecialty: "backend api",
    specialtyTags: ["api"],
    verification,
    now: "2026-07-12T00:00:00.000Z",
  };

  await repo.createAgent("workspace-a", input);
  await repo.createAgent("workspace-b", { ...input, workspace: "workspace-b" });

  await assertRejects(
    () => repo.createAgent("workspace-a", input),
    Error,
    "duplicate_entry",
  );

  repo.close();
});

Deno.test("SqliteCatalogRepository round-trips stored verification status", async () => {
  const dir = await Deno.makeTempDir();
  const repo = new SqliteCatalogRepository(join(dir, "catalog.db"));
  await repo.initialize();

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

  await repo.createAgent("workspace-a", {
    workspace: "workspace-a",
    codexSessionId: "agent-1",
    projectName: "Agentic Router",
    displayName: "Backend Agent",
    primarySpecialty: "backend api",
    specialtyTags: ["api"],
    verification: unverified,
    now: "2026-07-12T01:00:00.000Z",
  });
  await repo.createSkill("workspace-a", {
    workspace: "workspace-a",
    skillName: "backend-skill",
    projectName: "Agentic Router",
    displayName: "Backend Skill",
    primarySpecialty: "backend api",
    specialtyTags: ["api"],
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

  repo.close();
});

Deno.test("SqliteCatalogRepository clears agents and skills by workspace only", async () => {
  const dir = await Deno.makeTempDir();
  const repo = new SqliteCatalogRepository(join(dir, "catalog.db"));
  await repo.initialize();

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

  repo.close();
});

Deno.test("SqliteCatalogRepository clears only agents when filtered", async () => {
  const dir = await Deno.makeTempDir();
  const repo = new SqliteCatalogRepository(join(dir, "catalog.db"));
  await repo.initialize();

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

  repo.close();
});

Deno.test("SqliteCatalogRepository clears only skills when filtered", async () => {
  const dir = await Deno.makeTempDir();
  const repo = new SqliteCatalogRepository(join(dir, "catalog.db"));
  await repo.initialize();

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

  repo.close();
});

Deno.test("SqliteCatalogRepository returns zero counts for empty workspace clear", async () => {
  const dir = await Deno.makeTempDir();
  const repo = new SqliteCatalogRepository(join(dir, "catalog.db"));
  await repo.initialize();

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

  repo.close();
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
      '2026-07-12T00:00:00.000Z', NULL, '2026-07-12T00:00:00.000Z',
      '2026-07-12T00:00:00.000Z'
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

async function seedAgent(
  repo: SqliteCatalogRepository,
  workspace: string,
  codexSessionId: string,
): Promise<void> {
  await repo.createAgent(workspace, {
    workspace,
    codexSessionId,
    projectName: "Agentic Router",
    displayName: `Agent ${codexSessionId}`,
    primarySpecialty: "backend api",
    specialtyTags: ["api"],
    verification,
    now: "2026-07-12T00:00:00.000Z",
  });
}

async function seedSkill(
  repo: SqliteCatalogRepository,
  workspace: string,
  skillName: string,
): Promise<void> {
  await repo.createSkill(workspace, {
    workspace,
    skillName,
    projectName: "Agentic Router",
    displayName: `Skill ${skillName}`,
    primarySpecialty: "backend api",
    specialtyTags: ["api"],
    verification,
    now: "2026-07-12T00:00:00.000Z",
  });
}
