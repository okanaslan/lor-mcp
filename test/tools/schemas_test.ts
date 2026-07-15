import { assertEquals } from "@std/assert";
import {
  clearWorkspaceCatalogInputSchema,
  prepareAgentHandoffInputSchema,
} from "@src/tools/schemas.ts";

Deno.test("clearWorkspaceCatalogInputSchema requires confirm true", () => {
  assertEquals(
    clearWorkspaceCatalogInputSchema.safeParse({
      workspace: "Agentic-Router",
      confirm: true,
    }).success,
    true,
  );
  assertEquals(
    clearWorkspaceCatalogInputSchema.safeParse({
      workspace: "Agentic-Router",
    }).success,
    false,
  );
  assertEquals(
    clearWorkspaceCatalogInputSchema.safeParse({
      workspace: "Agentic-Router",
      confirm: false,
    }).success,
    false,
  );
});

Deno.test("prepareAgentHandoffInputSchema requires workspace agent and task", () => {
  assertEquals(
    prepareAgentHandoffInputSchema.safeParse({
      workspace: "Agentic-Router",
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
      workspace: "Agentic-Router",
      task: "Review code",
    }).success,
    false,
  );
  assertEquals(
    prepareAgentHandoffInputSchema.safeParse({
      workspace: "Agentic-Router",
      agentEntryKey: "agent-1",
    }).success,
    false,
  );
});
