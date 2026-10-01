import { assert, assertEquals } from "@std/assert";
import { join } from "@std/path";
import { Client } from "@mcp/client";
import { StreamableHTTPClientTransport } from "@mcp/client-http";
import { createHttpMcpHandler } from "@src/http_server.ts";
import { createDefaultRuntime } from "@src/tools/runtime.ts";
import { loadConfig } from "@src/config.ts";
import { outputSchemaFor } from "@src/tools/output_schemas.ts";

Deno.test("MCP governance contracts expose previews, freshness, lifecycle filters and explicit redirects", async () => {
  const root = await Deno.makeTempDir();
  const config = loadConfig({
    LOR_DB_PATH: join(root, "catalog.db"),
    LOR_GLOBAL_READ: "true",
    LOR_GLOBAL_WRITE: "true",
  }, { cwd: root });
  const handler = createHttpMcpHandler({
    runtimeFactory: () => createDefaultRuntime({ config }),
  });
  const savedFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => handler(new Request(input, init));
  const client = new Client({ name: "governance-test", version: "1" });
  const transport = new StreamableHTTPClientTransport(
    new URL("http://127.0.0.1:8765/mcp"),
  );
  const identity = (skillName: string) => ({
    workspace: root,
    scope: "global",
    skillName,
  });
  async function call(name: string, args: Record<string, unknown>) {
    const result = await client.callTool({ name, arguments: args });
    const envelope = outputSchemaFor(name).parse(result.structuredContent) as {
      status: string;
      data: Record<string, unknown>;
    };
    assertEquals(envelope.status, "ok", JSON.stringify(result));
    return envelope.data;
  }
  try {
    await client.connect(transport);
    for (const name of ["old-review", "review"]) {
      await call("introduce_skill", {
        ...identity(name),
        projectName: "test",
        displayName: name,
        primarySpecialty: "review",
        specialtyTags: ["review"],
        skillContext: { whenToUse: "Review code" },
      });
    }
    const before = await call("get_skill_detail", identity("review"));
    assertEquals(before.freshness, "unreviewed");
    const p = await call("propose_skill_update", {
      ...identity("review"),
      reason: "Review evidence",
      governance: {
        review: {
          contentFingerprint: before.contentFingerprint,
          method: "manual",
          evidence: "Inspected fixture",
          outcome: "passed",
        },
      },
    });
    const proposal = p.proposal as { proposalId: string };
    await call("apply_skill_update", {
      workspace: root,
      scope: "global",
      proposalId: proposal.proposalId,
      confirm: true,
    });
    assertEquals(
      (await call("get_skill_detail", identity("review"))).freshness,
      "current",
    );
    const deprecated = await call("propose_skill_update", {
      ...identity("old-review"),
      reason: "Consolidation",
      governance: {
        lifecycle: {
          status: "deprecated",
          reason: "Use canonical reviewer",
          replacement: { scope: "global", skillName: "review" },
        },
      },
    });
    await call("apply_skill_update", {
      workspace: root,
      scope: "global",
      proposalId: (deprecated.proposal as { proposalId: string }).proposalId,
      confirm: true,
    });
    assertEquals(
      (await call("get_skill_detail", identity("old-review"))).skillName,
      "old-review",
    );
    const resolved = await call("get_skill_detail", {
      ...identity("old-review"),
      followReplacement: true,
    });
    assertEquals(resolved.skillName, "review");
    assert(resolved.resolution);
    const active = await call("list_skills", {
      workspace: root,
      scope: "global",
    });
    assertEquals(active.total, 1);
    const retired = await call("list_skills", {
      workspace: root,
      scope: "global",
      lifecycle: "deprecated",
    });
    assertEquals(retired.total, 1);
    const diagnostics = await call("get_workspace_diagnostics", {
      workspace: root,
    });
    assert(
      Array.isArray(
        (diagnostics.localContext as { governance: unknown[] }).governance,
      ),
    );
  } finally {
    await transport.terminateSession();
    await client.close();
    globalThis.fetch = savedFetch;
    await Deno.remove(root, { recursive: true });
  }
});
