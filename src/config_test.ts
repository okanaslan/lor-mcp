import { assertEquals, assertThrows } from "@std/assert";
import { loadConfig } from "@src/config.ts";

Deno.test("loadConfig trims required environment settings", () => {
  const config = loadConfig({
    AGENTIC_ROUTER_CATALOG_NAMESPACE: " workspace-a ",
    AGENTIC_ROUTER_DB_PATH: " /tmp/router.db ",
    AGENTIC_ROUTER_AGENT_REGISTRY_PATH: " /tmp/agents.json ",
    AGENTIC_ROUTER_SKILL_ROOTS: " /tmp/skills ",
  });

  assertEquals(config.catalogNamespace, "workspace-a");
  assertEquals(config.dbPath, "/tmp/router.db");
  assertEquals(config.agentRegistryPath, "/tmp/agents.json");
  assertEquals(config.skillRoots, ["/tmp/skills"]);
});

Deno.test("loadConfig rejects missing namespace without creating a default", () => {
  assertThrows(
    () =>
      loadConfig({
        AGENTIC_ROUTER_DB_PATH: "/tmp/router.db",
        AGENTIC_ROUTER_AGENT_REGISTRY_PATH: "/tmp/agents.json",
        AGENTIC_ROUTER_SKILL_ROOTS: "/tmp/skills",
      }),
    Error,
    "AGENTIC_ROUTER_CATALOG_NAMESPACE",
  );
});
