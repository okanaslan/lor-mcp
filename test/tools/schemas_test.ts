import { assertEquals } from "@std/assert";
import {
  applySkillFileSyncInputSchema,
  applySkillUpdateInputSchema,
  applyWorkspaceCatalogSyncInputSchema,
  checkCatalogHealthInputSchema,
  clearWorkspaceCatalogInputSchema,
  exportCatalogInputSchema,
  generateAgentPromptInputSchema,
  importCatalogInputSchema,
  prepareAgentHandoffInputSchema,
  previewSkillFileSyncInputSchema,
  previewWorkspaceCatalogSyncInputSchema,
  proposeSkillUpdateInputSchema,
  registerWorkspaceAliasInputSchema,
  removeCatalogEntryInputSchema,
  updateCatalogEntryInputSchema,
} from "@src/tools/schemas.ts";

Deno.test("clearWorkspaceCatalogInputSchema requires confirm true", () => {
  assertEquals(
    clearWorkspaceCatalogInputSchema.safeParse({
      workspace: "LOR-MCP",
      confirm: true,
    }).success,
    true,
  );
  assertEquals(
    clearWorkspaceCatalogInputSchema.safeParse({
      workspace: "LOR-MCP",
    }).success,
    false,
  );
  assertEquals(
    clearWorkspaceCatalogInputSchema.safeParse({
      workspace: "LOR-MCP",
      confirm: false,
    }).success,
    false,
  );
});

Deno.test("registerWorkspaceAliasInputSchema requires workspace and alias", () => {
  assertEquals(
    registerWorkspaceAliasInputSchema.safeParse({
      workspace: "/Users/ablo/repo/Agentic-Router",
      alias: "Agentic-Router",
    }).success,
    true,
  );
  assertEquals(
    registerWorkspaceAliasInputSchema.safeParse({
      workspace: "/Users/ablo/repo/Agentic-Router",
      alias: "Agentic-Router",
      confirm: true,
    }).success,
    true,
  );
  assertEquals(
    registerWorkspaceAliasInputSchema.safeParse({
      workspace: "/Users/ablo/repo/Agentic-Router",
    }).success,
    false,
  );
  assertEquals(
    registerWorkspaceAliasInputSchema.safeParse({
      workspace: "/Users/ablo/repo/Agentic-Router",
      alias: "Agentic-Router",
      confirm: false,
    }).success,
    false,
  );
});

Deno.test("prepareAgentHandoffInputSchema requires workspace agent and task", () => {
  assertEquals(
    prepareAgentHandoffInputSchema.safeParse({
      workspace: "LOR-MCP",
      agentEntryKey: "agent-1",
      task: "Review code",
    }).success,
    true,
  );
  assertEquals(
    prepareAgentHandoffInputSchema.safeParse({
      agentEntryKey: "agent-1",
      task: "Review code",
    }).success,
    false,
  );
  assertEquals(
    prepareAgentHandoffInputSchema.safeParse({
      workspace: "LOR-MCP",
      task: "Review code",
    }).success,
    false,
  );
  assertEquals(
    prepareAgentHandoffInputSchema.safeParse({
      workspace: "LOR-MCP",
      agentEntryKey: "agent-1",
    }).success,
    false,
  );
});

Deno.test("updateCatalogEntryInputSchema requires an editable field", () => {
  assertEquals(
    updateCatalogEntryInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryType: "agent",
      entryKey: "agent-1",
      displayName: "Backend Agent",
    }).success,
    true,
  );
  assertEquals(
    updateCatalogEntryInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryType: "agent",
      entryKey: "agent-1",
    }).success,
    false,
  );
  assertEquals(
    updateCatalogEntryInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryType: "agent",
      entryKey: "agent-1",
      specialtyTags: [],
    }).success,
    false,
  );
});

Deno.test("skill update schemas require proposal content and confirmation", () => {
  assertEquals(
    proposeSkillUpdateInputSchema.safeParse({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      reason: "Improve routing context.",
      skillContext: {
        whenToUse: "Backend MCP changes.",
      },
    }).success,
    true,
  );
  assertEquals(
    proposeSkillUpdateInputSchema.safeParse({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      reason: "Improve routing metadata.",
      metadata: {
        specialtyTags: ["deno", "mcp"],
      },
    }).success,
    true,
  );
  assertEquals(
    proposeSkillUpdateInputSchema.safeParse({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      reason: "Improve context.",
    }).success,
    false,
  );
  assertEquals(
    applySkillUpdateInputSchema.safeParse({
      workspace: "LOR-MCP",
      proposalId: "proposal-1",
      confirm: true,
    }).success,
    true,
  );
  assertEquals(
    applySkillUpdateInputSchema.safeParse({
      workspace: "LOR-MCP",
      proposalId: "proposal-1",
    }).success,
    false,
  );
});

Deno.test("skill file sync schemas require proposal and confirmation", () => {
  assertEquals(
    previewSkillFileSyncInputSchema.safeParse({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      proposalId: "proposal-1",
    }).success,
    true,
  );
  assertEquals(
    previewSkillFileSyncInputSchema.safeParse({
      workspace: "LOR-MCP",
      proposalId: "proposal-1",
    }).success,
    false,
  );
  assertEquals(
    applySkillFileSyncInputSchema.safeParse({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      proposalId: "proposal-1",
      confirm: true,
    }).success,
    true,
  );
  assertEquals(
    applySkillFileSyncInputSchema.safeParse({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      proposalId: "proposal-1",
      confirm: false,
    }).success,
    false,
  );
});

Deno.test("removeCatalogEntryInputSchema requires workspace type and key", () => {
  assertEquals(
    removeCatalogEntryInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryType: "skill",
      entryKey: "backend-skill",
    }).success,
    true,
  );
  assertEquals(
    removeCatalogEntryInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryKey: "backend-skill",
    }).success,
    false,
  );
  assertEquals(
    removeCatalogEntryInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryType: "skill",
    }).success,
    false,
  );
});

Deno.test("exportCatalogInputSchema accepts optional filters", () => {
  assertEquals(
    exportCatalogInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryType: "agent",
      projectName: "Local Orchestration Router (LOR)",
    }).success,
    true,
  );
  assertEquals(
    exportCatalogInputSchema.safeParse({
      entryType: "agent",
    }).success,
    false,
  );
});

Deno.test("importCatalogInputSchema requires versioned catalog data", () => {
  const validCatalog = {
    version: 1,
    exportedAt: "2026-07-17T00:00:00.000Z",
    workspace: "Source",
    filters: {},
    entries: [{
      entryType: "skill",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
      verificationStatus: "verified",
      verificationSource: "catalog_export",
      verifiedAt: "2026-07-17T00:00:00.000Z",
    }],
  };

  assertEquals(
    importCatalogInputSchema.safeParse({
      workspace: "LOR-MCP",
      conflictStrategy: "skip",
      catalog: validCatalog,
    }).success,
    true,
  );
  assertEquals(
    importCatalogInputSchema.safeParse({
      workspace: "LOR-MCP",
      catalog: { ...validCatalog, version: 2 },
    }).success,
    false,
  );
  assertEquals(
    importCatalogInputSchema.safeParse({
      workspace: "LOR-MCP",
      conflictStrategy: "overwrite",
      catalog: validCatalog,
    }).success,
    false,
  );
});

Deno.test("workspace catalog sync schemas require source and target workspaces", () => {
  assertEquals(
    previewWorkspaceCatalogSyncInputSchema.safeParse({
      sourceWorkspace: "source-workspace",
      targetWorkspace: "target-workspace",
      projectName: "Local Orchestration Router (LOR)",
      skillNames: ["backend-skill"],
      agentPromptRoles: ["backend"],
    }).success,
    true,
  );
  assertEquals(
    previewWorkspaceCatalogSyncInputSchema.safeParse({
      targetWorkspace: "target-workspace",
    }).success,
    false,
  );
  assertEquals(
    previewWorkspaceCatalogSyncInputSchema.safeParse({
      sourceWorkspace: "source-workspace",
    }).success,
    false,
  );
  assertEquals(
    previewWorkspaceCatalogSyncInputSchema.safeParse({
      sourceWorkspace: "source-workspace",
      targetWorkspace: "target-workspace",
      skillNames: [],
    }).success,
    false,
  );
});

Deno.test("applyWorkspaceCatalogSyncInputSchema requires confirm true", () => {
  assertEquals(
    applyWorkspaceCatalogSyncInputSchema.safeParse({
      sourceWorkspace: "source-workspace",
      targetWorkspace: "target-workspace",
      confirm: true,
    }).success,
    true,
  );
  assertEquals(
    applyWorkspaceCatalogSyncInputSchema.safeParse({
      sourceWorkspace: "source-workspace",
      targetWorkspace: "target-workspace",
    }).success,
    false,
  );
  assertEquals(
    applyWorkspaceCatalogSyncInputSchema.safeParse({
      sourceWorkspace: "source-workspace",
      targetWorkspace: "target-workspace",
      confirm: false,
    }).success,
    false,
  );
});

Deno.test("checkCatalogHealthInputSchema accepts filters and requires type for key", () => {
  assertEquals(
    checkCatalogHealthInputSchema.safeParse({
      workspace: "LOR-MCP",
    }).success,
    true,
  );
  assertEquals(
    checkCatalogHealthInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryType: "skill",
      projectName: "Local Orchestration Router (LOR)",
      entryKey: "backend-skill",
    }).success,
    true,
  );
  assertEquals(
    checkCatalogHealthInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryKey: "backend-skill",
    }).success,
    false,
  );
});

Deno.test("generateAgentPromptInputSchema requires workspace and role", () => {
  assertEquals(
    generateAgentPromptInputSchema.safeParse({
      workspace: "LOR-MCP",
      role: "backend",
      projectName: "Local Orchestration Router (LOR)",
      task: "Add a tool",
      context: "Use existing patterns",
      constraints: "Stay scoped",
    }).success,
    true,
  );
  assertEquals(
    generateAgentPromptInputSchema.safeParse({
      role: "backend",
    }).success,
    false,
  );
  assertEquals(
    generateAgentPromptInputSchema.safeParse({
      workspace: "LOR-MCP",
    }).success,
    false,
  );
});
