import { assertEquals, assertThrows } from "@std/assert";
import { join } from "@std/path";
import { loadConfig, loadLogConfig, loadServeConfig } from "@src/config.ts";

Deno.test("loadConfig trims explicit LOR database path setting", () => {
  const config = loadConfig({
    LOR_DB_PATH: " /tmp/router.db ",
  });

  assertEquals(config.dbPath, "/tmp/router.db");
});

Deno.test("loadConfig uses server-owned storage defaults without env settings", () => {
  const cwd = "/workspaces/LOR-MCP";
  const config = loadConfig({}, { cwd });

  assertEquals(config.dbPath, join(cwd, ".lor-mcp", "catalog.db"));
});

Deno.test("loadConfig lets explicit database path override default", () => {
  const cwd = "/workspaces/LOR-MCP";
  const config = loadConfig({
    LOR_DB_PATH: "/tmp/custom/catalog.db",
  }, { cwd });

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
      LOR_HOST: "localhost",
      LOR_PORT: "9000",
    }),
    {
      host: "localhost",
      port: 9000,
    },
  );
});

Deno.test("loadServeConfig rejects invalid ports", () => {
  assertThrows(
    () => loadServeConfig({ LOR_PORT: "not-a-port" }),
    Error,
    "LOR_PORT",
  );
});

Deno.test("loadLogConfig uses readable local defaults", () => {
  assertEquals(loadLogConfig({}), {
    level: "info",
    format: "pretty",
  });
});

Deno.test("loadLogConfig lets env override level and format", () => {
  assertEquals(
    loadLogConfig({
      LOR_LOG_LEVEL: " debug ",
      LOR_LOG_FORMAT: " json ",
    }),
    {
      level: "debug",
      format: "json",
    },
  );
});

Deno.test("loadLogConfig rejects invalid level and format", () => {
  assertThrows(
    () => loadLogConfig({ LOR_LOG_LEVEL: "verbose" }),
    Error,
    "LOR_LOG_LEVEL",
  );
  assertThrows(
    () => loadLogConfig({ LOR_LOG_FORMAT: "text" }),
    Error,
    "LOR_LOG_FORMAT",
  );
});
