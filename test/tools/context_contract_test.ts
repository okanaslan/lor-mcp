import { assert, assertEquals, assertExists, assertRejects } from "@std/assert";
import { join } from "@std/path";
import { Client } from "@mcp/client";
import { StreamableHTTPClientTransport } from "@mcp/client-http";
import { createHttpMcpHandler } from "@src/http_server.ts";
import { loadConfig } from "@src/config.ts";
import { createDefaultRuntime } from "@src/tools/runtime.ts";
import { catalogResourceUri } from "@src/catalog/context.ts";
import { generateAgentPrompt } from "@src/agent_prompts/generator.ts";
import { BUILD_IDENTITY } from "@src/build.ts";
import { MAX_RESULT_BYTES } from "@src/tools/result_pages.ts";

async function withClient(
  run: (client: Client, config: ReturnType<typeof loadConfig>) => Promise<void>,
) {
  const root = await Deno.makeTempDir();
  const config = loadConfig({
    LOR_DB_PATH: join(root, "catalog.db"),
    LOR_ALLOWED_WORKSPACES: "/workspace/encoded %2F project",
    LOR_GLOBAL_WRITE: "true",
  }, { cwd: root });
  const handler = createHttpMcpHandler({
    runtimeFactory: () => createDefaultRuntime({ config }),
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => handler(new Request(input, init));
  const client = new Client({ name: "context-test", version: "1" });
  const transport = new StreamableHTTPClientTransport(
    new URL("http://127.0.0.1:8765/mcp"),
  );
  try {
    await client.connect(transport);
    await run(client, config);
  } finally {
    try {
      await transport.terminateSession();
      await client.close();
    } finally {
      globalThis.fetch = originalFetch;
      await Deno.remove(root, { recursive: true });
    }
  }
}

Deno.test("wire schemas require safety preconditions and describe continuation fields", () =>
  withClient(async (client) => {
    const { tools } = await client.listTools();
    for (
      const name of [
        "update_skill",
        "update_subagent",
        "remove_skill",
        "remove_subagent",
        "apply_skill_file_sync",
        "apply_workspace_catalog_sync",
      ]
    ) {
      const tool = tools.find((tool: { name: string }) => tool.name === name);
      const field = name.startsWith("apply")
        ? "previewDigest"
        : "expectedRevision";
      assert(tool.inputSchema.required.includes(field), name);
    }
    for (
      const [name, field] of [
        ["list_skills", "nextCursor"],
        ["list_subagents", "total"],
        ["preview_skill_file_sync", "previewDigest"],
        ["preview_workspace_catalog_sync", "previewDigest"],
        ["get_workspace_diagnostics", "toolContractFingerprint"],
      ]
    ) {
      const tool = tools.find((tool: { name: string }) => tool.name === name);
      assert(
        JSON.stringify(tool.outputSchema).includes('"' + field + '"'),
        name,
      );
    }
    assert(client.getInstructions().includes("expectedRevision"));
    assert(client.getInstructions().includes("previewDigest"));
    const result = await client.callTool({
      name: "update_skill",
      arguments: {
        workspace: "/workspace/encoded %2F project",
        skillName: "s",
        displayName: "changed",
      },
    });
    assertEquals(result.isError, true);
  }));

Deno.test("catalog resources preserve encoded identifiers and enforce scope and caller policy on every read", () =>
  withClient(async (client, config) => {
    const workspace = config.accessPolicy.workspaces[0];
    const create = await client.callTool({
      name: "introduce_skill",
      arguments: {
        workspace,
        scope: "workspace",
        skillName: "name %2F part",
        projectName: "test",
        displayName: "Test",
        primarySpecialty: "api",
        specialtyTags: ["api"],
        skillContext: { whenToUse: "read-only context" },
      },
    });
    assertEquals(create.structuredContent.status, "ok");
    const listed = await client.callTool({
      name: "list_skills",
      arguments: { workspace, scope: "workspace" },
    });
    const uri = listed.structuredContent.data.skills[0].resourceUri;
    const read = await client.readResource({ uri });
    const detail = JSON.parse(read.contents[0].text).data;
    assertEquals(detail.entryKey, "name %2F part");
    assertEquals(detail.revision, create.structuredContent.data.revision);
    assertEquals(detail.skillContext.whenToUse, "read-only context");
    await assertRejects(() =>
      client.readResource({
        uri: catalogResourceUri(
          "skill",
          "denied",
          "workspace",
          "name %2F part",
        ),
      })
    );
    await assertRejects(() =>
      client.readResource({
        uri: catalogResourceUri("note", workspace, "global", "n"),
      })
    );
    await client.callTool({
      name: "introduce_skill",
      arguments: {
        workspace,
        scope: "global",
        skillName: "global",
        projectName: "test",
        displayName: "Global",
        primarySpecialty: "api",
        specialtyTags: ["api"],
      },
    });
    const globals = await client.callTool({
      name: "list_skills",
      arguments: { workspace, scope: "global" },
    });
    const globalUri = globals.structuredContent.data.skills[0].resourceUri;
    await client.readResource({ uri: globalUri });
    config.accessPolicy.globalRead = false;
    await assertRejects(() => client.readResource({ uri: globalUri }));
    const note = await client.callTool({
      name: "remember_workspace_note",
      arguments: { workspace, title: "Note", body: "Body" },
    });
    const noteRead = await client.readResource({
      uri: catalogResourceUri(
        "note",
        workspace,
        "workspace",
        note.structuredContent.data.noteId,
      ),
    });
    const noteData = JSON.parse(noteRead.contents[0].text).data;
    assertEquals(noteData.body, "Body");
    assertExists(noteData.revision);
  }));

Deno.test("native prompt reuses the tool generator and diagnostics identify the loaded source and contracts", () =>
  withClient(async (client, config) => {
    const prompts = await client.listPrompts();
    assert(
      prompts.prompts.some((prompt: { name: string }) =>
        prompt.name === "lor-agent-prompt"
      ),
    );
    const input = {
      workspace: config.accessPolicy.workspaces[0],
      role: "backend",
      task: "inspect API",
    };
    const prompt = await client.getPrompt({
      name: "lor-agent-prompt",
      arguments: input,
    });
    assertEquals(
      prompt.messages[0].content.text,
      generateAgentPrompt(input).prompt,
    );
    await assertRejects(() =>
      client.getPrompt({
        name: "lor-agent-prompt",
        arguments: { ...input, role: "unknown" },
      })
    );
    const diagnostics = await client.callTool({
      name: "get_workspace_diagnostics",
      arguments: { workspace: input.workspace },
    });
    assertEquals(diagnostics.structuredContent.status, "ok");
    assertEquals(
      diagnostics.structuredContent.data.runtimeStatus.buildId,
      BUILD_IDENTITY.buildId,
    );
    assertEquals(
      diagnostics.structuredContent.data.storageStatus.schemaVersion,
      14,
    );
    assert(
      /^[a-f0-9]{64}$/.test(
        diagnostics.structuredContent.data.runtimeStatus
          .toolContractFingerprint,
      ),
    );
  }));

Deno.test("oversized tool results are bounded, reconstructable via resource and tool, and never repeat writes", () =>
  withClient(async (client, config) => {
    const workspace = config.accessPolicy.workspaces[0];
    const runtime = await createDefaultRuntime({ config });
    let entry;
    try {
      entry = await runtime.service.introduceSkill({
        workspace,
        scope: "workspace",
        skillName: "large",
        projectName: "test",
        displayName: "Large",
        primarySpecialty: "api",
        specialtyTags: ["api"],
        skillContext: { whenToUse: "x".repeat(300000) },
      });
    } finally {
      runtime.close();
    }
    const result = await client.callTool({
      name: "get_skill_detail",
      arguments: { workspace, scope: "workspace", skillName: "large" },
    });
    assertEquals(result.structuredContent.status, "deferred");
    assert(
      new TextEncoder().encode(JSON.stringify(result)).length <
        MAX_RESULT_BYTES,
    );
    let uri: string | undefined =
      result.structuredContent.data.resultResource.uri;
    let text = "";
    let first = true;
    while (uri) {
      const resource = await client.readResource({ uri });
      const page = JSON.parse(resource.contents[0].text);
      if (first) {
        const toolPage = await client.callTool({
          name: "read_result_page",
          arguments: { snapshotId: page.snapshotId, offset: page.offset },
        });
        assertEquals(toolPage.structuredContent.data, page);
        first = false;
      }
      text += page.text;
      uri = page.nextUri;
    }
    assertEquals(
      JSON.parse(text).data.skillContext.whenToUse,
      "x".repeat(300000),
    );
    assertEquals(JSON.parse(text).data.revision, entry.revision);
  }));

Deno.test("reading pages of a deferred mutation does not execute the mutation again", () =>
  withClient(async (client, config) => {
    const workspace = config.accessPolicy.workspaces[0];
    const result = await client.callTool({
      name: "introduce_skill",
      arguments: {
        workspace,
        scope: "workspace",
        skillName: "large-write",
        projectName: "test",
        displayName: "Large write",
        primarySpecialty: "api",
        specialtyTags: ["api"],
        skillContext: { examplePrompts: Array(32).fill("x".repeat(9000)) },
        idempotencyKey: "large-write",
      },
    });
    assertEquals(result.structuredContent.status, "deferred");
    let uri: string | undefined =
      result.structuredContent.data.resultResource.uri;
    let full = "";
    while (uri) {
      const resource = await client.readResource({ uri });
      const page = JSON.parse(resource.contents[0].text);
      full += page.text;
      uri = page.nextUri;
    }
    assertEquals(JSON.parse(full).status, "ok");
    assertEquals(JSON.parse(full).data.entryKey, "large-write");
    const listed = await client.callTool({
      name: "list_skills",
      arguments: { workspace, scope: "workspace" },
    });
    assertEquals(listed.structuredContent.data.total, 1);
    const receipt = await client.callTool({
      name: "get_operation",
      arguments: { workspace, operationKey: "large-write" },
    });
    assertEquals(receipt.structuredContent.data.status, "completed");
  }));
