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

Deno.test("SqliteCatalogRepository resolves trailing slash path aliases", async () => {
  const repo = await createInitializedRepository();
  try {
    const workspace = await repo.resolveWorkspace(
      "/workspaces/LOR-MCP/",
      { now: FIXED_NOW },
    );
    const resolved = await repo.resolveWorkspace("/workspaces/LOR-MCP", {
      now: FIXED_NOW,
    });

    assertEquals(workspace, "/workspaces/LOR-MCP");
    assertEquals(resolved, "/workspaces/LOR-MCP");
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository auto-creates basename aliases for unclaimed absolute paths", async () => {
  const repo = await createInitializedRepository();
  try {
    const workspace = await repo.resolveWorkspace(
      "/workspaces/LOR-MCP",
      { now: FIXED_NOW },
    );
    const alias = await repo.resolveWorkspace("LOR-MCP", { now: FIXED_NOW });

    assertEquals(workspace, "/workspaces/LOR-MCP");
    assertEquals(alias, "/workspaces/LOR-MCP");
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository backfills aliases for existing workspace rows", async () => {
  const dir = await Deno.makeTempDir();
  const dbPath = join(dir, "catalog.db");
  const firstRepo = new SqliteCatalogRepository(dbPath);
  await firstRepo.initialize();
  try {
    await seedAgent(firstRepo, "/workspaces/LOR-MCP", "agent-1");
  } finally {
    firstRepo.close();
  }

  const secondRepo = new SqliteCatalogRepository(dbPath);
  await secondRepo.initialize();
  try {
    const workspace = await secondRepo.resolveWorkspace("LOR-MCP", {
      now: FIXED_NOW,
    });
    const entries = await secondRepo.listEntries(workspace, { workspace });

    assertEquals(workspace, "/workspaces/LOR-MCP");
    assertEquals(entries.map((entry) => entry.entryKey), ["agent-1"]);
  } finally {
    secondRepo.close();
  }
});

Deno.test("SqliteCatalogRepository does not auto-reassign claimed basename aliases", async () => {
  const repo = await createInitializedRepository();
  try {
    await repo.resolveWorkspace("/workspaces/one/LOR-MCP", { now: FIXED_NOW });
    await repo.resolveWorkspace("/workspaces/two/LOR-MCP", { now: FIXED_NOW });

    const alias = await repo.resolveWorkspace("LOR-MCP", { now: FIXED_NOW });

    assertEquals(alias, "/workspaces/one/LOR-MCP");
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository does not auto-claim a basename used as a slug workspace", async () => {
  const repo = await createInitializedRepository();
  try {
    const slug = await repo.resolveWorkspace("LOR-MCP", { now: FIXED_NOW });
    const path = await repo.resolveWorkspace("/workspaces/LOR-MCP", {
      now: FIXED_NOW,
    });
    const alias = await repo.resolveWorkspace("LOR-MCP", { now: FIXED_NOW });

    assertEquals(slug, "LOR-MCP");
    assertEquals(path, "/workspaces/LOR-MCP");
    assertEquals(alias, "LOR-MCP");
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository registers workspace aliases for entry reads", async () => {
  const repo = await createInitializedRepository();
  try {
    const result = await repo.registerWorkspaceAlias({
      workspace: "/workspaces/LOR-MCP",
      alias: "LOR-MCP",
      now: FIXED_NOW,
    });
    const workspace = await repo.resolveWorkspace("LOR-MCP", {
      now: FIXED_NOW,
    });
    await seedAgent(repo, workspace, "agent-1");
    const entries = await repo.listEntries(workspace, { workspace });

    assertEquals(result, {
      workspace: "/workspaces/LOR-MCP",
      alias: "LOR-MCP",
      created: true,
      reassigned: false,
    });
    assertEquals(entries.map((entry) => entry.entryKey), ["agent-1"]);
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository requires confirmation to reassign aliases", async () => {
  const repo = await createInitializedRepository();
  try {
    await repo.registerWorkspaceAlias({
      workspace: "/workspaces/one/LOR-MCP",
      alias: "LOR-MCP",
      now: FIXED_NOW,
    });
    await assertRejects(
      () =>
        repo.registerWorkspaceAlias({
          workspace: "/workspaces/two/LOR-MCP",
          alias: "LOR-MCP",
          now: FIXED_NOW,
        }),
      Error,
      "alias already exists",
    );
    const reassigned = await repo.registerWorkspaceAlias({
      workspace: "/workspaces/two/LOR-MCP",
      alias: "LOR-MCP",
      confirm: true,
      now: FIXED_NOW,
    });

    assertEquals(reassigned, {
      workspace: "/workspaces/two/LOR-MCP",
      alias: "LOR-MCP",
      created: false,
      reassigned: true,
    });
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

Deno.test("SqliteCatalogRepository round-trips skill context", async () => {
  const repo = await createInitializedRepository();
  try {
    await seedSkill(repo, "workspace-a", "backend-skill", {
      skillContext: {
        whenToUse: "Use for backend routing work.",
        usageNotes: "Prefer focused API changes.",
        constraints: ["Do not edit local skill files."],
        examplePrompts: ["Improve MCP tool validation."],
      },
    });

    const skill = await repo.getEntry("workspace-a", {
      workspace: "workspace-a",
      entryType: "skill",
      entryKey: "backend-skill",
    });

    if (skill?.entryType !== "skill") {
      throw new Error("Expected skill.");
    }
    assertEquals(skill.skillContext, {
      whenToUse: "Use for backend routing work.",
      usageNotes: "Prefer focused API changes.",
      constraints: ["Do not edit local skill files."],
      examplePrompts: ["Improve MCP tool validation."],
    });
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository persists skill update proposals across restarts", async () => {
  const dir = await Deno.makeTempDir();
  const dbPath = join(dir, "catalog.db");
  const firstRepo = new SqliteCatalogRepository(dbPath);
  await firstRepo.initialize();
  try {
    await seedSkill(firstRepo, "workspace-a", "backend-skill");
    await firstRepo.createSkillUpdateProposal({
      proposalId: "proposal-1",
      workspace: "workspace-a",
      skillName: "backend-skill",
      reason: "Add routing guidance.",
      proposedSkillContext: {
        whenToUse: "Use for backend API work.",
      },
      proposedMetadata: {
        specialtyTags: ["backend", "api"],
      },
      status: "pending",
      createdAt: FIXED_NOW,
    });
  } finally {
    firstRepo.close();
  }

  const secondRepo = new SqliteCatalogRepository(dbPath);
  await secondRepo.initialize();
  try {
    const proposal = await secondRepo.getSkillUpdateProposal(
      "workspace-a",
      "proposal-1",
    );

    assertEquals(proposal?.status, "pending");
    assertEquals(
      proposal?.proposedSkillContext?.whenToUse,
      "Use for backend API work.",
    );
    assertEquals(proposal?.proposedMetadata?.specialtyTags, ["backend", "api"]);
  } finally {
    secondRepo.close();
  }
});

Deno.test("SqliteCatalogRepository applies skill update proposals", async () => {
  const repo = await createInitializedRepository();
  try {
    await seedSkill(repo, "workspace-a", "backend-skill");
    await repo.createSkillUpdateProposal({
      proposalId: "proposal-1",
      workspace: "workspace-a",
      skillName: "backend-skill",
      reason: "Add routing guidance.",
      proposedSkillContext: {
        usageNotes: "Use after checking existing catalog entries.",
      },
      status: "pending",
      createdAt: FIXED_NOW,
    });

    const applied = await repo.applySkillUpdateProposal(
      "workspace-a",
      "proposal-1",
      {
        appliedAt: "2026-07-12T01:00:00.000Z",
        entry: {
          workspace: "workspace-a",
          entryType: "skill",
          entryKey: "backend-skill",
          skillName: "backend-skill",
          projectName: "Local Orchestration Router (LOR)",
          displayName: "Backend Skill",
          primarySpecialty: "backend api",
          specialtyTags: ["backend", "api"],
          skillContext: {
            usageNotes: "Use after checking existing catalog entries.",
          },
          verificationStatus: "verified",
          verificationSource: "test",
          verifiedAt: FIXED_NOW,
          createdAt: FIXED_NOW,
          updatedAt: "2026-07-12T01:00:00.000Z",
        },
      },
    );
    const skill = await repo.getEntry("workspace-a", {
      workspace: "workspace-a",
      entryType: "skill",
      entryKey: "backend-skill",
    });
    const secondApply = await repo.applySkillUpdateProposal(
      "workspace-a",
      "proposal-1",
      {
        appliedAt: "2026-07-12T02:00:00.000Z",
        entry: skill as never,
      },
    );

    assertEquals(applied?.status, "applied");
    assertEquals(applied?.appliedAt, "2026-07-12T01:00:00.000Z");
    if (skill?.entryType !== "skill") {
      throw new Error("Expected skill.");
    }
    assertEquals(skill.specialtyTags, ["backend", "api"]);
    assertEquals(
      skill.skillContext?.usageNotes,
      "Use after checking existing catalog entries.",
    );
    assertEquals(secondApply, undefined);
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository migrates existing skills to skill context schema", async () => {
  const dir = await Deno.makeTempDir();
  const dbPath = join(dir, "catalog.db");
  const { Database } = await import("@db/sqlite");
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE schema_migrations (
      version INTEGER PRIMARY KEY,
      appliedAt TEXT NOT NULL
    );
    CREATE TABLE workspace_aliases (
      alias TEXT PRIMARY KEY,
      canonicalWorkspace TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE introduced_agents (
      workspace TEXT NOT NULL,
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
      PRIMARY KEY (workspace, codexSessionId)
    );
    CREATE TABLE introduced_skills (
      workspace TEXT NOT NULL,
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
      PRIMARY KEY (workspace, skillName)
    );
    INSERT INTO introduced_skills (
      workspace, skillName, projectName, displayName, primarySpecialty,
      specialtyTags, verificationStatus, verificationSource, verifiedAt,
      verificationMessage, createdAt, updatedAt
    ) VALUES (
      'workspace-a', 'backend-skill', 'Local Orchestration Router (LOR)',
      'Backend Skill', 'backend api', '["api"]', 'verified', 'test',
      '${FIXED_NOW}', NULL, '${FIXED_NOW}', '${FIXED_NOW}'
    );
  `);
  db.close();

  const migrated = new SqliteCatalogRepository(dbPath);
  await migrated.initialize();
  try {
    const skill = await migrated.getEntry("workspace-a", {
      workspace: "workspace-a",
      entryType: "skill",
      entryKey: "backend-skill",
    });

    assertEquals(skill?.entryKey, "backend-skill");
  } finally {
    migrated.close();
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

Deno.test("SqliteCatalogRepository updates entries by workspace only", async () => {
  const repo = await createInitializedRepository();
  try {
    await seedAgent(repo, "workspace-a", "agent-1", {
      displayName: "Backend Agent",
    });
    await seedAgent(repo, "workspace-b", "agent-1", {
      displayName: "Other Agent",
    });

    const updated = await repo.updateEntry("workspace-a", {
      workspace: "workspace-a",
      entryType: "agent",
      entryKey: "agent-1",
      displayName: "Updated Backend Agent",
      primarySpecialty: "deno backend",
      specialtyTags: ["deno", "mcp"],
      now: "2026-07-12T01:00:00.000Z",
    });
    const otherWorkspace = await repo.getEntry("workspace-b", {
      workspace: "workspace-b",
      entryType: "agent",
      entryKey: "agent-1",
    });

    assertEquals(updated?.displayName, "Updated Backend Agent");
    assertEquals(updated?.primarySpecialty, "deno backend");
    assertEquals(updated?.specialtyTags, ["deno", "mcp"]);
    assertEquals(updated?.createdAt, FIXED_NOW);
    assertEquals(updated?.updatedAt, "2026-07-12T01:00:00.000Z");
    assertEquals(otherWorkspace?.displayName, "Other Agent");
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository removes entries by workspace only", async () => {
  const repo = await createInitializedRepository();
  try {
    await seedSkill(repo, "workspace-a", "backend-skill");
    await seedSkill(repo, "workspace-b", "backend-skill");

    const removed = await repo.removeEntry("workspace-a", {
      workspace: "workspace-a",
      entryType: "skill",
      entryKey: "backend-skill",
    });
    const workspaceAEntries = await repo.listEntries("workspace-a", {
      workspace: "workspace-a",
    });
    const workspaceBEntries = await repo.listEntries("workspace-b", {
      workspace: "workspace-b",
    });

    assertEquals(removed, true);
    assertEquals(workspaceAEntries, []);
    assertEquals(workspaceBEntries.map((entry) => entry.entryKey), [
      "backend-skill",
    ]);
  } finally {
    repo.close();
  }
});

Deno.test("SqliteCatalogRepository reports missing update and remove targets", async () => {
  const repo = await createInitializedRepository();
  try {
    const updated = await repo.updateEntry("workspace-a", {
      workspace: "workspace-a",
      entryType: "agent",
      entryKey: "missing-agent",
      displayName: "Missing Agent",
      now: "2026-07-12T01:00:00.000Z",
    });
    const removed = await repo.removeEntry("workspace-a", {
      workspace: "workspace-a",
      entryType: "agent",
      entryKey: "missing-agent",
    });

    assertEquals(updated, undefined);
    assertEquals(removed, false);
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
      'LOR-MCP', 'agent-1', 'Local Orchestration Router (LOR)', 'Backend Agent',
      'backend api', '["api"]', NULL, 'verified', 'test',
      '${FIXED_NOW}', NULL, '${FIXED_NOW}', '${FIXED_NOW}'
    );
  `);
  db.close();

  const repo = new SqliteCatalogRepository(dbPath);
  await repo.initialize();

  const entries = await repo.listEntries("LOR-MCP", {
    workspace: "LOR-MCP",
  });

  assertEquals(entries.map((entry) => entry.workspace), ["LOR-MCP"]);
  assertEquals(entries.map((entry) => entry.entryKey), ["agent-1"]);

  repo.close();
});
