import { assert, assertEquals, assertRejects } from "@std/assert";
import { join } from "@std/path";
import {
  createCatalogService,
  FIXED_NOW,
} from "@test/helpers/catalog_fixtures.ts";

Deno.test("CatalogService introduces agents without registry pre-registration", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const created = await service.introduceAgent({
      workspace: "LOR-MCP",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
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

    const detail = await service.getEntryDetail({
      workspace: "LOR-MCP",
      entryType: "agent",
      entryKey: "agent-1",
    });

    assertEquals(created.verificationStatus, "verified");
    assertEquals(created.verificationSource, "mcp_introduction");
    if (detail?.entryType !== "agent") {
      throw new Error("Expected agent detail.");
    }
    assertEquals(detail.handoff?.whenToUse, "Backend API changes");
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService defaults introduced agents to unknown manual reachability", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const created = await service.introduceAgent({
      workspace: "LOR-MCP",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const entries = await service.listEntries({ workspace: "LOR-MCP" });

    if (created.entryType !== "agent" || entries[0]?.entryType !== "agent") {
      throw new Error("Expected agent entries.");
    }
    assertEquals(created.reachability, {
      reachabilityStatus: "unknown",
      dispatchMode: "manual",
    });
    assertEquals(entries[0].reachability, {
      reachabilityStatus: "unknown",
      dispatchMode: "manual",
    });
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService records internal compatibility agent dispatch outcomes by workspace", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "LOR-MCP",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await service.introduceAgent({
      workspace: "Other-Project",
      codexSessionId: "agent-1",
      projectName: "Other Project",
      displayName: "Other Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    await service.recordAgentDispatchSuccess({
      workspace: "LOR-MCP",
      agentEntryKey: "agent-1",
      dispatchedAt: "2026-07-12T00:01:00.000Z",
    });

    const updated = await service.getEntryDetail({
      workspace: "LOR-MCP",
      entryType: "agent",
      entryKey: "agent-1",
    });
    const other = await service.getEntryDetail({
      workspace: "Other-Project",
      entryType: "agent",
      entryKey: "agent-1",
    });

    if (updated?.entryType !== "agent" || other?.entryType !== "agent") {
      throw new Error("Expected agent detail.");
    }
    assertEquals(updated.reachability, {
      reachabilityStatus: "reachable",
      dispatchMode: "codex_thread",
      lastReachabilityCheckAt: "2026-07-12T00:01:00.000Z",
      lastDispatchAt: "2026-07-12T00:01:00.000Z",
    });
    assertEquals(other.reachability, {
      reachabilityStatus: "unknown",
      dispatchMode: "manual",
    });
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService introduces skills globally by default without skill root pre-registration", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const created = await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "missing-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Missing Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const entries = await service.listEntries({ workspace: "Other-Workspace" });
    assertEquals(created.verificationStatus, "verified");
    assertEquals(created.verificationSource, "mcp_introduction");
    if (created.entryType === "skill") {
      assertEquals(created.scope, "global");
    }
    assertEquals(entries.map((entry) => entry.entryKey), ["missing-skill"]);
    if (entries[0]?.entryType === "skill") {
      assertEquals(entries[0].scope, "global");
    }
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService introduces global skills and lists them from any workspace", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const created = await service.introduceSkill({
      workspace: "LOR-MCP",
      scope: "global",
      skillName: "backend-skill",
      projectName: "Global Backend",
      displayName: "Global Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const entries = await service.listEntries({ workspace: "Other-Project" });
    const match = await service.findMatchingEntries({
      workspace: "Other-Project",
      task: "backend api change",
      preferredType: "skill",
    });

    assertEquals(created.entryType, "skill");
    if (created.entryType === "skill") {
      assertEquals(created.scope, "global");
    }
    assertEquals(entries.map((entry) => entry.entryKey), ["backend-skill"]);
    assertEquals(entries[0]?.entryType, "skill");
    if (entries[0]?.entryType === "skill") {
      assertEquals(entries[0].scope, "global");
    }
    assertEquals(match.status, "ok");
    assertEquals(match.data.skills[0]?.entryKey, "backend-skill");
    assertEquals(match.data.skills[0]?.scope, "global");
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService allows workspace and global skills with the same name", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      scope: "workspace",
      skillName: "backend-skill",
      projectName: "Workspace Backend",
      displayName: "Workspace Backend Skill",
      primarySpecialty: "workspace backend api",
      specialtyTags: ["workspace"],
    });
    await service.introduceSkill({
      workspace: "LOR-MCP",
      scope: "global",
      skillName: "backend-skill",
      projectName: "Global Backend",
      displayName: "Global Backend Skill",
      primarySpecialty: "global backend api",
      specialtyTags: ["global"],
    });

    const entries = await service.listEntries({
      workspace: "LOR-MCP",
      entryType: "skill",
    });
    const globalDetail = await service.getEntryDetail({
      workspace: "LOR-MCP",
      entryType: "skill",
      entryKey: "backend-skill",
      scope: "global",
    });

    assertEquals(
      entries.map((entry) =>
        entry.entryType === "skill" ? `${entry.scope}:${entry.entryKey}` : ""
      ).sort(),
      ["global:backend-skill", "workspace:backend-skill"],
    );
    assertEquals(globalDetail?.entryType, "skill");
    if (globalDetail?.entryType === "skill") {
      assertEquals(globalDetail.scope, "global");
      assertEquals(globalDetail.displayName, "Global Backend Skill");
    }
    await assertRejects(
      () =>
        service.getEntryDetail({
          workspace: "LOR-MCP",
          entryType: "skill",
          entryKey: "backend-skill",
        }),
      Error,
      "scope is required",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService introduces subagents globally by default with rendered prompts and metadata references", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const created = await service.introduceSubagent({
      workspace: "LOR-MCP",
      name: "api-test-subagent",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "API Test Subagent",
      purpose: "Write focused backend API tests.",
      limitedScope: "Only inspect API handlers and related tests.",
      primarySpecialty: "backend api testing",
      specialtyTags: ["backend", "api", "tests"],
      agentReferences: [{
        entryType: "agent",
        name: "Backend Agent",
        entryKey: "missing-agent",
        required: true,
      }],
      skillReferences: [{
        entryType: "skill",
        name: "okan-code-review",
        scope: "global",
      }],
      promptTemplate:
        "You are {displayName}. Purpose: {purpose}. Project: {projectName}.",
      constraints: ["Do not edit unrelated files."],
      expectedOutput: "A concise test summary.",
    });
    const detail = await service.getEntryDetail({
      workspace: "Other-Workspace",
      entryType: "subagent",
      entryKey: "api-test-subagent",
    });

    assertEquals(created.entryType, "subagent");
    if (created.entryType === "subagent") {
      assertEquals(created.scope, "global");
      assertEquals(created.prompt.includes("API Test Subagent"), true);
      assertEquals(created.prompt.includes("{missing}"), false);
      assertEquals(created.agentReferences[0]?.entryKey, "missing-agent");
      assertEquals(created.unresolvedReferences, []);
    }
    assertEquals(detail?.entryType, "subagent");
    if (detail?.entryType === "subagent") {
      assertEquals(
        detail.prompt.includes("Write focused backend API tests."),
        true,
      );
    }
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService lists global subagents and requires scope for ambiguous detail", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSubagent({
      workspace: "LOR-MCP",
      scope: "workspace",
      name: "review-subagent",
      projectName: "Workspace Project",
      displayName: "Workspace Review Subagent",
      purpose: "Review workspace code changes.",
      limitedScope: "Only review files in the current workspace.",
      primarySpecialty: "code review",
      specialtyTags: ["review"],
    });
    await service.introduceSubagent({
      workspace: "LOR-MCP",
      scope: "global",
      name: "review-subagent",
      projectName: "Global Review",
      displayName: "Global Review Subagent",
      purpose: "Review general code changes.",
      limitedScope: "Only review provided diffs.",
      primarySpecialty: "code review",
      specialtyTags: ["review", "global"],
    });

    const otherWorkspaceEntries = await service.listEntries({
      workspace: "Other-Workspace",
      entryType: "subagent",
    });
    const globalDetail = await service.getEntryDetail({
      workspace: "LOR-MCP",
      entryType: "subagent",
      entryKey: "review-subagent",
      scope: "global",
    });

    assertEquals(otherWorkspaceEntries.map((entry) => entry.entryKey), [
      "review-subagent",
    ]);
    assertEquals(globalDetail?.entryType, "subagent");
    if (globalDetail?.entryType === "subagent") {
      assertEquals(globalDetail.scope, "global");
      assertEquals(globalDetail.displayName, "Global Review Subagent");
    }
    await assertRejects(
      () =>
        service.getEntryDetail({
          workspace: "LOR-MCP",
          entryType: "subagent",
          entryKey: "review-subagent",
        }),
      Error,
      "scope is required",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService promotes workspace skills to global without removing source", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      scope: "workspace",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
      skillContext: {
        whenToUse: "Use for backend MCP changes.",
      },
    });

    const result = await service.promoteSkillToGlobal({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
    });
    const entries = await service.listEntries({
      workspace: "LOR-MCP",
      entryType: "skill",
    });

    assertEquals(result.workspace, "LOR-MCP");
    assertEquals(result.sourceSkill.scope, "workspace");
    assertEquals(result.globalSkill.scope, "global");
    assertEquals(
      result.globalSkill.skillContext?.whenToUse,
      "Use for backend MCP changes.",
    );
    assertEquals(entries.length, 2);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService keeps export sync and clear workspace-local for global skills", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "Source",
      scope: "workspace",
      skillName: "workspace-skill",
      projectName: "Source Project",
      displayName: "Workspace Skill",
      primarySpecialty: "workspace backend",
      specialtyTags: ["workspace"],
    });
    await service.introduceSkill({
      workspace: "Source",
      scope: "global",
      skillName: "global-skill",
      projectName: "Global Project",
      displayName: "Global Skill",
      primarySpecialty: "global backend",
      specialtyTags: ["global"],
    });

    const exported = await service.exportCatalog({
      workspace: "Source",
      entryType: "skill",
    });
    const preview = await service.previewWorkspaceCatalogSync({
      sourceWorkspace: "Source",
      targetWorkspace: "Target",
    });
    const cleared = await service.clearWorkspaceCatalog({
      workspace: "Source",
      entryType: "skill",
      confirm: true,
    });
    const sourceEntries = await service.listEntries({
      workspace: "Source",
      entryType: "skill",
    });

    assertEquals(
      exported.entries.map((entry) =>
        entry.entryType === "skill" ? entry.skillName : ""
      ),
      ["workspace-skill"],
    );
    assertEquals(
      preview.skillsToCopy.map((entry) => entry.skillName),
      ["workspace-skill"],
    );
    assertEquals(cleared.deletedSkills, 1);
    assertEquals(
      sourceEntries.map((entry) =>
        entry.entryType === "skill" ? `${entry.scope}:${entry.skillName}` : ""
      ),
      ["global:global-skill"],
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService includes subagents in match export import sync remove and coverage", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "Source",
      scope: "workspace",
      skillName: "backend-skill",
      projectName: "Source Project",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["backend", "api"],
    });
    await service.introduceSubagent({
      workspace: "Source",
      scope: "workspace",
      name: "api-test-subagent",
      projectName: "Source Project",
      displayName: "API Test Subagent",
      purpose: "Write focused backend API tests.",
      limitedScope: "Only inspect API handlers and related tests.",
      primarySpecialty: "backend api testing",
      specialtyTags: ["backend", "api", "tests"],
      skillReferences: [{
        entryType: "skill",
        name: "backend-skill",
        scope: "workspace",
        required: true,
      }],
    });
    await service.introduceSubagent({
      workspace: "Source",
      scope: "global",
      name: "global-review-subagent",
      projectName: "Global Project",
      displayName: "Global Review Subagent",
      purpose: "Review focused implementation patches.",
      limitedScope: "Only review provided diffs.",
      primarySpecialty: "code review",
      specialtyTags: ["review"],
    });

    const match = await service.findMatchingEntries({
      workspace: "Source",
      task: "write backend api tests",
    });
    const exported = await service.exportCatalog({ workspace: "Source" });
    const exportedSubagents = await service.exportCatalog({
      workspace: "Source",
      entryType: "subagent",
    });
    const preview = await service.previewWorkspaceCatalogSync({
      sourceWorkspace: "Source",
      targetWorkspace: "Target",
    });
    const applied = await service.applyWorkspaceCatalogSync({
      sourceWorkspace: "Source",
      targetWorkspace: "Target",
      confirm: true,
    });
    const targetEntries = await service.listEntries({
      workspace: "Target",
      entryType: "subagent",
    });
    const importedIntoThird = await service.importCatalog({
      workspace: "Third",
      catalog: exported,
    });
    const health = await service.checkCatalogHealth({ workspace: "Source" });
    const removed = await service.removeCatalogEntry({
      workspace: "Source",
      entryType: "subagent",
      entryKey: "api-test-subagent",
    });

    assertEquals(match.status, "ok");
    assertEquals(match.data.subagents[0]?.entryKey, "api-test-subagent");
    assertEquals(
      match.data.subagents[0]?.prompt?.includes("API Test Subagent"),
      true,
    );
    assertEquals(
      exported.entries.map((entry) =>
        entry.entryType === "subagent" ? entry.name : entry.entryType
      ).sort(),
      ["api-test-subagent", "skill"],
    );
    assertEquals(exportedSubagents.filters.entryType, "subagent");
    assertEquals(exportedSubagents.entries.map((entry) => entry.entryType), [
      "subagent",
    ]);
    assertEquals(preview.subagentsToCopy.map((entry) => entry.name), [
      "api-test-subagent",
    ]);
    assertEquals(preview.summary.subagentsToCopy, 1);
    assertEquals(applied.copiedSubagents, ["api-test-subagent"]);
    assertEquals(applied.importResult.importedCount, 2);
    assertEquals(
      targetEntries.map((entry) =>
        entry.entryType === "subagent" ? `${entry.scope}:${entry.entryKey}` : ""
      ).sort(),
      ["global:global-review-subagent", "workspace:api-test-subagent"],
    );
    assertEquals(importedIntoThird.importedCount, 2);
    assertEquals(health.summary, {
      total: 1,
      verified: 1,
      unverified: 0,
      unknown: 0,
      agents: 0,
      skills: 1,
    });
    assertEquals(health.coverage.workspaceSkillCount, 1);
    assertEquals(health.coverage.globalSkillCount, 0);
    assertEquals(health.coverage.workspaceSubagentCount, 1);
    assertEquals(health.coverage.globalSubagentCount, 1);
    assertEquals(health.coverage.coverageStatus, "healthy");
    assertEquals(health.entries.map((entry) => entry.entryType), ["skill"]);
    assertEquals(removed, {
      workspace: "Source",
      scope: "workspace",
      entryType: "subagent",
      entryKey: "api-test-subagent",
      removed: true,
    });
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService resolves workspace aliases across catalog operations", async () => {
  const { repo, service } = await createCatalogService();
  const workspace = "/Users/ablo/Developer/GitHub/okanaslan/Agentic-Router";
  try {
    await service.introduceAgent({
      workspace: `${workspace}/`,
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const listed = await service.listEntries({ workspace: "Agentic-Router" });
    const detail = await service.getEntryDetail({
      workspace: "Agentic-Router",
      entryType: "agent",
      entryKey: "agent-1",
    });
    const match = await service.findMatchingEntries({
      workspace: "Agentic-Router",
      task: "backend api change",
    });
    const updated = await service.updateCatalogEntry({
      workspace: "Agentic-Router",
      entryType: "agent",
      entryKey: "agent-1",
      displayName: "Canonical Backend Agent",
    });
    const health = await service.checkCatalogHealth({
      workspace: "Agentic-Router",
    });
    const catalog = await service.exportCatalog({
      workspace: "Agentic-Router",
    });
    const removed = await service.removeCatalogEntry({
      workspace: "Agentic-Router",
      entryType: "agent",
      entryKey: "agent-1",
    });
    const afterRemove = await service.listEntries({ workspace });

    assertEquals(listed.map((entry) => entry.workspace), [workspace]);
    assertEquals(detail?.workspace, workspace);
    assertEquals(match.status, "ok");
    assertEquals(updated.displayName, "Canonical Backend Agent");
    assertEquals(health.workspace, workspace);
    assertEquals(health.summary.agents, 1);
    assertEquals(catalog.workspace, workspace);
    assertEquals(catalog.entries.length, 1);
    assertEquals(removed.workspace, workspace);
    assertEquals(afterRemove, []);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService applies duplicate checks across aliases", async () => {
  const { repo, service } = await createCatalogService();
  const workspace = "/Users/ablo/Developer/GitHub/okanaslan/Agentic-Router";
  try {
    await service.introduceAgent({
      workspace,
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    await assertRejects(
      () =>
        service.introduceAgent({
          workspace: "Agentic-Router",
          codexSessionId: "agent-1",
          projectName: "Local Orchestration Router (LOR)",
          displayName: "Backend Agent",
          primarySpecialty: "backend api",
          specialtyTags: ["api"],
        }),
      Error,
      "duplicate_entry",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService imports into resolved workspace aliases", async () => {
  const { repo, service } = await createCatalogService();
  const workspace = "/Users/ablo/Developer/GitHub/okanaslan/Agentic-Router";
  try {
    await service.registerWorkspaceAlias({
      workspace,
      alias: "Agentic-Router",
    });
    const source = await service.exportCatalog({ workspace: "empty" });
    source.entries = [{
      entryType: "skill",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
      verificationStatus: "verified",
      verificationSource: "catalog_export",
      verifiedAt: FIXED_NOW,
    }];

    const result = await service.importCatalog({
      workspace: "Agentic-Router",
      catalog: source,
    });
    const entries = await service.listEntries({ workspace });

    assertEquals(result.workspace, workspace);
    assertEquals(result.importedCount, 1);
    assertEquals(entries.map((entry) => entry.entryKey), ["backend-skill"]);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService requires confirmation before reassigning aliases", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const first = await service.registerWorkspaceAlias({
      workspace: "/workspaces/one/Agentic-Router",
      alias: "Agentic-Router",
    });
    await assertRejects(
      () =>
        service.registerWorkspaceAlias({
          workspace: "/workspaces/two/Agentic-Router",
          alias: "Agentic-Router",
        }),
      Error,
      "alias already exists",
    );
    const reassigned = await service.registerWorkspaceAlias({
      workspace: "/workspaces/two/Agentic-Router",
      alias: "Agentic-Router",
      confirm: true,
    });

    assertEquals(first.created, true);
    assertEquals(first.reassigned, false);
    assertEquals(reassigned.workspace, "/workspaces/two/Agentic-Router");
    assertEquals(reassigned.created, false);
    assertEquals(reassigned.reassigned, true);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService resolves aliases for clear operations", async () => {
  const { repo, service } = await createCatalogService();
  const workspace = "/Users/ablo/Developer/GitHub/okanaslan/Agentic-Router";
  try {
    await service.introduceSkill({
      workspace,
      scope: "workspace",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const cleared = await service.clearWorkspaceCatalog({
      workspace: "Agentic-Router",
      entryType: "skill",
      confirm: true,
    });
    const remaining = await service.listEntries({ workspace });

    assertEquals(cleared.workspace, workspace);
    assertEquals(cleared.deletedSkills, 1);
    assertEquals(remaining, []);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService requires confirmation before clearing workspace catalog", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await assertRejects(
      () =>
        service.clearWorkspaceCatalog({
          workspace: "LOR-MCP",
          confirm: false as true,
        }),
      Error,
      "confirm must be true",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService clears entries from list detail and match results", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "LOR-MCP",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await service.introduceSkill({
      workspace: "LOR-MCP",
      scope: "workspace",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const result = await service.clearWorkspaceCatalog({
      workspace: "LOR-MCP",
      confirm: true,
    });
    const entries = await service.listEntries({ workspace: "LOR-MCP" });
    const detail = await service.getEntryDetail({
      workspace: "LOR-MCP",
      entryType: "agent",
      entryKey: "agent-1",
    });
    const match = await service.findMatchingEntries({
      workspace: "LOR-MCP",
      task: "backend api change",
    });

    assertEquals(result, {
      workspace: "LOR-MCP",
      entryType: undefined,
      deletedAgents: 1,
      deletedSkills: 1,
      deletedSubagents: 0,
      deletedTotal: 2,
    });
    assertEquals(entries, []);
    assertEquals(detail, undefined);
    assertEquals(match.status, "no_match");
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService updates editable catalog metadata", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "LOR-MCP",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const updated = await service.updateCatalogEntry({
      workspace: "LOR-MCP",
      entryType: "agent",
      entryKey: "agent-1",
      projectName: "LOR",
      displayName: "Deno Backend Agent",
      primarySpecialty: "deno backend",
      specialtyTags: ["deno", "mcp", "deno"],
    });

    assertEquals(updated.entryType, "agent");
    assertEquals(updated.entryKey, "agent-1");
    assertEquals(updated.projectName, "LOR");
    assertEquals(updated.displayName, "Deno Backend Agent");
    assertEquals(updated.primarySpecialty, "deno backend");
    assertEquals(updated.specialtyTags, ["deno", "mcp"]);
    assertEquals(updated.updatedAt, FIXED_NOW);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService proposes skill update without mutating skill", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
      skillContext: {
        whenToUse: "Use for backend tasks.",
      },
    });

    const proposal = await service.proposeSkillUpdate({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      reason: "Add project-specific context.",
      skillContext: {
        usageNotes: "Check existing tools before adding new ones.",
      },
      metadata: {
        displayName: "LOR Backend Skill",
      },
    });
    const unchanged = await service.getEntryDetail({
      workspace: "LOR-MCP",
      entryType: "skill",
      entryKey: "backend-skill",
    });

    assertEquals(proposal.proposal.status, "pending");
    assertEquals(proposal.before.displayName, "Backend Skill");
    assertEquals(proposal.after.displayName, "LOR Backend Skill");
    assertEquals(proposal.after.skillContext, {
      whenToUse: "Use for backend tasks.",
      usageNotes: "Check existing tools before adding new ones.",
    });
    if (unchanged?.entryType !== "skill") {
      throw new Error("Expected skill.");
    }
    assertEquals(unchanged.displayName, "Backend Skill");
    assertEquals(unchanged.skillContext, {
      whenToUse: "Use for backend tasks.",
    });
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService applies skill update with confirmation", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    const proposal = await service.proposeSkillUpdate({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      reason: "Improve routing metadata.",
      skillContext: {
        whenToUse: "Use for Deno MCP backend changes.",
        constraints: ["Do not edit local skill files."],
      },
      metadata: {
        primarySpecialty: "Deno MCP backend",
        specialtyTags: ["deno", "mcp", "backend"],
      },
      routing: {
        intents: ["implement"],
        positiveKeywords: ["backend-api", "mcp-tool"],
        requiredAny: ["backend"],
      },
    });

    const applied = await service.applySkillUpdate({
      workspace: "LOR-MCP",
      proposalId: proposal.proposal.proposalId,
      confirm: true,
    });
    const detail = await service.getEntryDetail({
      workspace: "LOR-MCP",
      entryType: "skill",
      entryKey: "backend-skill",
    });

    assertEquals(applied.proposal.status, "applied");
    assertEquals(applied.proposal.appliedAt, FIXED_NOW);
    assertEquals(applied.after.primarySpecialty, "Deno MCP backend");
    assertEquals(applied.after.specialtyTags, ["deno", "mcp", "backend"]);
    assertEquals(applied.after.routing, {
      intents: ["implement"],
      positiveKeywords: ["backend-api", "mcp-tool"],
      requiredAny: ["backend"],
    });
    if (detail?.entryType !== "skill") {
      throw new Error("Expected skill.");
    }
    assertEquals(
      detail.skillContext?.whenToUse,
      "Use for Deno MCP backend changes.",
    );
    assertEquals(detail.skillContext?.constraints, [
      "Do not edit local skill files.",
    ]);
    assertEquals(detail.routing, {
      intents: ["implement"],
      positiveKeywords: ["backend-api", "mcp-tool"],
      requiredAny: ["backend"],
    });
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService validates skill update proposals and application", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    await assertRejects(
      () =>
        service.proposeSkillUpdate({
          workspace: "LOR-MCP",
          skillName: "missing-skill",
          reason: "Improve context.",
          skillContext: { whenToUse: "Backend work." },
        }),
      Error,
      "not_found",
    );
    await assertRejects(
      () =>
        service.proposeSkillUpdate({
          workspace: "LOR-MCP",
          skillName: "backend-skill",
          reason: "Improve context.",
        }),
      Error,
      "At least one skillContext, metadata, or routing field is required",
    );
    await assertRejects(
      () =>
        service.applySkillUpdate({
          workspace: "LOR-MCP",
          proposalId: "missing-proposal",
          confirm: true,
        }),
      Error,
      "not_found",
    );

    const proposal = await service.proposeSkillUpdate({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      reason: "Improve context.",
      skillContext: { whenToUse: "Backend work." },
    });
    await service.applySkillUpdate({
      workspace: "LOR-MCP",
      proposalId: proposal.proposal.proposalId,
      confirm: true,
    });
    await assertRejects(
      () =>
        service.applySkillUpdate({
          workspace: "LOR-MCP",
          proposalId: proposal.proposal.proposalId,
          confirm: true,
        }),
      Error,
      "already been applied",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService skill update proposals do not cross workspaces", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "workspace-a",
      scope: "workspace",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await service.introduceSkill({
      workspace: "workspace-b",
      scope: "workspace",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Other Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    const proposal = await service.proposeSkillUpdate({
      workspace: "workspace-a",
      skillName: "backend-skill",
      reason: "Improve context.",
      skillContext: { whenToUse: "Workspace A work." },
    });

    await assertRejects(
      () =>
        service.applySkillUpdate({
          workspace: "workspace-b",
          proposalId: proposal.proposal.proposalId,
          confirm: true,
        }),
      Error,
      "not_found",
    );
    const workspaceB = await service.getEntryDetail({
      workspace: "workspace-b",
      entryType: "skill",
      entryKey: "backend-skill",
    });

    if (workspaceB?.entryType !== "skill") {
      throw new Error("Expected skill.");
    }
    assertEquals(workspaceB.skillContext, undefined);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService applies and previews updates for global skills", async () => {
  const { root } = await createSkillFileForService("backend-skill");
  const { repo, service } = await createCatalogService({ skillRoots: [root] });
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      scope: "global",
      skillName: "backend-skill",
      projectName: "Global Backend",
      displayName: "Global Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    const proposal = await service.proposeSkillUpdate({
      workspace: "Other-Workspace",
      scope: "global",
      skillName: "backend-skill",
      reason: "Improve global context.",
      skillContext: {
        whenToUse: "Use for shared backend API work.",
      },
    });
    const applied = await service.applySkillUpdate({
      workspace: "Other-Workspace",
      scope: "global",
      proposalId: proposal.proposal.proposalId,
      confirm: true,
    });
    const preview = await service.previewSkillFileSync({
      workspace: "Other-Workspace",
      scope: "global",
      skillName: "backend-skill",
      proposalId: proposal.proposal.proposalId,
    });

    assertEquals(proposal.proposal.scope, "global");
    assertEquals(applied.after.scope, "global");
    assertEquals(
      applied.after.skillContext?.whenToUse,
      "Use for shared backend API work.",
    );
    assertEquals(preview.workspace, "Other-Workspace");
    assertEquals(preview.wouldChange, true);
    assertEquals(
      preview.renderedSection.includes("Use for shared backend API work."),
      true,
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService previews skill file sync only for applied proposals", async () => {
  const { root, file } = await createSkillFileForService("backend-skill");
  const { repo, service } = await createCatalogService({ skillRoots: [root] });
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    const proposal = await service.proposeSkillUpdate({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      reason: "Improve skill context.",
      skillContext: {
        whenToUse: "Use for backend API changes.",
      },
    });

    await assertRejects(
      () =>
        service.previewSkillFileSync({
          workspace: "LOR-MCP",
          skillName: "backend-skill",
          proposalId: proposal.proposal.proposalId,
        }),
      Error,
      "must be applied",
    );

    await service.applySkillUpdate({
      workspace: "LOR-MCP",
      proposalId: proposal.proposal.proposalId,
      confirm: true,
    });
    const preview = await service.previewSkillFileSync({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      proposalId: proposal.proposal.proposalId,
    });
    const fileContent = await Deno.readTextFile(file);

    assertEquals(preview.workspace, "LOR-MCP");
    assertEquals(preview.skillName, "backend-skill");
    assertEquals(preview.targetFile, "SKILL.md");
    assertEquals(preview.sectionExists, false);
    assertEquals(preview.wouldChange, true);
    assertEquals(
      preview.renderedSection.includes("Use for backend API changes."),
      true,
    );
    assertEquals(fileContent, "# Backend Skill\n");
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService applies skill file sync with confirmation", async () => {
  const { root, file } = await createSkillFileForService("backend-skill");
  const { repo, service } = await createCatalogService({ skillRoots: [root] });
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    const proposal = await service.proposeSkillUpdate({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      reason: "Improve skill context.",
      skillContext: {
        whenToUse: "Use for backend API changes.",
        constraints: ["Keep edits scoped."],
      },
    });
    await service.applySkillUpdate({
      workspace: "LOR-MCP",
      proposalId: proposal.proposal.proposalId,
      confirm: true,
    });

    await assertRejects(
      () =>
        service.applySkillFileSync({
          workspace: "LOR-MCP",
          skillName: "backend-skill",
          proposalId: proposal.proposal.proposalId,
          confirm: false as true,
        }),
      Error,
      "confirm must be true",
    );
    const result = await service.applySkillFileSync({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      proposalId: proposal.proposal.proposalId,
      confirm: true,
    });
    const updated = await Deno.readTextFile(file);

    assertEquals(result.written, true);
    assertEquals(updated.includes("## LOR Managed Context"), true);
    assertEquals(updated.includes("Use for backend API changes."), true);
    assertEquals(updated.includes("- Keep edits scoped."), true);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService returns not_found for unresolved local skill files", async () => {
  const root = await Deno.makeTempDir();
  const { repo, service } = await createCatalogService({ skillRoots: [root] });
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "missing-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Missing Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    const proposal = await service.proposeSkillUpdate({
      workspace: "LOR-MCP",
      skillName: "missing-skill",
      reason: "Improve skill context.",
      skillContext: {
        whenToUse: "Use for backend API changes.",
      },
    });
    await service.applySkillUpdate({
      workspace: "LOR-MCP",
      proposalId: proposal.proposal.proposalId,
      confirm: true,
    });

    await assertRejects(
      () =>
        service.previewSkillFileSync({
          workspace: "LOR-MCP",
          skillName: "missing-skill",
          proposalId: proposal.proposal.proposalId,
        }),
      Error,
      "Skill file was not found",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService rejects proposal skill mismatches", async () => {
  const { root } = await createSkillFileForService("backend-skill");
  const { repo, service } = await createCatalogService({ skillRoots: [root] });
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    const proposal = await service.proposeSkillUpdate({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      reason: "Improve skill context.",
      skillContext: {
        whenToUse: "Use for backend API changes.",
      },
    });
    await service.applySkillUpdate({
      workspace: "LOR-MCP",
      proposalId: proposal.proposal.proposalId,
      confirm: true,
    });

    await assertRejects(
      () =>
        service.previewSkillFileSync({
          workspace: "LOR-MCP",
          skillName: "other-skill",
          proposalId: proposal.proposal.proposalId,
        }),
      Error,
      "does not belong",
    );
    await assertRejects(
      () =>
        service.previewSkillFileSync({
          workspace: "LOR-MCP",
          skillName: "../backend-skill",
          proposalId: proposal.proposal.proposalId,
        }),
      Error,
      "does not belong",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService rejects empty catalog metadata updates", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await assertRejects(
      () =>
        service.updateCatalogEntry({
          workspace: "LOR-MCP",
          entryType: "agent",
          entryKey: "agent-1",
        }),
      Error,
      "At least one editable field is required",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService returns not_found for missing catalog update target", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await assertRejects(
      () =>
        service.updateCatalogEntry({
          workspace: "LOR-MCP",
          entryType: "skill",
          entryKey: "missing-skill",
          displayName: "Missing Skill",
        }),
      Error,
      "not_found",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService removes catalog entries from detail and match results", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const result = await service.removeCatalogEntry({
      workspace: "LOR-MCP",
      entryType: "skill",
      entryKey: "backend-skill",
    });
    const detail = await service.getEntryDetail({
      workspace: "LOR-MCP",
      entryType: "skill",
      entryKey: "backend-skill",
    });
    const match = await service.findMatchingEntries({
      workspace: "LOR-MCP",
      task: "backend api change",
    });

    assertEquals(result, {
      workspace: "LOR-MCP",
      scope: "global",
      entryType: "skill",
      entryKey: "backend-skill",
      removed: true,
    });
    assertEquals(detail, undefined);
    assertEquals(match.status, "no_match");
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService exports workspace catalog entries with filters", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "LOR-MCP",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await service.retireAgent({
      workspace: "LOR-MCP",
      agentEntryKey: "agent-1",
      reason: "Replaced after regeneration.",
      confirm: true,
    });
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "frontend-skill",
      projectName: "Other Project",
      displayName: "Frontend Skill",
      primarySpecialty: "frontend",
      specialtyTags: ["react"],
    });
    await service.introduceSkill({
      workspace: "other-workspace",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const catalog = await service.exportCatalog({
      workspace: "LOR-MCP",
      projectName: "Local Orchestration Router (LOR)",
    });

    assertEquals(catalog.version, 1);
    assertEquals(catalog.workspace, "LOR-MCP");
    assertEquals(catalog.exportedAt, FIXED_NOW);
    assertEquals(catalog.filters, {
      entryType: undefined,
      projectName: "Local Orchestration Router (LOR)",
    });
    assertEquals(catalog.entries.map((entry) => entry.entryType), ["agent"]);
    assertEquals(catalog.entries[0].displayName, "Backend Agent");
    assertEquals(
      catalog.entries[0].entryType === "agent"
        ? catalog.entries[0].agentStatus
        : undefined,
      "retired",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService imports exported catalog entries into requested workspace", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const catalog = await service.exportCatalog({ workspace: "empty" });
    catalog.entries = [
      {
        entryType: "agent",
        codexSessionId: "agent-1",
        projectName: "Local Orchestration Router (LOR)",
        displayName: "Backend Agent",
        primarySpecialty: "backend api",
        specialtyTags: ["api"],
        agentStatus: "retired",
        retiredAt: FIXED_NOW,
        retirementReason: "Replaced after regeneration.",
        replacedByAgentEntryKey: "agent-2",
        replacesAgentEntryKey: "agent-0",
        verificationStatus: "verified",
        verificationSource: "catalog_export",
        verifiedAt: FIXED_NOW,
        handoff: {
          whenToUse: "Backend work",
          handoffPromptTemplate: "Handle {task}",
          requiredContext: ["task"],
          expectedOutput: "Patch",
          constraints: ["Stay scoped"],
        },
      },
      {
        entryType: "skill",
        skillName: "backend-skill",
        projectName: "Local Orchestration Router (LOR)",
        displayName: "Backend Skill",
        primarySpecialty: "backend api",
        specialtyTags: ["api"],
        verificationStatus: "verified",
        verificationSource: "catalog_export",
        verifiedAt: FIXED_NOW,
      },
    ];

    const result = await service.importCatalog({
      workspace: "LOR-MCP",
      catalog,
    });
    const entries = await service.listEntries({ workspace: "LOR-MCP" });
    const agent = await service.getEntryDetail({
      workspace: "LOR-MCP",
      entryType: "agent",
      entryKey: "agent-1",
    });

    assertEquals(result, {
      workspace: "LOR-MCP",
      version: 1,
      conflictStrategy: "skip",
      importedCount: 2,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
    });
    assertEquals(entries.map((entry) => entry.entryKey), [
      "agent-1",
      "backend-skill",
    ]);
    if (agent?.entryType !== "agent") {
      throw new Error("Expected imported agent.");
    }
    assertEquals(agent.handoff?.whenToUse, "Backend work");
    assertEquals(agent.agentStatus, "retired");
    assertEquals(agent.retiredAt, FIXED_NOW);
    assertEquals(agent.retirementReason, "Replaced after regeneration.");
    assertEquals(agent.replacedByAgentEntryKey, "agent-2");
    assertEquals(agent.replacesAgentEntryKey, "agent-0");
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService import skips or fails duplicate entries", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      scope: "workspace",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    const catalog = await service.exportCatalog({ workspace: "LOR-MCP" });

    const skipped = await service.importCatalog({
      workspace: "LOR-MCP",
      catalog,
    });
    const failed = await service.importCatalog({
      workspace: "LOR-MCP",
      catalog,
      conflictStrategy: "fail",
    });

    assertEquals(skipped.importedCount, 0);
    assertEquals(skipped.skippedCount, 1);
    assertEquals(skipped.failedCount, 0);
    assertEquals(failed.importedCount, 0);
    assertEquals(failed.skippedCount, 0);
    assertEquals(failed.failedCount, 1);
    assertEquals(failed.errors[0].code, "duplicate_entry");
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService previews workspace catalog sync without mutation", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "source-workspace",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await service.introduceSkill({
      workspace: "source-workspace",
      scope: "workspace",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
      skillContext: {
        whenToUse: "Use for backend implementation.",
      },
    });
    await service.introduceSkill({
      workspace: "source-workspace",
      scope: "workspace",
      skillName: "qa-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "QA Skill",
      primarySpecialty: "quality assurance",
      specialtyTags: ["qa"],
    });
    await service.introduceSkill({
      workspace: "target-workspace",
      scope: "workspace",
      skillName: "qa-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Existing QA Skill",
      primarySpecialty: "quality assurance",
      specialtyTags: ["qa"],
    });

    const preview = await service.previewWorkspaceCatalogSync({
      sourceWorkspace: "source-workspace",
      targetWorkspace: "target-workspace",
      projectName: "Local Orchestration Router (LOR)",
      skillNames: ["backend-skill", "qa-skill", "missing-skill"],
      agentPromptRoles: ["backend"],
    });
    const targetEntries = await service.listEntries({
      workspace: "target-workspace",
    });
    const generatedPrompt = preview.generatedAgentPrompts[0];

    assertEquals(preview.sourceWorkspace, "source-workspace");
    assertEquals(preview.targetWorkspace, "target-workspace");
    assertEquals(preview.skillsToCopy.map((entry) => entry.skillName), [
      "backend-skill",
    ]);
    assertEquals(
      preview.skillsToCopy[0].skillContext?.whenToUse,
      "Use for backend implementation.",
    );
    assertEquals(preview.duplicateSkills, ["qa-skill"]);
    assertEquals(preview.missingSkills, ["missing-skill"]);
    assertEquals(generatedPrompt.role, "backend");
    assertEquals(
      generatedPrompt.suggestedAgentMetadata.displayName,
      "Backend Agent",
    );
    assertEquals(preview.summary, {
      selectedSkills: 2,
      skillsToCopy: 1,
      duplicateSkills: 1,
      missingSkills: 1,
      selectedSubagents: 0,
      subagentsToCopy: 0,
      duplicateSubagents: 0,
      missingSubagents: 0,
      generatedAgentPrompts: 1,
    });
    assertEquals(targetEntries.map((entry) => entry.entryKey), ["qa-skill"]);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService applies workspace catalog sync with confirmation", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "source-workspace",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await service.introduceSkill({
      workspace: "source-workspace",
      scope: "workspace",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
      skillContext: {
        usageNotes: "Preserve this context.",
      },
    });
    await service.introduceSkill({
      workspace: "source-workspace",
      scope: "workspace",
      skillName: "qa-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "QA Skill",
      primarySpecialty: "quality assurance",
      specialtyTags: ["qa"],
    });
    await service.introduceSkill({
      workspace: "target-workspace",
      scope: "workspace",
      skillName: "qa-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Existing QA Skill",
      primarySpecialty: "quality assurance",
      specialtyTags: ["qa"],
    });

    const result = await service.applyWorkspaceCatalogSync({
      sourceWorkspace: "source-workspace",
      targetWorkspace: "target-workspace",
      confirm: true,
    });
    const targetEntries = await service.listEntries({
      workspace: "target-workspace",
    });
    const copied = await service.getEntryDetail({
      workspace: "target-workspace",
      entryType: "skill",
      entryKey: "backend-skill",
    });

    assertEquals(result.copiedSkills, ["backend-skill"]);
    assertEquals(result.summary.copiedSkills, 1);
    assertEquals(result.importResult.importedCount, 1);
    assertEquals(result.importResult.skippedCount, 0);
    assertEquals(result.duplicateSkills, ["qa-skill"]);
    assertEquals(targetEntries.map((entry) => entry.entryKey).sort(), [
      "backend-skill",
      "qa-skill",
    ]);
    if (copied?.entryType !== "skill") {
      throw new Error("Expected copied skill.");
    }
    assertEquals(copied.skillContext?.usageNotes, "Preserve this context.");
    assertEquals(copied.verificationSource, "mcp_introduction");
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService rejects workspace sync without confirmation or across same workspace", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await assertRejects(
      () =>
        service.applyWorkspaceCatalogSync({
          sourceWorkspace: "source-workspace",
          targetWorkspace: "target-workspace",
          confirm: false as true,
        }),
      Error,
      "confirm must be true",
    );
    await assertRejects(
      () =>
        service.previewWorkspaceCatalogSync({
          sourceWorkspace: "same-workspace",
          targetWorkspace: "same-workspace",
        }),
      Error,
      "must resolve to different workspaces",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService reports catalog health from stored verification metadata", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "LOR-MCP",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await repo.createSkill("LOR-MCP", {
      workspace: "LOR-MCP",
      skillName: "unverified-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Unverified Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
      verification: {
        verificationStatus: "unverified",
        verificationSource: "health_check",
        verifiedAt: FIXED_NOW,
        verificationMessage: "Skill could not be confirmed.",
      },
      now: FIXED_NOW,
    });
    await repo.createSkill("LOR-MCP", {
      workspace: "LOR-MCP",
      skillName: "unknown-skill",
      projectName: "Other Project",
      displayName: "Unknown Skill",
      primarySpecialty: "frontend",
      specialtyTags: ["react"],
      verification: {
        verificationStatus: "unknown",
        verificationSource: "health_check",
        verifiedAt: FIXED_NOW,
        verificationMessage: "Health source was unavailable.",
      },
      now: FIXED_NOW,
    });

    const report = await service.checkCatalogHealth({ workspace: "LOR-MCP" });

    assertEquals(report.checkedAt, FIXED_NOW);
    assertEquals(report.workspace, "LOR-MCP");
    assertEquals(report.summary, {
      total: 3,
      verified: 1,
      unverified: 1,
      unknown: 1,
      agents: 1,
      skills: 2,
    });
    assertEquals(report.coverage.workspaceSkillCount, 2);
    assertEquals(report.coverage.globalSkillCount, 0);
    assertEquals(report.coverage.workspaceSubagentCount, 0);
    assertEquals(report.coverage.globalSubagentCount, 0);
    assertEquals(report.coverage.coverageStatus, "low_coverage");
    assertEquals(report.entries.map((entry) => entry.entryKey), [
      "agent-1",
      "unknown-skill",
      "unverified-skill",
    ]);
    assertEquals(report.entries[0].issues, []);
    assertEquals(report.entries[1].issues[0].code, "verification_unknown");
    assertEquals(report.entries[2].issues[0].code, "verification_unverified");
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService reports workspace diagnostics without listing entries", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "/workspaces/LOR-MCP",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await service.introduceSkill({
      workspace: "/workspaces/LOR-MCP",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await service.introduceSubagent({
      workspace: "/workspaces/LOR-MCP",
      name: "api-subagent",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "API Subagent",
      purpose: "Handle API tasks.",
      limitedScope: "API files only.",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const diagnostics = await service.getWorkspaceDiagnostics({
      workspace: "LOR-MCP",
    });

    assertEquals(diagnostics.inputWorkspace, "LOR-MCP");
    assertEquals(diagnostics.resolvedWorkspace, "/workspaces/LOR-MCP");
    assertEquals(diagnostics.aliases, ["/workspaces/LOR-MCP", "LOR-MCP"]);
    assertEquals(diagnostics.catalogCounts, {
      total: 3,
      agents: 1,
      skills: 1,
      subagents: 1,
    });
    assertEquals(diagnostics.storageStatus.configured, true);
    assertEquals(diagnostics.storageStatus.reachable, true);
    assertEquals(diagnostics.runtimeStatus.transport, "mcp");
    assertEquals(diagnostics.localContext.agentsMd.status, "missing");
    assertEquals(
      diagnostics.localContext.skills.registeredSkillsWithoutLocalFile,
      ["backend-skill"],
    );
    assertEquals(diagnostics.checkedAt, FIXED_NOW);
    assertEquals(JSON.stringify(diagnostics).includes("Backend Agent"), false);
    assertEquals(JSON.stringify(diagnostics).includes("Backend Skill"), false);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService reports local skill and AGENTS alignment in diagnostics", async () => {
  const local = await createSkillFileForService("backend-skill");
  await Deno.mkdir(join(local.root, "local-only-skill"), { recursive: true });
  await Deno.writeTextFile(
    join(local.root, "local-only-skill", "SKILL.md"),
    "# Local Only Skill\n",
  );
  const workspace = await Deno.makeTempDir();
  await Deno.writeTextFile(join(workspace, "AGENTS.md"), "# Instructions\n");
  const { repo, service } = await createCatalogService({
    skillRoots: [local.root],
  });
  try {
    await service.introduceSkill({
      workspace,
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await service.introduceSkill({
      workspace,
      skillName: "missing-local-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Missing Local Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const diagnostics = await service.getWorkspaceDiagnostics({ workspace });

    assertEquals(diagnostics.localContext.agentsMd.status, "present");
    assertEquals(diagnostics.localContext.skills.configuredRoots, 1);
    assertEquals(diagnostics.localContext.skills.discoveredSkillNames, [
      "backend-skill",
      "local-only-skill",
    ]);
    assertEquals(
      diagnostics.localContext.skills.registeredSkillsWithLocalFile,
      ["backend-skill"],
    );
    assertEquals(
      diagnostics.localContext.skills.registeredSkillsWithoutLocalFile,
      ["missing-local-skill"],
    );
    assertEquals(
      diagnostics.localContext.skills.unregisteredLocalSkillNames,
      ["local-only-skill"],
    );
    assertEquals(
      diagnostics.localContext.recommendedActions.includes(
        "Resolve registered LOR skills that do not have matching local SKILL.md files in configured skill roots.",
      ),
      true,
    );
    assertEquals(JSON.stringify(diagnostics).includes(local.root), false);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService returns sanitized workspace diagnostics when storage is unavailable", async () => {
  const { repo, service } = await createCatalogService();
  repo.close();

  const diagnostics = await service.getWorkspaceDiagnostics({
    workspace: "LOR-MCP",
  });

  assertEquals(diagnostics.inputWorkspace, "LOR-MCP");
  assertEquals(diagnostics.resolvedWorkspace, "LOR-MCP");
  assertEquals(diagnostics.aliases, []);
  assertEquals(diagnostics.catalogCounts, {
    total: 0,
    agents: 0,
    skills: 0,
    subagents: 0,
  });
  assertEquals(diagnostics.storageStatus.configured, true);
  assertEquals(diagnostics.storageStatus.reachable, false);
  assertEquals(diagnostics.localContext.agentsMd.status, "not_inspected");
  assertEquals(
    diagnostics.storageStatus.message,
    "Catalog storage is not reachable.",
  );
  assertEquals(JSON.stringify(diagnostics).includes("catalog.db"), false);
  assertEquals(JSON.stringify(diagnostics).includes("stack"), false);
});

Deno.test("CatalogService stores and retrieves workspace notes by resolved workspace", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.registerWorkspaceAlias({
      workspace: "/workspaces/LOR-MCP",
      alias: "LOR-MCP",
    });
    const note = await service.rememberWorkspaceNote({
      workspace: "LOR-MCP",
      title: "Branch plan",
      body: "Keep diagnostics and memory changes in separate commits.",
      tags: ["branch-plan", "coordination"],
    });

    const listed = await service.listWorkspaceNotes({
      workspace: "/workspaces/LOR-MCP",
      tags: ["branch-plan"],
    });
    const fetched = await service.getWorkspaceNote({
      workspace: "/workspaces/LOR-MCP",
      noteId: note.noteId,
    });

    assertEquals(note.workspace, "/workspaces/LOR-MCP");
    assertEquals(note.createdAt, FIXED_NOW);
    assertEquals(listed.workspace, "/workspaces/LOR-MCP");
    assertEquals(listed.notes.length, 1);
    assertEquals(listed.notes[0], {
      noteId: note.noteId,
      workspace: "/workspaces/LOR-MCP",
      title: "Branch plan",
      tags: ["branch-plan", "coordination"],
      createdAt: FIXED_NOW,
      updatedAt: FIXED_NOW,
    });
    assertEquals(
      fetched.body,
      "Keep diagnostics and memory changes in separate commits.",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService keeps workspace notes scoped and removable", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const note = await service.rememberWorkspaceNote({
      workspace: "LOR-MCP",
      title: "Review summary",
      body: "Keep memory notes out of matcher results.",
      tags: ["review-summary"],
    });
    await service.rememberWorkspaceNote({
      workspace: "Other",
      title: "Review summary",
      body: "Other workspace note.",
      tags: ["review-summary"],
    });

    const beforeRemove = await service.listWorkspaceNotes({
      workspace: "LOR-MCP",
    });
    const match = await service.findMatchingEntries({
      workspace: "LOR-MCP",
      task: "Review summary",
    });
    const removed = await service.removeWorkspaceNote({
      workspace: "LOR-MCP",
      noteId: note.noteId,
    });
    const afterRemove = await service.listWorkspaceNotes({
      workspace: "LOR-MCP",
    });
    const other = await service.listWorkspaceNotes({ workspace: "Other" });

    assertEquals(beforeRemove.notes.length, 1);
    assertEquals(match.status, "no_match");
    assertEquals(removed.removed, true);
    assertEquals(afterRemove.notes.length, 0);
    assertEquals(other.notes.length, 1);
    await assertRejects(
      () =>
        service.getWorkspaceNote({
          workspace: "LOR-MCP",
          noteId: note.noteId,
        }),
      Error,
      "Workspace note was not found",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService finds matching workspace notes without returning full bodies", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const branchPlan = await service.rememberWorkspaceNote({
      workspace: "LOR-MCP",
      title: "Branch plan",
      body:
        "Secret implementation detail: keep diagnostics and memory matching changes in separate commits.",
      tags: ["branch-plan", "coordination"],
    });
    await service.rememberWorkspaceNote({
      workspace: "LOR-MCP",
      title: "Release checklist",
      body: "Run smoke tests before release.",
      tags: ["release"],
    });
    await service.rememberWorkspaceNote({
      workspace: "Other",
      title: "Branch plan",
      body: "Other workspace branch plan.",
      tags: ["branch-plan"],
    });

    const result = await service.findMatchingWorkspaceNotes({
      workspace: "LOR-MCP",
      query: "branch coordination diagnostics",
      tags: ["branch-plan"],
      limit: 5,
    });

    assertEquals(result.status, "ok");
    assertEquals(result.workspace, "LOR-MCP");
    assertEquals(result.filters.tags, ["branch-plan"]);
    assertEquals(result.notes.length, 1);
    assertEquals(result.notes[0].noteId, branchPlan.noteId);
    assertEquals(result.notes[0].title, "Branch plan");
    assertEquals(result.notes[0].matchedFields.includes("title"), true);
    assertEquals(result.notes[0].matchedFields.includes("tags"), true);
    assertEquals(
      result.notes[0].preview.includes("Secret implementation"),
      true,
    );
    assertEquals("body" in result.notes[0], false);

    const noMatch = await service.findMatchingWorkspaceNotes({
      workspace: "LOR-MCP",
      query: "android store screenshots",
    });

    assertEquals(noMatch.status, "no_match");
    assertEquals(noMatch.notes, []);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService filters catalog health by type project and entry key", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "LOR-MCP",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await service.introduceSkill({
      workspace: "LOR-MCP",
      scope: "workspace",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await service.introduceSkill({
      workspace: "other-workspace",
      scope: "workspace",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Other Workspace Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const report = await service.checkCatalogHealth({
      workspace: "LOR-MCP",
      entryType: "skill",
      projectName: "Local Orchestration Router (LOR)",
      entryKey: "backend-skill",
    });

    assertEquals(report.filters, {
      entryType: "skill",
      projectName: "Local Orchestration Router (LOR)",
      scope: undefined,
      entryKey: "backend-skill",
    });
    assertEquals(report.summary, {
      total: 1,
      verified: 1,
      unverified: 0,
      unknown: 0,
      agents: 0,
      skills: 1,
    });
    assertEquals(report.coverage.workspaceSkillCount, 1);
    assertEquals(report.coverage.coverageStatus, "low_coverage");
    assertEquals(report.entries.map((entry) => entry.displayName), [
      "Backend Skill",
    ]);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService returns empty catalog health for empty workspace", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const report = await service.checkCatalogHealth({
      workspace: "empty-workspace",
    });

    assertEquals(report.summary, {
      total: 0,
      verified: 0,
      unverified: 0,
      unknown: 0,
      agents: 0,
      skills: 0,
    });
    assertEquals(report.coverage.coverageStatus, "low_coverage");
    assertEquals(report.coverage.recommendedActions, [
      "Register at least one workspace skill with introduce_skill before relying on task initialization.",
      "Register at least one scoped subagent profile with introduce_subagent for repeatable focused work.",
      "Review skill and subagent coverage before relying on LOR for task context.",
    ]);
    assertEquals(report.entries, []);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService returns not_found for missing catalog remove target", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await assertRejects(
      () =>
        service.removeCatalogEntry({
          workspace: "LOR-MCP",
          entryType: "agent",
          entryKey: "missing-agent",
        }),
      Error,
      "not_found",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService retires an agent and excludes it from matching", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "LOR-MCP",
      codexSessionId: "agent-old",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await service.introduceAgent({
      workspace: "LOR-MCP",
      codexSessionId: "agent-new",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Replacement Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
      replacesAgentEntryKey: "agent-old",
    });

    const result = await service.retireAgent({
      workspace: "LOR-MCP",
      agentEntryKey: "agent-old",
      reason: "Replaced after context regeneration.",
      replacedByAgentEntryKey: "agent-new",
      confirm: true,
    });
    const detail = await service.getEntryDetail({
      workspace: "LOR-MCP",
      entryType: "agent",
      entryKey: "agent-old",
    });
    const match = await service.findMatchingEntries({
      workspace: "LOR-MCP",
      task: "Implement backend API changes",
    });

    assertEquals(result.agent.agentStatus, "retired");
    assertEquals(result.agent.retiredAt, FIXED_NOW);
    assertEquals(
      result.agent.retirementReason,
      "Replaced after context regeneration.",
    );
    assertEquals(result.agent.replacedByAgentEntryKey, "agent-new");
    assertEquals(result.replacedByAgent?.entryKey, "agent-new");
    assertEquals(detail?.entryType, "agent");
    if (detail?.entryType === "agent") {
      assertEquals(detail.agentStatus, "retired");
    }
    assertEquals(
      match.data.agents.map((agent) => agent.entryKey),
      ["agent-new"],
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService validates agent retirement inputs", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "LOR-MCP",
      codexSessionId: "agent-old",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    await assertRejects(
      () =>
        service.retireAgent({
          workspace: "LOR-MCP",
          agentEntryKey: "agent-old",
          confirm: false as true,
        }),
      Error,
      "confirm must be true",
    );
    await assertRejects(
      () =>
        service.retireAgent({
          workspace: "LOR-MCP",
          agentEntryKey: "agent-old",
          replacedByAgentEntryKey: "agent-old",
          confirm: true,
        }),
      Error,
      "replacedByAgentEntryKey must reference a different agent",
    );
    await assertRejects(
      () =>
        service.retireAgent({
          workspace: "LOR-MCP",
          agentEntryKey: "agent-old",
          replacedByAgentEntryKey: "missing-agent",
          confirm: true,
        }),
      Error,
      "Replacement agent was not found",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService prepares task-oriented agent initialization context", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "backend-api",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend API Skill",
      primarySpecialty: "backend api implementation",
      specialtyTags: ["backend", "api"],
      skillContext: {
        whenToUse: "Use for backend API and MCP tool implementation work.",
        usageNotes: "Follow service and schema test patterns.",
      },
    });
    await service.introduceSubagent({
      workspace: "LOR-MCP",
      name: "backend-api-test-profile",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend API Test Subagent",
      purpose: "Write focused backend API tests.",
      limitedScope: "Only inspect service, schema, and HTTP tool tests.",
      primarySpecialty: "backend api testing",
      specialtyTags: ["backend", "api", "tests"],
    });

    const result = await service.prepareAgentInitialization({
      workspace: "LOR-MCP",
      task: "Implement a backend API tool with tests",
      specialtyHints: ["backend api"],
    });

    assertEquals(result.workspace, "LOR-MCP");
    assertEquals(result.task, "Implement a backend API tool with tests");
    assertEquals(result.recommendedSkills.length, 1);
    assertEquals(result.recommendedSkills[0].displayName, "Backend API Skill");
    assertEquals(result.recommendedSubagents.length, 1);
    assertEquals(
      result.recommendedSubagents[0].displayName,
      "Backend API Test Subagent",
    );
    assertEquals(result.localInstructionSources[0].name, "AGENTS.md");
    assert(result.prompt.includes("Recommended LOR skills:"));
    assert(result.prompt.includes("Backend API Skill"));
    assert(result.prompt.includes("Recommended LOR subagent profiles:"));
    assert(result.prompt.includes("Backend API Test Subagent"));
    assert(result.prompt.includes("LOR prepared this prompt"));
    assertEquals(result.delivery.mode, "manual");
    assert(result.nextSteps.length > 0);
    assert(result.failureGuidance.length > 0);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService prepares initialization fallback guidance for empty catalogs", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const result = await service.prepareAgentInitialization({
      workspace: "LOR-MCP",
      task: "Fix a small bug",
    });

    assertEquals(result.recommendedSkills, []);
    assertEquals(result.recommendedSubagents, []);
    assert(
      result.nextSteps.some((step) =>
        step.includes("No registered skills matched")
      ),
    );
    assert(
      result.nextSteps.some((step) =>
        step.includes("No registered subagent profiles matched")
      ),
    );
    assert(result.prompt.includes("Do not invent skills"));
    assert(result.prompt.includes("Do not invent subagents"));
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService validates prepare initialization inputs", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await assertRejects(
      () =>
        service.prepareAgentInitialization({
          workspace: " ",
          task: "Fix a bug",
        }),
      Error,
      "workspace is required",
    );
    await assertRejects(
      () =>
        service.prepareAgentInitialization({
          workspace: "LOR-MCP",
          task: " ",
        }),
      Error,
      "task is required",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService records usage analytics for public V2 entries", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "backend-api",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend API Skill",
      primarySpecialty: "backend api implementation",
      specialtyTags: ["backend", "api"],
      skillContext: {
        whenToUse: "Use for backend API implementation.",
      },
    });
    await service.introduceSubagent({
      workspace: "LOR-MCP",
      name: "backend-api-test-profile",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend API Test Subagent",
      purpose: "Write backend API tests.",
      limitedScope: "Only inspect service and API tests.",
      primarySpecialty: "backend api testing",
      specialtyTags: ["backend", "api", "tests"],
    });
    const note = await service.rememberWorkspaceNote({
      workspace: "LOR-MCP",
      title: "Branch plan",
      body: "Keep backend API changes scoped and verify Deno tests.",
      tags: ["branch-plan"],
    });

    await service.listSkills({ workspace: "Consumer-Workspace" });
    await service.findMatchingSkills({
      workspace: "Consumer-Workspace",
      task: "backend api implementation",
    });
    await service.getSkillDetail({
      workspace: "Consumer-Workspace",
      skillName: "backend-api",
      scope: "global",
    });
    await service.listSubagents({ workspace: "Consumer-Workspace" });
    await service.findMatchingSubagents({
      workspace: "Consumer-Workspace",
      task: "backend api tests",
    });
    await service.getSubagentDetail({
      workspace: "Consumer-Workspace",
      subagentName: "backend-api-test-profile",
      scope: "global",
    });
    await service.listWorkspaceNotes({ workspace: "LOR-MCP" });
    await service.findMatchingWorkspaceNotes({
      workspace: "LOR-MCP",
      query: "backend API",
    });
    await service.getWorkspaceNote({
      workspace: "LOR-MCP",
      noteId: note.noteId,
    });

    const consumerReport = await service.getUsageAnalytics({
      workspace: "Consumer-Workspace",
    });
    const noteReport = await service.getUsageAnalytics({
      workspace: "LOR-MCP",
      entryType: "note",
    });
    const skillProjectReport = await service.getUsageAnalytics({
      workspace: "Consumer-Workspace",
      entryType: "skill",
      scope: "global",
      entryKey: "backend-api",
      projectName: "Local Orchestration Router (LOR)",
    });

    assertEquals(consumerReport.workspace, "Consumer-Workspace");
    assertEquals(consumerReport.summary.totalEntries, 2);
    assertEquals(consumerReport.summary.byEntryType.skill, {
      entries: 1,
      listed: 1,
      matched: 1,
      detailed: 1,
      total: 3,
    });
    assertEquals(consumerReport.summary.byEntryType.subagent, {
      entries: 1,
      listed: 1,
      matched: 1,
      detailed: 1,
      total: 3,
    });
    assertEquals(consumerReport.summary.byEntryType.note.total, 0);
    assertEquals(
      consumerReport.entries.map((entry) =>
        `${entry.entryType}:${entry.scope}:${entry.entryKey}`
      ),
      [
        "skill:global:backend-api",
        "subagent:global:backend-api-test-profile",
      ],
    );
    assertEquals(noteReport.summary.byEntryType.note, {
      entries: 1,
      listed: 1,
      matched: 1,
      detailed: 1,
      total: 3,
    });
    assertEquals(noteReport.entries[0].scope, "workspace");
    assertEquals(noteReport.entries[0].entryKey, note.noteId);
    assertEquals(skillProjectReport.entries.length, 1);
    assertEquals(skillProjectReport.entries[0].workspace, "Consumer-Workspace");
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService returns empty usage analytics and validates note filters", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const report = await service.getUsageAnalytics({
      workspace: "Empty-Workspace",
    });

    assertEquals(report.workspace, "Empty-Workspace");
    assertEquals(report.entries, []);
    assertEquals(report.summary.totalEntries, 0);
    assertEquals(report.summary.totalCount, 0);
    assertEquals(report.summary.byOperation, {
      listed: 0,
      matched: 0,
      detailed: 0,
    });
    assert(report.recommendedActions.length > 0);
    await assertRejects(
      () =>
        service.getUsageAnalytics({
          workspace: "LOR-MCP",
          entryType: "note",
          scope: "global",
        }),
      Error,
      "Workspace notes only support workspace scope",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService does not fail successful operations when usage writes fail", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "backend-api",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend API Skill",
      primarySpecialty: "backend api implementation",
      specialtyTags: ["backend", "api"],
    });
    const failingRepo = repo as unknown as {
      recordUsageCounters: typeof repo.recordUsageCounters;
    };
    failingRepo.recordUsageCounters = () =>
      Promise.reject(new Error("analytics write failed"));

    const skills = await service.listSkills({ workspace: "LOR-MCP" });

    assertEquals(skills.map((skill) => skill.skillName), ["backend-api"]);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService updates and clears routing metadata", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      scope: "workspace",
      skillName: "performance-audit",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Performance Audit",
      primarySpecialty: "performance audit",
      specialtyTags: ["performance"],
    });
    await service.introduceSubagent({
      workspace: "LOR-MCP",
      scope: "workspace",
      name: "performance-subagent",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Performance Subagent",
      purpose: "Handle performance checks.",
      limitedScope: "Only inspect performance files.",
      primarySpecialty: "performance",
      specialtyTags: ["performance"],
    });

    const updatedSkill = await service.updateSkill({
      workspace: "LOR-MCP",
      scope: "workspace",
      skillName: "performance-audit",
      routing: {
        intents: ["performance_audit"],
        positiveKeywords: ["performance"],
        negativeKeywords: ["memory-profiling"],
      },
      negativeRouting: {
        doNotUseWhen: ["memory profiling"],
        insteadUse: ["memory-profiling"],
      },
    });
    const updatedSubagent = await service.updateSubagent({
      workspace: "LOR-MCP",
      scope: "workspace",
      subagentName: "performance-subagent",
      routing: {
        intents: ["performance_audit"],
        positiveKeywords: ["performance"],
        negativeKeywords: ["memory-profiling"],
      },
      negativeRouting: {
        doNotUseWhen: ["memory profiling"],
      },
    });
    const clearedSkill = await service.updateSkill({
      workspace: "LOR-MCP",
      scope: "workspace",
      skillName: "performance-audit",
      routing: null,
      negativeRouting: null,
    });
    const clearedSubagent = await service.updateSubagent({
      workspace: "LOR-MCP",
      scope: "workspace",
      subagentName: "performance-subagent",
      routing: null,
      negativeRouting: null,
    });

    assertEquals(updatedSkill.routing, {
      intents: ["performance_audit"],
      positiveKeywords: ["performance"],
      negativeKeywords: ["memory-profiling"],
    });
    assertEquals(updatedSkill.skillContext?.negativeRouting, {
      doNotUseWhen: ["memory profiling"],
      insteadUse: ["memory-profiling"],
    });
    assertEquals(updatedSubagent.routing, {
      intents: ["performance_audit"],
      positiveKeywords: ["performance"],
      negativeKeywords: ["memory-profiling"],
    });
    assertEquals(updatedSubagent.negativeRouting, {
      doNotUseWhen: ["memory profiling"],
    });
    assertEquals(clearedSkill.routing, undefined);
    assertEquals(clearedSkill.skillContext?.negativeRouting, undefined);
    assertEquals(clearedSubagent.routing, undefined);
    assertEquals(clearedSubagent.negativeRouting, undefined);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService preserves negative routing through skill proposals", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      scope: "workspace",
      skillName: "performance-audit",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Performance Audit",
      primarySpecialty: "performance audit",
      specialtyTags: ["performance"],
    });

    const proposal = await service.proposeSkillUpdate({
      workspace: "LOR-MCP",
      scope: "workspace",
      skillName: "performance-audit",
      reason: "Reduce false memory profiling matches.",
      skillContext: {
        negativeRouting: {
          doNotUseWhen: ["memory profiling"],
          insteadUse: ["memory-profiling"],
        },
      },
      routing: {
        intents: ["performance_audit"],
        positiveKeywords: ["performance"],
        negativeKeywords: ["memory-profiling"],
      },
    });
    const applied = await service.applySkillUpdate({
      workspace: "LOR-MCP",
      scope: "workspace",
      proposalId: proposal.proposal.proposalId,
      confirm: true,
    });

    assertEquals(proposal.after.routing, {
      intents: ["performance_audit"],
      positiveKeywords: ["performance"],
      negativeKeywords: ["memory-profiling"],
    });
    assertEquals(proposal.after.skillContext?.negativeRouting, {
      doNotUseWhen: ["memory profiling"],
      insteadUse: ["memory-profiling"],
    });
    assertEquals(applied.after.routing, {
      intents: ["performance_audit"],
      positiveKeywords: ["performance"],
      negativeKeywords: ["memory-profiling"],
    });
    assertEquals(applied.after.skillContext?.negativeRouting, {
      doNotUseWhen: ["memory profiling"],
      insteadUse: ["memory-profiling"],
    });
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService preserves negative routing through export import and sync", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const routing = {
      intents: ["performance_audit"],
      positiveKeywords: ["performance"],
      negativeKeywords: ["memory-profiling"],
      requiredAny: ["profiling-report"],
      domain: ["deno"],
      outputNeed: ["triage"],
    };
    await service.introduceSkill({
      workspace: "Source",
      scope: "workspace",
      skillName: "performance-audit",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Performance Audit",
      primarySpecialty: "performance audit",
      specialtyTags: ["performance"],
      routing,
      skillContext: {
        negativeRouting: {
          doNotUseWhen: ["memory profiling"],
          insteadUse: ["memory-profiling"],
        },
      },
    });
    await service.introduceSubagent({
      workspace: "Source",
      scope: "workspace",
      name: "performance-subagent",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Performance Subagent",
      purpose: "Handle performance checks.",
      limitedScope: "Only inspect performance files.",
      primarySpecialty: "performance",
      specialtyTags: ["performance"],
      routing,
      negativeRouting: {
        doNotUseWhen: ["memory profiling"],
      },
    });

    const exported = await service.exportCatalog({ workspace: "Source" });
    await service.importCatalog({
      workspace: "Imported",
      catalog: exported,
    });
    await service.applyWorkspaceCatalogSync({
      sourceWorkspace: "Source",
      targetWorkspace: "Synced",
      confirm: true,
    });

    const importedSkill = await service.getSkillDetail({
      workspace: "Imported",
      skillName: "performance-audit",
      scope: "workspace",
    });
    const importedSubagent = await service.getSubagentDetail({
      workspace: "Imported",
      subagentName: "performance-subagent",
      scope: "workspace",
    });
    const syncedSkill = await service.getSkillDetail({
      workspace: "Synced",
      skillName: "performance-audit",
      scope: "workspace",
    });
    const syncedSubagent = await service.getSubagentDetail({
      workspace: "Synced",
      subagentName: "performance-subagent",
      scope: "workspace",
    });

    assertEquals(
      exported.entries.find((entry) => entry.entryType === "skill"),
      {
        entryType: "skill",
        skillName: "performance-audit",
        projectName: "Local Orchestration Router (LOR)",
        displayName: "Performance Audit",
        primarySpecialty: "performance audit",
        specialtyTags: ["performance"],
        verificationStatus: "verified",
        verificationSource: "mcp_introduction",
        verifiedAt: FIXED_NOW,
        verificationMessage: undefined,
        routing,
        skillContext: {
          negativeRouting: {
            doNotUseWhen: ["memory profiling"],
            insteadUse: ["memory-profiling"],
          },
        },
      },
    );
    assertEquals(importedSkill?.routing, routing);
    assertEquals(importedSkill?.skillContext?.negativeRouting, {
      doNotUseWhen: ["memory profiling"],
      insteadUse: ["memory-profiling"],
    });
    assertEquals(importedSubagent?.routing, routing);
    assertEquals(importedSubagent?.negativeRouting, {
      doNotUseWhen: ["memory profiling"],
    });
    assertEquals(syncedSkill?.routing, routing);
    assertEquals(syncedSkill?.skillContext?.negativeRouting, {
      doNotUseWhen: ["memory profiling"],
      insteadUse: ["memory-profiling"],
    });
    assertEquals(syncedSubagent?.routing, routing);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService exposes structured match debug metadata", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      scope: "workspace",
      skillName: "pr-feedback-evaluator",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "PR Feedback Evaluator",
      primarySpecialty: "pull request feedback triage",
      specialtyTags: ["pull-request", "feedback"],
      routing: {
        intents: ["evaluate_feedback"],
        positiveKeywords: ["received-feedback", "reviewer-comment"],
      },
    });
    await service.introduceSkill({
      workspace: "LOR-MCP",
      scope: "workspace",
      skillName: "general-triage",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "General Triage",
      primarySpecialty: "pull request triage",
      specialtyTags: ["pull-request", "triage"],
      routing: {
        intents: ["evaluate_feedback"],
        positiveKeywords: ["pull-request"],
      },
    });

    const match = await service.findMatchingSkills({
      workspace: "LOR-MCP",
      task: "Evaluate a pull request",
      intent: "evaluate_feedback",
      negativeKeywords: ["received-feedback"],
      preferredSkills: ["general-triage"],
      debug: true,
    });

    assertEquals(match.status, "ok");
    assertEquals(match.data.querySignals?.includes("evaluate-feedback"), true);
    assertEquals(match.data.skills[0]?.entryKey, "general-triage");
    assertEquals(
      match.data.skills[0]?.explanation.finalScoreBreakdown?.preferenceBoost,
      20,
    );
    assertEquals(
      match.data.excludedCandidates?.map((candidate) => candidate.entryKey),
      ["pr-feedback-evaluator"],
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService preserves implementation guidance and keeps list match compact", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const implementationGuidance = implementationGuidanceFixture();
    await service.introduceSkill({
      workspace: "Source",
      scope: "workspace",
      skillName: "backend-implementation",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Implementation",
      primarySpecialty: "backend implementation",
      specialtyTags: ["backend", "implementation"],
      skillContext: {
        whenToUse: "Use for backend implementation changes.",
        implementationGuidance,
      },
    });

    const listed = await service.listSkills({ workspace: "Source" });
    const detail = await service.getSkillDetail({
      workspace: "Source",
      skillName: "backend-implementation",
      scope: "workspace",
    });
    const match = await service.findMatchingSkills({
      workspace: "Source",
      task: "backend implementation changes",
    });
    const proposal = await service.proposeSkillUpdate({
      workspace: "Source",
      scope: "workspace",
      skillName: "backend-implementation",
      reason: "Clear implementation guidance.",
      skillContext: {
        implementationGuidance: null,
      },
    });
    const applied = await service.applySkillUpdate({
      workspace: "Source",
      scope: "workspace",
      proposalId: proposal.proposal.proposalId,
      confirm: true,
    });

    await service.proposeSkillUpdate({
      workspace: "Source",
      scope: "workspace",
      skillName: "backend-implementation",
      reason: "Restore implementation guidance.",
      skillContext: {
        implementationGuidance,
      },
    }).then((restoreProposal) =>
      service.applySkillUpdate({
        workspace: "Source",
        scope: "workspace",
        proposalId: restoreProposal.proposal.proposalId,
        confirm: true,
      })
    );
    const exported = await service.exportCatalog({ workspace: "Source" });
    await service.importCatalog({
      workspace: "Imported",
      catalog: exported,
    });
    await service.applyWorkspaceCatalogSync({
      sourceWorkspace: "Source",
      targetWorkspace: "Synced",
      confirm: true,
    });
    const importedSkill = await service.getSkillDetail({
      workspace: "Imported",
      scope: "workspace",
      skillName: "backend-implementation",
    });
    const syncedSkill = await service.getSkillDetail({
      workspace: "Synced",
      scope: "workspace",
      skillName: "backend-implementation",
    });

    assertEquals(
      listed[0]?.skillContext?.implementationGuidance,
      undefined,
    );
    assertEquals(
      detail?.skillContext?.implementationGuidance,
      implementationGuidance,
    );
    assertEquals(
      match.data.skills[0]?.skillContext?.implementationGuidance,
      undefined,
    );
    assertEquals(
      proposal.after.skillContext?.implementationGuidance,
      undefined,
    );
    assertEquals(applied.after.skillContext?.implementationGuidance, undefined);
    assertEquals(
      importedSkill?.skillContext?.implementationGuidance,
      implementationGuidance,
    );
    assertEquals(
      syncedSkill?.skillContext?.implementationGuidance,
      implementationGuidance,
    );
  } finally {
    repo.close();
  }
});

async function createSkillFileForService(
  skillName: string,
): Promise<{ root: string; file: string }> {
  const root = await Deno.makeTempDir();
  const skillDir = join(root, skillName);
  await Deno.mkdir(skillDir, { recursive: true });
  const file = join(skillDir, "SKILL.md");
  await Deno.writeTextFile(file, "# Backend Skill\n");
  return { root, file };
}

function implementationGuidanceFixture() {
  return {
    firstInspect: ["src/catalog/service.ts", "src/tools/schemas.ts"],
    implementationRules: ["Keep matching deterministic and local."],
    commonFixPatterns: [{
      problem: "Repeated validation logic",
      approach: "Extract a focused validator helper.",
      antiPattern: "Parsing input inside tool handlers.",
    }],
    testsToAdd: ["Add service tests for round-trip behavior."],
    verification: ["mise x deno@latest -- deno task test"],
    handoffChecklist: ["Report changed files and verification results."],
  };
}
