import { assert, assertEquals } from "@std/assert";
import { fromFileUrl, join } from "@std/path";
import { Client } from "@mcp/client";
import { StdioClientTransport } from "@mcp/client-stdio";
import { fingerprint } from "@src/catalog/revision.ts";

// Opt-in real process restart check, separate from default test permissions.
const root = await Deno.makeTempDir();
let previous:
  | { wireContract: string; buildId: string; toolContract: string }
  | undefined;
try {
  for (let run = 0; run < 2; run++) {
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
      assert(client.getInstructions().includes("expectedRevision"));
      const listed = await client.listTools();
      assert(
        listed.tools.some((tool: { name: string }) =>
          tool.name === "read_result_page"
        ),
      );
      const update = listed.tools.find((tool: { name: string }) =>
        tool.name === "update_skill"
      );
      assert(update.inputSchema.required.includes("expectedRevision"));
      assert(
        (await client.listPrompts()).prompts.some((prompt: { name: string }) =>
          prompt.name === "lor-agent-prompt"
        ),
      );
      assert(
        (await client.listResourceTemplates()).resourceTemplates.length >= 2,
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
      const notes = await client.callTool({
        name: "list_workspace_notes",
        arguments: { workspace: "smoke" },
      });
      assertEquals(notes.structuredContent.data.total, 1);
      const resource = await client.readResource({
        uri: notes.structuredContent.data.notes[0].resourceUri,
      });
      assertEquals(
        JSON.parse(resource.contents[0].text).data.body,
        "Disposable subprocess verification",
      );
      const denied = await client.callTool({
        name: "list_workspace_notes",
        arguments: { workspace: "denied" },
      });
      assertEquals(denied.isError, true);
      const diagnostic = await client.callTool({
        name: "get_workspace_diagnostics",
        arguments: { workspace: "smoke" },
      });
      const identity = diagnostic.structuredContent.data.runtimeStatus;
      assertEquals(identity.buildIdSource, "source-snapshot");
      assert(/^[a-f0-9]{64}$/.test(identity.buildId));
      const current = {
        wireContract: fingerprint(listed.tools),
        buildId: identity.buildId,
        toolContract: identity.toolContractFingerprint,
      };
      if (previous) assertEquals(current, previous);
      previous = current;
    } finally {
      await client.close();
    }
  }
  console.log(
    "Stdio restart smoke passed: fresh process discovery, required schemas, instructions, prompts/resources, build fingerprints, durable retry and denied workspace.",
  );
} finally {
  await Deno.remove(root, { recursive: true });
}
