import { assert, assertEquals, assertExists, assertRejects } from "@std/assert";
import { join } from "@std/path";
import { Client } from "@mcp/client";
import { StreamableHTTPClientTransport } from "@mcp/client-http";
import { createHttpMcpHandler } from "@src/http_server.ts";
import { createDefaultRuntime } from "@src/tools/runtime.ts";
import { loadConfig } from "@src/config.ts";
import { outputSchemaFor } from "@src/tools/output_schemas.ts";
import { importCatalogInputSchema } from "@src/tools/schemas.ts";

Deno.test("SDK client exercises real runtime authorization, revisions, pagination and retry after reconnect", async () => {
  const root = await Deno.makeTempDir();
  const config = loadConfig({
    LOR_DB_PATH: join(root, "catalog.db"),
    LOR_ALLOWED_WORKSPACES: "allowed",
    LOR_GLOBAL_READ: "false",
  }, { cwd: root });
  let handler = createHttpMcpHandler({
    runtimeFactory: () => createDefaultRuntime({ config }),
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => handler(new Request(input, init));
  let client: Client;
  let transport: StreamableHTTPClientTransport;
  async function connect() {
    client = new Client({ name: "hardening-test", version: "1.0.0" });
    transport = new StreamableHTTPClientTransport(
      new URL("http://127.0.0.1:8765/mcp"),
    );
    await client.connect(transport);
  }
  async function close() {
    await transport.terminateSession();
    await client.close();
  }
  async function call(name: string, args: Record<string, unknown>) {
    const result = await client.callTool({ name, arguments: args });
    const envelope = outputSchemaFor(name).parse(result.structuredContent) as {
      status: string;
      data?: Record<string, unknown>;
      error?: { code: string };
      requestId: string;
    };
    assertExists(envelope.requestId);
    assert(
      result.content.some((block: { type: string; text?: string }) =>
        block.type === "text" &&
        JSON.parse(
            String(block.text).startsWith("{") ? String(block.text) : "null",
          )?.requestId === envelope.requestId
      ),
    );
    assertEquals(result.isError === true, envelope.status === "error");
    return envelope;
  }
  try {
    await connect();
    const tools = await client!.listTools();
    assert(
      tools.tools.every((
        tool: {
          inputSchema?: unknown;
          outputSchema?: unknown;
          annotations?: unknown;
        },
      ) => tool.inputSchema && tool.outputSchema && tool.annotations),
    );
    const skill = {
      workspace: "allowed",
      scope: "workspace",
      skillName: "test-skill",
      projectName: "test",
      displayName: "Test",
      primarySpecialty: "api",
      specialtyTags: ["api"],
      skillContext: { whenToUse: "full instructions only in detail" },
      idempotencyKey: "create-skill",
    };
    assertEquals(
      (await call("introduce_skill", { ...skill, workspace: "denied" })).error
        ?.code,
      "access_denied",
    );
    assertEquals(
      (await call("introduce_skill", { ...skill, scope: "global" })).error
        ?.code,
      "access_denied",
    );
    const created = await call("introduce_skill", skill);
    assertEquals(created.status, "ok");
    const revision = created.data!.revision;
    assertEquals(
      (await call("update_skill", {
        workspace: "allowed",
        scope: "workspace",
        skillName: "test-skill",
        displayName: "Missing precondition",
      })).error?.code,
      "revision_conflict",
    );
    const update = {
      workspace: "allowed",
      scope: "workspace",
      skillName: "test-skill",
      displayName: "Updated",
      expectedRevision: revision,
    };
    assertEquals((await call("update_skill", update)).status, "ok");
    assertEquals(
      (await call("update_skill", { ...update, displayName: "Stale" })).error
        ?.code,
      "revision_conflict",
    );
    await call("introduce_skill", {
      ...skill,
      skillName: "another-skill",
      idempotencyKey: "another",
    });
    const first = await call("list_skills", {
      workspace: "allowed",
      scope: "workspace",
      limit: 1,
    });
    assertEquals((first.data!.skills as unknown[]).length, 1);
    assert(!JSON.stringify(first.data).includes("full instructions"));
    const last = await call("list_skills", {
      workspace: "allowed",
      scope: "workspace",
      limit: 1,
      cursor: first.data!.nextCursor,
    });
    assertEquals((last.data!.skills as unknown[]).length, 1);
    assertEquals(last.data!.nextCursor, undefined);
    const exported = await call("export_catalog", {
      workspace: "allowed",
      limit: 1,
    });
    assertEquals((exported.data!.entries as unknown[]).length, 1);
    assertEquals(exported.data!.total, 2);
    assertExists(exported.data!.nextCursor);
    assert(
      importCatalogInputSchema.safeParse({
        workspace: "allowed",
        catalog: exported.data,
      }).success,
    );
    const invalid = await client!.callTool({
      name: "list_skills",
      arguments: { workspace: "allowed", unexpected: true },
    });
    assertEquals(invalid.isError, true);
    const receipt = await call("get_operation", {
      workspace: "allowed",
      operationKey: "create-skill",
    });
    assertEquals(receipt.data!.status, "completed");
    assertEquals(
      (await call("get_operation", {
        workspace: "denied",
        operationKey: "create-skill",
      })).error?.code,
      "access_denied",
    );
    await close();
    handler = createHttpMcpHandler({
      runtimeFactory: () => createDefaultRuntime({ config }),
    });
    await connect();
    const replayed = await call("introduce_skill", skill);
    assertEquals(replayed.data, created.data);
    assertEquals(
      (await call("introduce_skill", {
        ...skill,
        displayName: "different payload",
      })).error?.code,
      "idempotency_conflict",
    );
    assertEquals(
      (await call("list_skills", { workspace: "allowed", scope: "workspace" }))
        .data!.total,
      2,
    );
  } finally {
    try {
      await close();
    } finally {
      globalThis.fetch = originalFetch;
      await Deno.remove(root, { recursive: true });
    }
  }
});

Deno.test("HTTP bounds body size, body-read duration and live session count", async () => {
  let now = 0;
  const handler = createHttpMcpHandler({
    maxSessions: 1,
    maxRequestBytes: 512,
    sessionIdleMs: 10,
    requestBodyTimeoutMs: 10,
    now: () => now,
  });
  const url = "http://127.0.0.1:8765/mcp";
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  const initialize = () =>
    handler(
      new Request(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-06-18",
            capabilities: {},
            clientInfo: { name: "limits-test", version: "1" },
          },
        }),
      }),
    );
  const first = await initialize();
  assertEquals(first.status, 200);
  const firstId = first.headers.get("mcp-session-id")!;
  await first.json();
  const full = await initialize();
  assertEquals(full.status, 503);
  await full.json();
  const large = await handler(
    new Request(url, { method: "POST", headers, body: "x".repeat(513) }),
  );
  assertEquals(large.status, 413);
  await large.json();
  const malformed = await handler(
    new Request(url, { method: "POST", headers, body: "{" }),
  );
  assertEquals((await malformed.json()).error.code, -32700);
  const stalled = await handler(
    new Request(url, { method: "POST", headers, body: new ReadableStream() }),
  );
  assertEquals(stalled.status, 408);
  await stalled.json();
  now = 11;
  const second = await initialize();
  assertEquals(second.status, 200);
  const secondId = second.headers.get("mcp-session-id")!;
  await second.json();
  const expired = await handler(
    new Request(url, {
      method: "DELETE",
      headers: { "mcp-session-id": firstId },
    }),
  );
  assertEquals(expired.status, 404);
  await expired.json();
  const deleted = await handler(
    new Request(url, {
      method: "DELETE",
      headers: { "mcp-session-id": secondId },
    }),
  );
  await deleted.text();
});

Deno.test("HTTP rejects cross-origin and rebinding hosts before runtime access", async () => {
  const handler = createHttpMcpHandler({
    runtimeFactory: () => {
      throw new Error("must not open DB");
    },
  });
  for (
    const [url, origin] of [["http://attacker.example/mcp", ""], [
      "http://127.0.0.1:8765/mcp",
      "https://attacker.example",
    ]]
  ) {
    assertEquals(
      (await handler(
        new Request(url, { method: "POST", headers: origin ? { origin } : {} }),
      )).status,
      403,
    );
  }
});

Deno.test("SDK cancellation before runtime dispatch prevents a catalog mutation", async () => {
  const root = await Deno.makeTempDir();
  const config = loadConfig({
    LOR_DB_PATH: join(root, "catalog.db"),
    LOR_ALLOWED_WORKSPACES: "allowed",
  }, { cwd: root });
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const finished = Promise.withResolvers<void>();
  const cancelled = Promise.withResolvers<void>();
  const handler = createHttpMcpHandler({
    runtimeFactory: async () => {
      entered.resolve();
      await release.promise;
      const runtime = await createDefaultRuntime({ config });
      return {
        ...runtime,
        close() {
          runtime.close();
          finished.resolve();
        },
      };
    },
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const body = request.method === "POST"
      ? await request.clone().json()
      : undefined;
    const response = await handler(request);
    if (body?.method === "notifications/cancelled") cancelled.resolve();
    return response;
  };
  const client = new Client({ name: "cancel-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL("http://127.0.0.1:8765/mcp"),
  );
  try {
    await client.connect(transport);
    const controller = new AbortController();
    const pending = client.callTool(
      {
        name: "remember_workspace_note",
        arguments: {
          workspace: "allowed",
          title: "must not persist",
          body: "cancelled",
          tags: ["test"],
        },
      },
      undefined,
      { signal: controller.signal },
    );
    const rejection = assertRejects(() => pending);
    await entered.promise;
    controller.abort(new Error("User cancelled"));
    await cancelled.promise;
    release.resolve();
    await rejection;
    await finished.promise;
    const runtime = await createDefaultRuntime({ config });
    try {
      assertEquals(
        (await runtime.service.listWorkspaceNotes({ workspace: "allowed" }))
          .notes.length,
        0,
      );
    } finally {
      runtime.close();
    }
  } finally {
    release.resolve();
    try {
      await transport.terminateSession();
      await client.close();
    } finally {
      globalThis.fetch = originalFetch;
      await Deno.remove(root, { recursive: true });
    }
  }
});
