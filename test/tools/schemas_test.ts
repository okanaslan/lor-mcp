import { assertEquals } from "@std/assert";
import {
  clearWorkspaceCatalogInputSchema,
  generateAgentPromptInputSchema,
  prepareAgentHandoffInputSchema,
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
