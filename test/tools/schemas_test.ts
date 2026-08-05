import { assertEquals } from "@std/assert";
import {
  applySkillFileSyncInputSchema,
  applySkillUpdateInputSchema,
  applyWorkspaceCatalogSyncInputSchema,
  checkCatalogHealthInputSchema,
  clearWorkspaceCatalogInputSchema,
  exportCatalogInputSchema,
  findMatchingCatalogEntryInputSchema,
  generateAgentPromptInputSchema,
  getAgentTaskStatusInputSchema,
  getCatalogEntryDetailInputSchema,
  importCatalogInputSchema,
  introduceAgentInputSchema,
  introduceSkillInputSchema,
  introduceSubagentInputSchema,
  listActiveTasksInputSchema,
  prepareAgentHandoffInputSchema,
  prepareAgentRegenerationInputSchema,
  previewSkillFileSyncInputSchema,
  previewWorkspaceCatalogSyncInputSchema,
  promoteSkillToGlobalInputSchema,
  proposeSkillUpdateInputSchema,
  registerWorkspaceAliasInputSchema,
  removeCatalogEntryInputSchema,
  retireAgentInputSchema,
  sendAgentTaskInputSchema,
  updateCatalogEntryInputSchema,
} from "@src/tools/schemas.ts";

Deno.test("introduceSubagentInputSchema accepts workspace and global prompt profiles", () => {
  const input = {
    workspace: "LOR-MCP",
    name: "api-test-subagent",
    displayName: "API Test Subagent",
    projectName: "Local Orchestration Router (LOR)",
    purpose: "Write focused backend API tests.",
    limitedScope: "Only inspect API handlers and related tests.",
    primarySpecialty: "backend api testing",
    specialtyTags: ["backend", "api", "tests"],
    agentReferences: [{
      entryType: "agent",
      name: "Backend Agent",
      entryKey: "agent-1",
      required: true,
    }],
    skillReferences: [{
      entryType: "skill",
      name: "okan-code-review",
      scope: "global",
    }],
    promptTemplate: "Handle {purpose} for {projectName}.",
    constraints: ["Do not edit unrelated files."],
    expectedOutput: "A concise test plan and patch summary.",
  };

  assertEquals(introduceSubagentInputSchema.safeParse(input).success, true);
  assertEquals(
    introduceSubagentInputSchema.safeParse({
      ...input,
      scope: "global",
      name: "global-api-test-subagent",
    }).success,
    true,
  );
  assertEquals(
    introduceSubagentInputSchema.safeParse({ ...input, name: " " }).success,
    false,
  );
});

Deno.test("introduceAgentInputSchema accepts optional replacement pointer", () => {
  assertEquals(
    introduceAgentInputSchema.safeParse({
      workspace: "LOR-MCP",
      codexSessionId: "agent-new",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
      replacesAgentEntryKey: "agent-old",
    }).success,
    true,
  );
  assertEquals(
    introduceAgentInputSchema.safeParse({
      workspace: "LOR-MCP",
      codexSessionId: "agent-new",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
      replacesAgentEntryKey: " ",
    }).success,
    false,
  );
});

Deno.test("introduceAgentInputSchema rejects global scope", () => {
  assertEquals(
    introduceAgentInputSchema.safeParse({
      workspace: "LOR-MCP",
      scope: "global",
      codexSessionId: "agent-new",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    }).success,
    false,
  );
});

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

Deno.test("delegated agent task schemas require scoped task identifiers", () => {
  assertEquals(
    sendAgentTaskInputSchema.safeParse({
      workspace: "LOR-MCP",
      agentEntryKey: "agent-1",
      task: "Implement backend route",
      context: "Use existing patterns.",
    }).success,
    true,
  );
  assertEquals(
    sendAgentTaskInputSchema.safeParse({
      workspace: "LOR-MCP",
      agentEntryKey: "agent-1",
      task: " ",
    }).success,
    false,
  );
  assertEquals(
    getAgentTaskStatusInputSchema.safeParse({
      workspace: "LOR-MCP",
      taskId: "task-1",
    }).success,
    true,
  );
  assertEquals(
    listActiveTasksInputSchema.safeParse({
      workspace: "LOR-MCP",
      agentEntryKey: "agent-1",
    }).success,
    true,
  );
});

Deno.test("prepareAgentRegenerationInputSchema requires workspace and agent", () => {
  assertEquals(
    prepareAgentRegenerationInputSchema.safeParse({
      workspace: "LOR-MCP",
      agentEntryKey: "agent-1",
      reason: "Context is too large",
      carryForwardContext: "Preserve repo-specific instructions",
      replacementTask: "Read the repo and wait for work",
      includeRegistrationInstructions: false,
    }).success,
    true,
  );
  assertEquals(
    prepareAgentRegenerationInputSchema.safeParse({
      agentEntryKey: "agent-1",
    }).success,
    false,
  );
  assertEquals(
    prepareAgentRegenerationInputSchema.safeParse({
      workspace: "LOR-MCP",
    }).success,
    false,
  );
  assertEquals(
    prepareAgentRegenerationInputSchema.safeParse({
      workspace: "LOR-MCP",
      agentEntryKey: "agent-1",
      includeRegistrationInstructions: "yes",
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

Deno.test("retireAgentInputSchema requires agent and confirm true", () => {
  assertEquals(
    retireAgentInputSchema.safeParse({
      workspace: "LOR-MCP",
      agentEntryKey: "agent-old",
      reason: "Replaced after context regeneration.",
      replacedByAgentEntryKey: "agent-new",
      confirm: true,
    }).success,
    true,
  );
  assertEquals(
    retireAgentInputSchema.safeParse({
      workspace: "LOR-MCP",
      agentEntryKey: "agent-old",
    }).success,
    false,
  );
  assertEquals(
    retireAgentInputSchema.safeParse({
      workspace: "LOR-MCP",
      agentEntryKey: "agent-old",
      confirm: false,
    }).success,
    false,
  );
  assertEquals(
    retireAgentInputSchema.safeParse({
      workspace: "LOR-MCP",
      agentEntryKey: " ",
      confirm: true,
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

Deno.test("skill schemas accept explicit global scope", () => {
  assertEquals(
    introduceSkillInputSchema.safeParse({
      workspace: "LOR-MCP",
      scope: "global",
      skillName: "backend-skill",
      projectName: "Global Backend",
      displayName: "Global Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    }).success,
    true,
  );
  assertEquals(
    getCatalogEntryDetailInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryType: "skill",
      entryKey: "backend-skill",
      scope: "global",
    }).success,
    true,
  );
  assertEquals(
    proposeSkillUpdateInputSchema.safeParse({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      scope: "global",
      reason: "Improve routing metadata.",
      metadata: {
        specialtyTags: ["deno", "mcp"],
      },
    }).success,
    true,
  );
  assertEquals(
    promoteSkillToGlobalInputSchema.safeParse({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
    }).success,
    true,
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
  assertEquals(
    removeCatalogEntryInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryType: "subagent",
      entryKey: "api-test-subagent",
      scope: "global",
    }).success,
    true,
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

Deno.test("importCatalogInputSchema accepts workspace subagent entries", () => {
  const validCatalog = {
    version: 1,
    exportedAt: "2026-07-17T00:00:00.000Z",
    workspace: "Source",
    filters: {},
    entries: [{
      entryType: "subagent",
      name: "api-test-subagent",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "API Test Subagent",
      purpose: "Write focused backend API tests.",
      limitedScope: "Only inspect API handlers and related tests.",
      primarySpecialty: "backend api testing",
      specialtyTags: ["backend", "api", "tests"],
      agentReferences: [],
      skillReferences: [],
      unresolvedReferences: [],
      constraints: ["Do not edit unrelated files."],
      expectedOutput: "A concise test plan and patch summary.",
      verificationStatus: "verified",
      verificationSource: "catalog_export",
      verifiedAt: "2026-07-17T00:00:00.000Z",
    }],
  };

  assertEquals(
    importCatalogInputSchema.safeParse({
      workspace: "LOR-MCP",
      catalog: validCatalog,
    }).success,
    true,
  );
});

Deno.test("workspace catalog sync schemas require source and target workspaces", () => {
  assertEquals(
    previewWorkspaceCatalogSyncInputSchema.safeParse({
      sourceWorkspace: "source-workspace",
      targetWorkspace: "target-workspace",
      projectName: "Local Orchestration Router (LOR)",
      skillNames: ["backend-skill"],
      subagentNames: ["api-test-subagent"],
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
  assertEquals(
    previewWorkspaceCatalogSyncInputSchema.safeParse({
      sourceWorkspace: "source-workspace",
      targetWorkspace: "target-workspace",
      subagentNames: [],
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
  assertEquals(
    checkCatalogHealthInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryType: "subagent",
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

Deno.test("findMatchingCatalogEntryInputSchema accepts subagent preferred type", () => {
  assertEquals(
    findMatchingCatalogEntryInputSchema.safeParse({
      workspace: "LOR-MCP",
      task: "write focused backend api tests",
      preferredType: "subagent",
      specialtyHints: ["backend"],
    }).success,
    true,
  );
});
