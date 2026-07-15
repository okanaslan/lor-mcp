import { assertEquals, assertExists } from "@std/assert";
import { createHttpMcpHandler } from "@src/http_server.ts";
import { createCatalogService } from "@test/helpers/catalog_fixtures.ts";

const endpoint = "http://127.0.0.1:8765/mcp";

Deno.test("HTTP MCP handler initializes a session and reuses it for tools/list", async () => {
  const handler = createHttpMcpHandler();

  const initializeResponse = await handler(
    new Request(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "test-client", version: "0.0.0" },
        },
      }),
    }),
  );
  const sessionId = initializeResponse.headers.get("mcp-session-id");

  assertEquals(initializeResponse.status, 200);
  assertExists(sessionId);

  const toolsResponse = await handler(
    new Request(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json, text/event-stream",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }),
    }),
  );
  const toolsBody = await toolsResponse.json();

  assertEquals(toolsResponse.status, 200);
  assertEquals(
    toolsBody.result.tools.map((tool: { name: string }) => tool.name),
    [
      "introduce_agent",
      "introduce_skill",
      "list_catalog_entries",
      "clear_workspace_catalog",
      "get_catalog_entry_detail",
      "prepare_agent_handoff",
      "find_matching_catalog_entry",
    ],
  );
});

Deno.test("HTTP MCP handler calls prepare_agent_handoff", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "Agentic-Router",
      codexSessionId: "agent-1",
      projectName: "Agentic Router",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
      handoff: {
        whenToUse: "Backend API changes",
        handoffPromptTemplate: "Handle {task} with {context}.",
        requiredContext: ["requirements"],
        expectedOutput: "Patch summary",
        constraints: ["Stay scoped"],
      },
    });

    const handler = createHttpMcpHandler({
      runtimeFactory: () =>
        Promise.resolve({
          service,
          close: () => {},
        }),
    });
    const sessionId = await initializeSession(handler);
    const response = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "prepare_agent_handoff",
        arguments: {
          workspace: "Agentic-Router",
          agentEntryKey: "agent-1",
          task: "Add endpoint",
          context: "Follow service patterns",
        },
      },
    });
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.result.structuredContent.status, "ok");
    assertEquals(
      body.result.structuredContent.data.prompt,
      "Handle Add endpoint with Follow service patterns.",
    );
    assertEquals(body.result.structuredContent.data.usedStoredHandoff, true);
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler rejects unknown session ids and deletes known sessions", async () => {
  const handler = createHttpMcpHandler();

  const unknownSessionResponse = await handler(
    new Request(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json, text/event-stream",
        "mcp-session-id": "missing-session",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      }),
    }),
  );
  assertEquals(unknownSessionResponse.status, 404);

  const initializeResponse = await handler(
    new Request(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "test-client", version: "0.0.0" },
        },
      }),
    }),
  );
  const sessionId = initializeResponse.headers.get("mcp-session-id");
  assertExists(sessionId);

  const deleteResponse = await handler(
    new Request(endpoint, {
      method: "DELETE",
      headers: { "mcp-session-id": sessionId },
    }),
  );
  assertEquals(deleteResponse.status, 200);

  const afterDeleteResponse = await handler(
    new Request(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json, text/event-stream",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/list",
        params: {},
      }),
    }),
  );

  assertEquals(afterDeleteResponse.status, 404);
});

async function initializeSession(
  handler: (request: Request) => Promise<Response>,
): Promise<string> {
  const response = await handler(
    new Request(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "test-client", version: "0.0.0" },
        },
      }),
    }),
  );
  const sessionId = response.headers.get("mcp-session-id");
  assertExists(sessionId);
  return sessionId;
}

function postMcp(
  handler: (request: Request) => Promise<Response>,
  sessionId: string,
  body: unknown,
): Promise<Response> {
  return handler(
    new Request(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json, text/event-stream",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify(body),
    }),
  );
}
