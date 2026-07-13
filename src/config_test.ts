import { assertEquals, assertThrows } from "@std/assert";
import { join } from "@std/path";
import { loadConfig, loadServeConfig } from "@src/config.ts";

Deno.test("loadConfig trims explicit environment settings", () => {
  const config = loadConfig({
    AGENTIC_ROUTER_CATALOG_NAMESPACE: " workspace-a ",
    AGENTIC_ROUTER_DB_PATH: " /tmp/router.db ",
  });

  assertEquals(config.catalogNamespace, "workspace-a");
  assertEquals(config.dbPath, "/tmp/router.db");
});

Deno.test("loadConfig uses server-owned defaults without env settings", () => {
  const cwd = "/workspaces/Agentic-Router";
  const config = loadConfig({}, { cwd });

  assertEquals(config.catalogNamespace, "Agentic-Router");
  assertEquals(config.dbPath, join(cwd, ".agentic-router", "catalog.db"));
});

Deno.test("loadConfig lets explicit env settings override defaults", () => {
  const cwd = "/workspaces/Agentic-Router";
  const config = loadConfig({
    AGENTIC_ROUTER_CATALOG_NAMESPACE: "custom-namespace",
    AGENTIC_ROUTER_DB_PATH: "/tmp/custom/catalog.db",
  }, { cwd });

  assertEquals(config.catalogNamespace, "custom-namespace");
  assertEquals(config.dbPath, "/tmp/custom/catalog.db");
});

Deno.test("loadServeConfig uses local HTTP defaults", () => {
  assertEquals(loadServeConfig({}), {
    host: "127.0.0.1",
    port: 8765,
  });
});

Deno.test("loadServeConfig lets env override host and port", () => {
  assertEquals(
    loadServeConfig({
      AGENTIC_ROUTER_HOST: "localhost",
      AGENTIC_ROUTER_PORT: "9000",
    }),
    {
      host: "localhost",
      port: 9000,
    },
  );
});

Deno.test("loadServeConfig rejects invalid ports", () => {
  assertThrows(
    () => loadServeConfig({ AGENTIC_ROUTER_PORT: "not-a-port" }),
    Error,
    "AGENTIC_ROUTER_PORT",
  );
});
