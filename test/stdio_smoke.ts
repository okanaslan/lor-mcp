import { assert, assertEquals } from "@std/assert";
import { fromFileUrl, join } from "@std/path";
import { Client } from "@mcp/client";
import { StdioClientTransport } from "@mcp/client-stdio";

// Opt-in subprocess check, separate from the default suite's permissions.
const root = await Deno.makeTempDir();
const client = new Client({ name: "stdio-smoke", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: "deno",
  args: [
    "run",
    "--allow-env",
    "--allow-read",
    "--allow-write",
    "--allow-ffi",
    "--allow-sys=hostname",
    "src/main.ts",
  ],
  cwd: fromFileUrl(new URL("../", import.meta.url)),
  env: {
    LOR_DB_PATH: join(root, "catalog.db"),
    LOR_ALLOWED_WORKSPACES: "smoke",
    LOR_GLOBAL_WRITE: "false",
    LOR_LOG_FORMAT: "json",
    LOR_LOG_LEVEL: "silent",
  },
  stderr: "pipe",
});
try {
  await client.connect(transport);
  const listed = await client.listTools();
  assert(
    listed.tools.some((tool: { name: string }) =>
      tool.name === "get_default_skill"
    ),
  );
  const defaults = await client.callTool({
    name: "get_default_skill",
    arguments: { name: "lor-find-context" },
  });
  assertEquals(defaults.isError, undefined);
  const note = await client.callTool({
    name: "remember_workspace_note",
    arguments: {
      workspace: "smoke",
      title: "Smoke",
      body: "Disposable subprocess verification",
      tags: ["test"],
      idempotencyKey: "stdio-note",
    },
  });
  assertEquals(note.isError, undefined);
  const denied = await client.callTool({
    name: "list_workspace_notes",
    arguments: { workspace: "denied" },
  });
  assertEquals(denied.isError, true);
  console.log(
    "Stdio subprocess smoke passed: handshake, discovery, bundled read, SQLite write and denied workspace.",
  );
} finally {
  await client.close();
  await Deno.remove(root, { recursive: true });
}
