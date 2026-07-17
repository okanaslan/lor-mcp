import { assertEquals } from "@std/assert";
import {
  clearWorkspaceCatalogInputSchema,
  generateAgentPromptInputSchema,
  prepareAgentHandoffInputSchema,
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
