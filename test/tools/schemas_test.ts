import { assertEquals } from "@std/assert";
import {
  applySkillFileSyncInputSchema,
  applySkillUpdateInputSchema,
  applyWorkspaceCatalogSyncInputSchema,
  checkCatalogHealthInputSchema,
  clearWorkspaceSkillsInputSchema,
  clearWorkspaceSubagentsInputSchema,
  exportCatalogInputSchema,
  findMatchingSkillInputSchema,
  findMatchingSubagentInputSchema,
  findMatchingWorkspaceNoteInputSchema,
  generateAgentPromptInputSchema,
  getSkillDetailInputSchema,
  getSubagentDetailInputSchema,
  getUsageAnalyticsInputSchema,
  getWorkspaceDiagnosticsInputSchema,
  getWorkspaceNoteInputSchema,
  importCatalogInputSchema,
  introduceSkillInputSchema,
  introduceSubagentInputSchema,
  listSkillsInputSchema,
  listSubagentsInputSchema,
  listWorkspaceNotesInputSchema,
  previewSkillFileSyncInputSchema,
  previewWorkspaceCatalogSyncInputSchema,
  promoteSkillToGlobalInputSchema,
  proposeSkillUpdateInputSchema,
  registerWorkspaceAliasInputSchema,
  rememberWorkspaceNoteInputSchema,
  removeSkillInputSchema,
  removeSubagentInputSchema,
  removeWorkspaceNoteInputSchema,
  updateSkillInputSchema,
  updateSubagentInputSchema,
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

Deno.test("typed clear workspace schemas require confirm true", () => {
  assertEquals(
    clearWorkspaceSkillsInputSchema.safeParse({
      workspace: "LOR-MCP",
      confirm: true,
    }).success,
    true,
  );
  assertEquals(
    clearWorkspaceSubagentsInputSchema.safeParse({
      workspace: "LOR-MCP",
      confirm: true,
    }).success,
    true,
  );
  assertEquals(
    clearWorkspaceSkillsInputSchema.safeParse({
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

Deno.test("typed update schemas require an editable field", () => {
  assertEquals(
    updateSkillInputSchema.safeParse({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      scope: "global",
      primarySpecialty: "backend api",
    }).success,
    true,
  );
  assertEquals(
    updateSubagentInputSchema.safeParse({
      workspace: "LOR-MCP",
      subagentName: "api-test-subagent",
      specialtyTags: ["api", "tests"],
    }).success,
    true,
  );
  assertEquals(
    updateSkillInputSchema.safeParse({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
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
    getSkillDetailInputSchema.safeParse({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
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

Deno.test("typed remove schemas require workspace and typed key", () => {
  assertEquals(
    removeSkillInputSchema.safeParse({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
    }).success,
    true,
  );
  assertEquals(
    removeSubagentInputSchema.safeParse({
      workspace: "LOR-MCP",
      subagentName: "api-test-subagent",
      scope: "global",
    }).success,
    true,
  );
  assertEquals(
    removeSkillInputSchema.safeParse({
      workspace: "LOR-MCP",
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

Deno.test("getWorkspaceDiagnosticsInputSchema requires workspace", () => {
  assertEquals(
    getWorkspaceDiagnosticsInputSchema.safeParse({
      workspace: "LOR-MCP",
    }).success,
    true,
  );
  assertEquals(
    getWorkspaceDiagnosticsInputSchema.safeParse({
      workspace: "  ",
    }).success,
    false,
  );
  assertEquals(getWorkspaceDiagnosticsInputSchema.safeParse({}).success, false);
});

Deno.test("getUsageAnalyticsInputSchema accepts public V2 usage filters", () => {
  assertEquals(
    getUsageAnalyticsInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryType: "skill",
      scope: "global",
      entryKey: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
    }).success,
    true,
  );
  assertEquals(
    getUsageAnalyticsInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryType: "note",
      scope: "workspace",
      entryKey: "note-1",
    }).success,
    true,
  );
  assertEquals(
    getUsageAnalyticsInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryType: "note",
      scope: "global",
    }).success,
    false,
  );
  assertEquals(
    getUsageAnalyticsInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryType: "note",
      projectName: "Local Orchestration Router (LOR)",
    }).success,
    false,
  );
  assertEquals(
    getUsageAnalyticsInputSchema.safeParse({
      workspace: "LOR-MCP",
      entryType: "agent",
    }).success,
    false,
  );
});

Deno.test("workspace note schemas require scoped note inputs", () => {
  assertEquals(
    rememberWorkspaceNoteInputSchema.safeParse({
      workspace: "LOR-MCP",
      title: "Branch plan",
      body: "Keep changes scoped.",
      tags: ["branch-plan"],
    }).success,
    true,
  );
  assertEquals(
    rememberWorkspaceNoteInputSchema.safeParse({
      workspace: "LOR-MCP",
      title: " ",
      body: "Keep changes scoped.",
    }).success,
    false,
  );
  assertEquals(
    listWorkspaceNotesInputSchema.safeParse({
      workspace: "LOR-MCP",
      tags: ["review-summary"],
    }).success,
    true,
  );
  assertEquals(
    findMatchingWorkspaceNoteInputSchema.safeParse({
      workspace: "LOR-MCP",
      query: "branch plan",
      tags: ["branch-plan"],
      limit: 3,
    }).success,
    true,
  );
  assertEquals(
    findMatchingWorkspaceNoteInputSchema.safeParse({
      workspace: "LOR-MCP",
      query: "branch plan",
      limit: 0,
    }).success,
    false,
  );
  assertEquals(
    findMatchingWorkspaceNoteInputSchema.safeParse({
      workspace: "LOR-MCP",
      query: " ",
    }).success,
    false,
  );
  assertEquals(
    getWorkspaceNoteInputSchema.safeParse({
      workspace: "LOR-MCP",
      noteId: "note-1",
    }).success,
    true,
  );
  assertEquals(
    removeWorkspaceNoteInputSchema.safeParse({
      workspace: "LOR-MCP",
      noteId: "note-1",
    }).success,
    true,
  );
  assertEquals(
    getWorkspaceNoteInputSchema.safeParse({
      workspace: "LOR-MCP",
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

Deno.test("typed list and detail schemas accept type-specific keys", () => {
  assertEquals(
    listSkillsInputSchema.safeParse({
      workspace: "LOR-MCP",
      scope: "global",
    }).success,
    true,
  );
  assertEquals(
    listSubagentsInputSchema.safeParse({
      workspace: "LOR-MCP",
      scope: "workspace",
    }).success,
    true,
  );
  assertEquals(
    getSubagentDetailInputSchema.safeParse({
      workspace: "LOR-MCP",
      subagentName: "api-test-subagent",
      scope: "global",
    }).success,
    true,
  );
});

Deno.test("typed matching schemas accept task and hints", () => {
  const input = {
    workspace: "LOR-MCP",
    task: "write focused backend api tests",
    specialtyHints: ["backend"],
  };

  assertEquals(findMatchingSkillInputSchema.safeParse(input).success, true);
  assertEquals(findMatchingSubagentInputSchema.safeParse(input).success, true);
  assertEquals(
    findMatchingSkillInputSchema.safeParse({
      workspace: "LOR-MCP",
      specialtyHints: ["backend"],
    }).success,
    false,
  );
});
