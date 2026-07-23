import { assertEquals, assertRejects } from "@std/assert";
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

Deno.test("CatalogService introduces skills without skill root pre-registration", async () => {
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

    const entries = await service.listEntries({ workspace: "LOR-MCP" });
    assertEquals(created.verificationStatus, "verified");
    assertEquals(created.verificationSource, "mcp_introduction");
    assertEquals(entries.map((entry) => entry.entryKey), ["missing-skill"]);
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

Deno.test("CatalogService resolves aliases for clear and handoff operations", async () => {
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
      handoff: {
        whenToUse: "Backend API changes",
        handoffPromptTemplate: "Handle {task} in {projectName}",
        requiredContext: ["task"],
        expectedOutput: "Patch summary",
        constraints: ["Stay scoped"],
      },
    });
    await service.introduceSkill({
      workspace,
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const handoff = await service.prepareAgentHandoff({
      workspace: "Agentic-Router",
      agentEntryKey: "agent-1",
      task: "fix workspace aliasing",
    });
    const cleared = await service.clearWorkspaceCatalog({
      workspace: "Agentic-Router",
      entryType: "skill",
      confirm: true,
    });
    const remaining = await service.listEntries({ workspace });

    assertEquals(handoff.workspace, workspace);
    assertEquals(handoff.usedStoredHandoff, true);
    assertEquals(cleared.workspace, workspace);
    assertEquals(cleared.deletedSkills, 1);
    assertEquals(remaining.map((entry) => entry.entryKey), ["agent-1"]);
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
      "At least one skillContext or metadata field is required",
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
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await service.introduceSkill({
      workspace: "workspace-b",
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
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService import skips or fails duplicate entries", async () => {
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
      skillName: "qa-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "QA Skill",
      primarySpecialty: "quality assurance",
      specialtyTags: ["qa"],
    });
    await service.introduceSkill({
      workspace: "target-workspace",
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
      skillName: "qa-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "QA Skill",
      primarySpecialty: "quality assurance",
      specialtyTags: ["qa"],
    });
    await service.introduceSkill({
      workspace: "target-workspace",
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
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await service.introduceSkill({
      workspace: "other-workspace",
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

Deno.test("CatalogService prepares handoff from stored template", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "LOR-MCP",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api", "mcp"],
      handoff: {
        whenToUse: "Backend API changes",
        handoffPromptTemplate:
          "Agent {agentDisplayName} for {projectName}: handle {task}. Context: {context}. Tags: {specialtyTags}. Keep {unknown}.",
        requiredContext: ["diff", "acceptance criteria"],
        expectedOutput: "Patch summary",
        constraints: ["Stay scoped"],
      },
    });

    const result = await service.prepareAgentHandoff({
      workspace: "LOR-MCP",
      agentEntryKey: "agent-1",
      task: "Add a route",
      context: "Use existing patterns",
    });

    assertEquals(result.usedStoredHandoff, true);
    assertEquals(result.targetAgent, {
      entryKey: "agent-1",
      codexSessionId: "agent-1",
      displayName: "Backend Agent",
      projectName: "Local Orchestration Router (LOR)",
      primarySpecialty: "backend api",
      specialtyTags: ["api", "mcp"],
    });
    assertEquals(
      result.prompt,
      "Agent Backend Agent for Local Orchestration Router (LOR): handle Add a route. Context: Use existing patterns. Tags: api, mcp. Keep {unknown}.",
    );
    assertEquals(result.missingContext, ["diff", "acceptance criteria"]);
    assertEquals(result.delivery.mode, "manual");
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService prepares generic handoff without stored metadata", async () => {
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

    const result = await service.prepareAgentHandoff({
      workspace: "LOR-MCP",
      agentEntryKey: "agent-1",
      task: "Review storage code",
      context: "Focus on SQLite behavior",
    });

    assertEquals(result.usedStoredHandoff, false);
    assertEquals(result.handoff, undefined);
    assertEquals(result.missingContext, []);
    assertEquals(
      result.prompt,
      [
        "You are Backend Agent, a Codex agent for Local Orchestration Router (LOR).",
        "Primary specialty: backend api.",
        "Specialty tags: api.",
        "",
        "Task:",
        "Review storage code",
        "",
        "Context:",
        "Focus on SQLite behavior",
        "",
        "Expected output:",
        "Return a concise result that the requesting agent can use to continue the original task.",
      ].join("\n"),
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService validates prepare handoff inputs", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await assertRejects(
      () =>
        service.prepareAgentHandoff({
          workspace: "LOR-MCP",
          agentEntryKey: " ",
          task: "Review code",
        }),
      Error,
      "agentEntryKey is required",
    );
    await assertRejects(
      () =>
        service.prepareAgentHandoff({
          workspace: "LOR-MCP",
          agentEntryKey: "agent-1",
          task: " ",
        }),
      Error,
      "task is required",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService returns not_found for missing handoff target", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await assertRejects(
      () =>
        service.prepareAgentHandoff({
          workspace: "LOR-MCP",
          agentEntryKey: "missing-agent",
          task: "Review code",
        }),
      Error,
      "not_found",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService prepare handoff does not cross workspaces", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "workspace-a",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    await assertRejects(
      () =>
        service.prepareAgentHandoff({
          workspace: "workspace-b",
          agentEntryKey: "agent-1",
          task: "Review code",
        }),
      Error,
      "not_found",
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
