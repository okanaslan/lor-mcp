import { assert, assertEquals, assertExists } from "@std/assert";
import { createHttpMcpHandler } from "@src/http_server.ts";
import { createCatalogService } from "@test/helpers/catalog_fixtures.ts";
import { CapturingLogger } from "@test/helpers/logging.ts";

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
      "update_catalog_entry",
      "remove_catalog_entry",
      "export_catalog",
      "import_catalog",
      "check_catalog_health",
      "prepare_agent_handoff",
      "generate_agent_prompt",
      "find_matching_catalog_entry",
    ],
  );
});

Deno.test("HTTP MCP handler calls update_catalog_entry", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "LOR-MCP",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
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
        name: "update_catalog_entry",
        arguments: {
          workspace: "LOR-MCP",
          entryType: "agent",
          entryKey: "agent-1",
          displayName: "Deno Backend Agent",
          specialtyTags: ["deno", "mcp"],
        },
      },
    });
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.result.structuredContent.status, "ok");
    assertEquals(
      body.result.structuredContent.data.displayName,
      "Deno Backend Agent",
    );
    assertEquals(body.result.structuredContent.data.entryKey, "agent-1");
    assertEquals(body.result.structuredContent.data.specialtyTags, [
      "deno",
      "mcp",
    ]);
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler calls remove_catalog_entry", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
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
        name: "remove_catalog_entry",
        arguments: {
          workspace: "LOR-MCP",
          entryType: "skill",
          entryKey: "backend-skill",
        },
      },
    });
    const body = await response.json();
    const entries = await service.listEntries({ workspace: "LOR-MCP" });

    assertEquals(response.status, 200);
    assertEquals(body.result.structuredContent.status, "ok");
    assertEquals(body.result.structuredContent.data, {
      workspace: "LOR-MCP",
      entryType: "skill",
      entryKey: "backend-skill",
      removed: true,
    });
    assertEquals(entries, []);
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler calls export_catalog and import_catalog", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const handler = createHttpMcpHandler({
      runtimeFactory: () =>
        Promise.resolve({
          service,
          close: () => {},
        }),
    });
    const sessionId = await initializeSession(handler);
    const exportResponse = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "export_catalog",
        arguments: {
          workspace: "LOR-MCP",
        },
      },
    });
    const exportBody = await exportResponse.json();

    assertEquals(exportResponse.status, 200);
    assertEquals(exportBody.result.structuredContent.status, "ok");
    assertEquals(exportBody.result.structuredContent.data.entries.length, 1);

    await service.clearWorkspaceCatalog({
      workspace: "LOR-MCP",
      confirm: true,
    });
    const importResponse = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "import_catalog",
        arguments: {
          workspace: "LOR-MCP",
          catalog: exportBody.result.structuredContent.data,
        },
      },
    });
    const importBody = await importResponse.json();
    const entries = await service.listEntries({ workspace: "LOR-MCP" });

    assertEquals(importResponse.status, 200);
    assertEquals(importBody.result.structuredContent.status, "ok");
    assertEquals(importBody.result.structuredContent.data.importedCount, 1);
    assertEquals(entries.map((entry) => entry.entryKey), ["backend-skill"]);
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler calls check_catalog_health", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
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
        name: "check_catalog_health",
        arguments: {
          workspace: "LOR-MCP",
          entryType: "skill",
          entryKey: "backend-skill",
        },
      },
    });
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.result.structuredContent.status, "ok");
    assertEquals(body.result.structuredContent.data.summary, {
      total: 1,
      verified: 1,
      unverified: 0,
      unknown: 0,
      agents: 0,
      skills: 1,
    });
    assertEquals(
      body.result.structuredContent.data.entries[0].entryKey,
      "backend-skill",
    );
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler calls prepare_agent_handoff", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "LOR-MCP",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
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
          workspace: "LOR-MCP",
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

Deno.test("HTTP MCP handler calls generate_agent_prompt", async () => {
  const logger = new CapturingLogger();
  const handler = createHttpMcpHandler({ logger });
  const sessionId = await initializeSession(handler);
  const response = await postMcp(handler, sessionId, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "generate_agent_prompt",
      arguments: {
        workspace: "LOR-MCP",
        role: "backend",
        projectName: "Local Orchestration Router (LOR)",
        task: "Add a secret prompt task",
        context: "Follow existing tool registration patterns",
        constraints: "Do not write to SQLite",
      },
    },
  });
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.result.structuredContent.status, "ok");
  assertEquals(body.result.structuredContent.data.workspace, "LOR-MCP");
  assertEquals(body.result.structuredContent.data.role, "backend");
  assertEquals(
    body.result.structuredContent.data.suggestedAgentMetadata.projectName,
    "Local Orchestration Router (LOR)",
  );
  assertEquals(
    body.result.structuredContent.data.delivery.mode,
    "manual",
  );
  assertExists(body.result.structuredContent.data.prompt);
  assert(
    logger.logs.some((log) =>
      log.level === "info" &&
      log.fields.event === "mcp_tool_call" &&
      log.fields.toolName === "generate_agent_prompt" &&
      log.fields.workspace === "LOR-MCP" &&
      log.fields.status === "ok" &&
      typeof log.fields.durationMs === "number"
    ),
  );
  assert(
    logger.logs.some((log) =>
      log.level === "debug" &&
      log.fields.event === "http_request" &&
      log.fields.status === 200 &&
      log.fields.sessionPresent === true
    ),
  );
  assertEquals(
    JSON.stringify(logger.logs).includes("secret prompt task"),
    false,
  );
});

Deno.test("HTTP MCP handler logs structured tool errors", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const logger = new CapturingLogger();
    const handler = createHttpMcpHandler({
      logger,
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
        name: "get_catalog_entry_detail",
        arguments: {
          workspace: "LOR-MCP",
          entryType: "agent",
          entryKey: "missing-agent",
        },
      },
    });
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.result.structuredContent.status, "error");
    assertEquals(body.result.structuredContent.error.code, "not_found");
    assert(
      logger.logs.some((log) =>
        log.level === "warn" &&
        log.fields.event === "mcp_tool_call" &&
        log.fields.toolName === "get_catalog_entry_detail" &&
        log.fields.workspace === "LOR-MCP" &&
        log.fields.entryType === "agent" &&
        log.fields.entryKey === "missing-agent" &&
        log.fields.status === "error" &&
        log.fields.errorCode === "not_found"
      ),
    );
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler rejects unknown session ids and deletes known sessions", async () => {
  const logger = new CapturingLogger();
  const handler = createHttpMcpHandler({ logger });

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
        params: { secret: "do-not-log" },
      }),
    }),
  );
  assertEquals(unknownSessionResponse.status, 404);
  assert(
    logger.logs.some((log) =>
      log.level === "warn" &&
      log.fields.event === "mcp_session_unknown" &&
      log.fields.sessionId === "missing-session"
    ),
  );

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
  assert(
    logger.logs.some((log) =>
      log.level === "info" &&
      log.fields.event === "mcp_session_created" &&
      log.fields.sessionId === sessionId
    ),
  );

  const deleteResponse = await handler(
    new Request(endpoint, {
      method: "DELETE",
      headers: { "mcp-session-id": sessionId },
    }),
  );
  assertEquals(deleteResponse.status, 200);
  assert(
    logger.logs.some((log) =>
      log.level === "info" &&
      log.fields.event === "mcp_session_closed" &&
      log.fields.sessionId === sessionId
    ),
  );

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
  assert(
    logger.logs.some((log) =>
      log.level === "warn" &&
      log.fields.event === "http_request" &&
      log.fields.status === 404 &&
      log.fields.sessionPresent === true
    ),
  );
  assertEquals(JSON.stringify(logger.logs).includes("do-not-log"), false);
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
