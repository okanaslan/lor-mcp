import { assert, assertEquals, assertExists } from "@std/assert";
import { join } from "@std/path";
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
      "get_operation",
      "introduce_skill",
      "introduce_subagent",
      "list_skills",
      "list_subagents",
      "clear_workspace_skills",
      "clear_workspace_subagents",
      "register_workspace_alias",
      "promote_skill_to_global",
      "get_skill_detail",
      "get_subagent_detail",
      "update_skill",
      "update_subagent",
      "propose_skill_update",
      "apply_skill_update",
      "preview_skill_file_sync",
      "apply_skill_file_sync",
      "remove_skill",
      "remove_subagent",
      "export_catalog",
      "import_catalog",
      "preview_workspace_catalog_sync",
      "apply_workspace_catalog_sync",
      "check_catalog_health",
      "get_workspace_diagnostics",
      "get_usage_analytics",
      "remember_workspace_note",
      "list_workspace_notes",
      "find_matching_workspace_note",
      "get_workspace_note",
      "remove_workspace_note",
      "generate_agent_prompt",
      "find_matching_skill",
      "find_matching_subagent",
      "list_default_skills",
      "get_default_skill",
      "read_result_page",
    ],
  );
});

Deno.test("HTTP MCP handler calls introduce_subagent", async () => {
  const { repo, service } = await createCatalogService();
  try {
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
        name: "introduce_subagent",
        arguments: {
          workspace: "LOR-MCP",
          name: "api-test-subagent",
          projectName: "Local Orchestration Router (LOR)",
          displayName: "API Test Subagent",
          purpose: "Write focused backend API tests.",
          limitedScope: "Only inspect API handlers and related tests.",
          primarySpecialty: "backend api testing",
          specialtyTags: ["backend", "api", "tests"],
          expectedOutput: "A concise test summary.",
        },
      },
    });
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.result.structuredContent.status, "ok");
    assertEquals(
      body.result.structuredContent.data.entryType,
      "subagent",
    );
    assertEquals(
      body.result.structuredContent.data.prompt.includes("API Test Subagent"),
      true,
    );
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler calls propose_skill_update and apply_skill_update", async () => {
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
    const proposeResponse = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "propose_skill_update",
        arguments: {
          workspace: "LOR-MCP",
          skillName: "backend-skill",
          reason: "Improve routing context.",
          skillContext: {
            whenToUse: "Use for Deno MCP backend work.",
          },
          metadata: {
            displayName: "LOR Backend Skill",
          },
        },
      },
    });
    const proposeBody = await proposeResponse.json();
    const proposalId =
      proposeBody.result.structuredContent.data.proposal.proposalId;
    const applyResponse = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "apply_skill_update",
        arguments: {
          workspace: "LOR-MCP",
          proposalId,
          confirm: true,
        },
      },
    });
    const applyBody = await applyResponse.json();

    assertEquals(proposeResponse.status, 200);
    assertEquals(proposeBody.result.structuredContent.status, "ok");
    assertEquals(
      proposeBody.result.structuredContent.data.after.displayName,
      "LOR Backend Skill",
    );
    assertEquals(applyResponse.status, 200);
    assertEquals(applyBody.result.structuredContent.status, "ok");
    assertEquals(
      applyBody.result.structuredContent.data.after.skillContext.whenToUse,
      "Use for Deno MCP backend work.",
    );
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler calls preview_skill_file_sync and apply_skill_file_sync", async () => {
  const { root, file } = await createHttpSkillFile("backend-skill");
  const { repo, service } = await createCatalogService({ skillRoots: [root] });
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    const proposal = await service.proposeSkillUpdate({
      workspace: "LOR-MCP",
      skillName: "backend-skill",
      reason: "Improve routing context.",
      skillContext: {
        whenToUse: "Use for Deno MCP backend work.",
      },
    });
    await service.applySkillUpdate({
      workspace: "LOR-MCP",
      proposalId: proposal.proposal.proposalId,
      confirm: true,
    });

    const handler = createHttpMcpHandler({
      runtimeFactory: () =>
        Promise.resolve({
          service,
          close: () => {},
        }),
    });
    const sessionId = await initializeSession(handler);
    const previewResponse = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "preview_skill_file_sync",
        arguments: {
          workspace: "LOR-MCP",
          skillName: "backend-skill",
          proposalId: proposal.proposal.proposalId,
        },
      },
    });
    const previewBody = await previewResponse.json();
    const applyResponse = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "apply_skill_file_sync",
        arguments: {
          previewDigest:
            previewBody.result.structuredContent.data.previewDigest,
          workspace: "LOR-MCP",
          skillName: "backend-skill",
          proposalId: proposal.proposal.proposalId,
          confirm: true,
        },
      },
    });
    const applyBody = await applyResponse.json();
    const updated = await Deno.readTextFile(file);

    assertEquals(previewResponse.status, 200);
    assertEquals(previewBody.result.structuredContent.status, "ok");
    assertEquals(
      previewBody.result.structuredContent.data.renderedSection.includes(
        "Use for Deno MCP backend work.",
      ),
      true,
    );
    assertEquals(applyResponse.status, 200);
    assertEquals(applyBody.result.structuredContent.status, "ok");
    assertEquals(applyBody.result.structuredContent.data.written, true);
    assertEquals(updated.includes("## LOR Managed Context"), true);
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler calls register_workspace_alias", async () => {
  const { repo, service } = await createCatalogService();
  try {
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
        name: "register_workspace_alias",
        arguments: {
          workspace: "/workspaces/LOR-MCP",
          alias: "LOR-MCP",
        },
      },
    });
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.result.structuredContent.status, "ok");
    assertEquals(body.result.structuredContent.data, {
      workspace: "/workspaces/LOR-MCP",
      alias: "LOR-MCP",
      created: true,
      reassigned: false,
    });
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler calls remove_skill", async () => {
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
        name: "remove_skill",
        arguments: {
          expectedRevision: (await service.getSkillDetail({
            workspace: "LOR-MCP",
            skillName: "backend-skill",
          }))!.revision,
          workspace: "LOR-MCP",
          skillName: "backend-skill",
        },
      },
    });
    const body = await response.json();
    const entries = await service.listEntries({ workspace: "LOR-MCP" });

    assertEquals(response.status, 200);
    assertEquals(body.result.structuredContent.status, "ok");
    assertEquals(body.result.structuredContent.data, {
      workspace: "LOR-MCP",
      scope: "global",
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
      scope: "workspace",
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

Deno.test("HTTP MCP handler calls workspace catalog sync tools", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const logger = new CapturingLogger();
    await service.introduceSkill({
      workspace: "source-workspace",
      scope: "workspace",
      skillName: "backend-skill",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const handler = createHttpMcpHandler({
      logger,
      runtimeFactory: () =>
        Promise.resolve({
          service,
          close: () => {},
        }),
    });
    const sessionId = await initializeSession(handler);
    const previewResponse = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "preview_workspace_catalog_sync",
        arguments: {
          sourceWorkspace: "source-workspace",
          targetWorkspace: "target-workspace",
        },
      },
    });
    const previewBody = await previewResponse.json();
    const applyResponse = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "apply_workspace_catalog_sync",
        arguments: {
          previewDigest:
            previewBody.result.structuredContent.data.previewDigest,
          sourceWorkspace: "source-workspace",
          targetWorkspace: "target-workspace",
          confirm: true,
        },
      },
    });
    const applyBody = await applyResponse.json();
    const targetEntries = await service.listEntries({
      workspace: "target-workspace",
    });

    assertEquals(previewResponse.status, 200);
    assertEquals(previewBody.result.structuredContent.status, "ok");
    assertEquals(
      previewBody.result.structuredContent.data.skillsToCopy[0].skillName,
      "backend-skill",
    );
    assertEquals(applyResponse.status, 200);
    assertEquals(applyBody.result.structuredContent.status, "ok");
    assertEquals(
      applyBody.result.structuredContent.data.importResult.importedCount,
      1,
    );
    assertEquals(targetEntries.map((entry) => entry.entryKey), [
      "backend-skill",
    ]);
    assert(
      logger.logs.some((log) =>
        log.level === "info" &&
        log.fields.event === "mcp_tool_call" &&
        log.fields.toolName === "apply_workspace_catalog_sync" &&
        log.fields.sourceWorkspace === "source-workspace" &&
        log.fields.targetWorkspace === "target-workspace" &&
        log.fields.copiedSkills === 1
      ),
    );
    assertEquals(JSON.stringify(logger.logs).includes("Backend Skill"), false);
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler calls check_catalog_health", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill({
      workspace: "LOR-MCP",
      scope: "workspace",
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
      body.result.structuredContent.data.coverage.coverageStatus,
      "low_coverage",
    );
    assertEquals(
      body.result.structuredContent.data.coverage.workspaceSkillCount,
      1,
    );
    assertEquals(
      body.result.structuredContent.data.entries[0].entryKey,
      "backend-skill",
    );
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler calls find_matching_skill with structured routing input", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const handler = createHttpMcpHandler({
      runtimeFactory: () =>
        Promise.resolve({
          service,
          close: () => {},
        }),
    });
    const sessionId = await initializeSession(handler);
    await service.introduceSkill({
      workspace: "LOR-MCP",
      scope: "workspace",
      skillName: "pr-feedback-evaluator",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "PR Feedback Evaluator",
      primarySpecialty: "pull request feedback triage",
      specialtyTags: ["pull-request", "feedback", "reviewer-comment"],
      routing: {
        intentFamily: "received-pr-feedback-triage",
        intents: ["evaluate_feedback"],
        positiveIntents: ["comment-validity"],
        aliases: ["pr-feedback-evaluator"],
        positiveKeywords: ["received-feedback", "reviewer-comment"],
        negativeIntents: ["fresh-pr-review", "commit"],
        requiredAny: ["received-feedback"],
      },
    });

    const response = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "find_matching_skill",
        arguments: {
          workspace: "LOR-MCP",
          task: "Is this PR comment still valid?",
          canonicalTask:
            "Evaluate existing pull request reviewer feedback for current validity, impact, importance, ease of fix, and how to fix.",
          intent: "evaluate_feedback",
          excludeIntents: ["commit"],
          positiveKeywords: ["received feedback", "review comment"],
          negativeHints: ["fresh-pr-review"],
          requiredAny: ["received feedback"],
          preferredEntryKeys: ["pr-feedback-evaluator"],
          debug: true,
        },
      },
    });
    const body = await response.json();
    const data = body.result.structuredContent.data;

    assertEquals(response.status, 200);
    assertEquals(body.result.structuredContent.status, "ok");
    assertEquals(data.skills[0].entryKey, "pr-feedback-evaluator");
    assertEquals(data.querySignals.includes("evaluate-feedback"), true);
    assert(
      data.skills[0].matchedSignals.some((signal: string) =>
        signal ===
          "intent:evaluate-feedback -> intent:evaluate-feedback [phrase]"
      ),
    );
    assertEquals(
      data.skills[0].explanation.signalBreakdown.some((
        signal: { querySource?: string; candidateSource?: string },
      ) =>
        signal.querySource === "intent" && signal.candidateSource === "intent"
      ),
      true,
    );
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler calls get_workspace_diagnostics", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const handler = createHttpMcpHandler({
      runtimeFactory: () =>
        Promise.resolve({
          service,
          close: () => {},
        }),
    });
    const sessionId = await initializeSession(handler);
    await service.introduceAgent({
      workspace: "/workspaces/LOR-MCP",
      codexSessionId: "agent-1",
      projectName: "Local Orchestration Router (LOR)",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const response = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "get_workspace_diagnostics",
        arguments: {
          workspace: "LOR-MCP",
        },
      },
    });
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.result.structuredContent.status, "ok");
    assertEquals(
      body.result.structuredContent.data.resolvedWorkspace,
      "/workspaces/LOR-MCP",
    );
    assertEquals(body.result.structuredContent.data.catalogCounts.agents, 1);
    assertEquals(
      body.result.structuredContent.data.localContext.agentsMd.status,
      "missing",
    );
    assertEquals(
      JSON.stringify(body.result.structuredContent.data).includes(
        "Backend Agent",
      ),
      false,
    );
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler calls workspace note tools", async () => {
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
    const rememberResponse = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "remember_workspace_note",
        arguments: {
          workspace: "LOR-MCP",
          title: "Branch plan",
          body: "Do not log this note body.",
          tags: ["branch-plan"],
        },
      },
    });
    const rememberBody = await rememberResponse.json();
    const noteId = rememberBody.result.structuredContent.data.noteId;

    const listResponse = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "list_workspace_notes",
        arguments: {
          workspace: "LOR-MCP",
          tags: ["branch-plan"],
        },
      },
    });
    const matchResponse = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "find_matching_workspace_note",
        arguments: {
          workspace: "LOR-MCP",
          query: "branch plan",
          tags: ["branch-plan"],
        },
      },
    });
    const getResponse = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "get_workspace_note",
        arguments: {
          workspace: "LOR-MCP",
          noteId,
        },
      },
    });
    const removeResponse = await postMcp(handler, sessionId, {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "remove_workspace_note",
        arguments: {
          workspace: "LOR-MCP",
          noteId,
        },
      },
    });
    const listBody = await listResponse.json();
    const matchBody = await matchResponse.json();
    const getBody = await getResponse.json();
    const removeBody = await removeResponse.json();

    assertEquals(rememberResponse.status, 200);
    assertEquals(rememberBody.result.structuredContent.status, "ok");
    assertEquals(listBody.result.structuredContent.data.notes.length, 1);
    assertEquals(matchBody.result.structuredContent.status, "ok");
    assertEquals(matchBody.result.structuredContent.data.notes.length, 1);
    assertEquals(
      matchBody.result.structuredContent.data.notes[0].preview.includes(
        "Do not log this note body.",
      ),
      true,
    );
    assertEquals(
      "body" in matchBody.result.structuredContent.data.notes[0],
      false,
    );
    assertEquals(
      getBody.result.structuredContent.data.body,
      "Do not log this note body.",
    );
    assertEquals(removeBody.result.structuredContent.data.removed, true);
    assertEquals(
      JSON.stringify(logger.logs).includes("Do not log this note body."),
      false,
    );
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler calls get_usage_analytics", async () => {
  const { repo, service } = await createCatalogService();
  try {
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
        name: "get_usage_analytics",
        arguments: {
          workspace: "LOR-MCP",
        },
      },
    });
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.result.structuredContent.status, "ok");
    assertEquals(body.result.structuredContent.data.workspace, "LOR-MCP");
    assertEquals(body.result.structuredContent.data.summary.totalCount, 0);
    assertEquals(body.result.structuredContent.data.entries, []);
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
        name: "get_skill_detail",
        arguments: {
          workspace: "LOR-MCP",
          skillName: "missing-skill",
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
        log.fields.toolName === "get_skill_detail" &&
        log.fields.workspace === "LOR-MCP" &&
        log.fields.skillName === "missing-skill" &&
        log.fields.status === "error" &&
        log.fields.errorCode === "not_found"
      ),
    );
  } finally {
    repo.close();
  }
});

Deno.test("HTTP MCP handler logs expected auth discovery probes below warning", async () => {
  const logger = new CapturingLogger();
  const handler = createHttpMcpHandler({ logger });
  const response = await handler(
    new Request("http://127.0.0.1:8765/.well-known/openid-configuration", {
      method: "POST",
      body: JSON.stringify({ secret: "do-not-log" }),
    }),
  );

  assertEquals(response.status, 404);
  assert(
    logger.logs.some((log) =>
      log.level === "debug" &&
      log.fields.event === "http_request" &&
      log.fields.pathname === "/.well-known/openid-configuration" &&
      log.fields.status === 404
    ),
  );
  assertEquals(
    logger.logs.some((log) =>
      log.level === "warn" &&
      log.fields.event === "http_request" &&
      log.fields.pathname === "/.well-known/openid-configuration"
    ),
    false,
  );
  assertEquals(JSON.stringify(logger.logs).includes("do-not-log"), false);
});

Deno.test("HTTP MCP handler keeps unrelated 404 request logs at warning", async () => {
  const logger = new CapturingLogger();
  const handler = createHttpMcpHandler({ logger });
  const response = await handler(
    new Request("http://127.0.0.1:8765/not-found", {
      method: "GET",
    }),
  );

  assertEquals(response.status, 404);
  assert(
    logger.logs.some((log) =>
      log.level === "warn" &&
      log.fields.event === "http_request" &&
      log.fields.pathname === "/not-found" &&
      log.fields.status === 404
    ),
  );
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

async function createHttpSkillFile(
  skillName: string,
): Promise<{ root: string; file: string }> {
  const root = await Deno.makeTempDir();
  const skillDir = join(root, skillName);
  await Deno.mkdir(skillDir, { recursive: true });
  const file = join(skillDir, "SKILL.md");
  await Deno.writeTextFile(file, "# Backend Skill\n");
  return { root, file };
}
