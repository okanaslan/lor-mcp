import { assertEquals } from "@std/assert";
import { LOR_MCP_VERSION } from "@src/version.ts";

Deno.test("LOR_MCP_VERSION matches VERSION file", async () => {
  const versionFile = await Deno.readTextFile("VERSION");

  assertEquals(LOR_MCP_VERSION, versionFile.trim());
});
