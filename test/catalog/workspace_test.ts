import { assertEquals } from "@std/assert";
import {
  isAbsoluteWorkspacePath,
  normalizeWorkspace,
  workspaceBasename,
} from "@src/catalog/workspace.ts";

Deno.test("normalizeWorkspace trims whitespace", () => {
  assertEquals(normalizeWorkspace("  LOR-MCP  "), "LOR-MCP");
});

Deno.test("normalizeWorkspace removes trailing slash from path-shaped workspaces", () => {
  assertEquals(
    normalizeWorkspace(" /Users/ablo//repo/Agentic-Router/ "),
    "/Users/ablo/repo/Agentic-Router",
  );
});

Deno.test("normalizeWorkspace preserves non-path slugs", () => {
  assertEquals(normalizeWorkspace("Agentic-Router"), "Agentic-Router");
});

Deno.test("normalizeWorkspace preserves case and does not basename-map paths", () => {
  assertEquals(
    normalizeWorkspace("/Users/ablo/Repo/Agentic-Router"),
    "/Users/ablo/Repo/Agentic-Router",
  );
});

Deno.test("workspaceBasename only returns names for absolute paths", () => {
  assertEquals(isAbsoluteWorkspacePath("/Users/ablo/repo"), true);
  assertEquals(workspaceBasename("/Users/ablo/repo"), "repo");
  assertEquals(isAbsoluteWorkspacePath("Agentic-Router"), false);
  assertEquals(workspaceBasename("Agentic-Router"), undefined);
});
