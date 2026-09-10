import { assert, assertEquals, assertExists } from "@std/assert";
import { createHttpMcpHandler } from "@src/http_server.ts";
import {
  DEFAULT_SKILLS_INDEX_URI,
  listBundledSkills,
  loadBundledSkill,
} from "@src/skills/bundled_skills.ts";
import { textHash, validatePackage } from "@src/skills/skill_package.ts";

Deno.test("bundled skills have complete, checksum-valid packages and unique resource identifiers", async () => {
  const entries = listBundledSkills();
  assertEquals(new Set(entries.map((s) => s.name)).size, entries.length);
  for (const entry of entries) {
    const bundle = await loadBundledSkill(entry.name);
    await validatePackage(bundle);
    assert(bundle.files["SKILL.md"].startsWith(`---\nname: ${entry.name}\n`));
    assert(bundle.files["SKILL.md"].includes(`version: "${entry.version}"`));
    assertEquals(bundle.manifest.files.map((f) => f.path), entry.files);
  }
});

Deno.test("MCP advertises and reads bundled resources without initializing the catalog database", async () => {
  const handler = createHttpMcpHandler({
    runtimeFactory: () => {
      throw new Error("Resource reads must not open SQLite.");
    },
  });
  let sessionId: string | undefined;
  let id = 0;
  async function rpc(method: string, params: Record<string, unknown> = {}) {
    const response = await handler(
      new Request("http://127.0.0.1:8765/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          ...(sessionId ? { "mcp-session-id": sessionId } : {}),
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
      }),
    );
    sessionId ??= response.headers.get("mcp-session-id") ?? undefined;
    assertEquals(response.status, 200);
    return await response.json();
  }
  try {
    const initialized = await rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "resources-test", version: "1.0.0" },
    });
    assertExists(initialized.result.capabilities.resources);
    const listed = await rpc("resources/list");
    const uris = listed.result.resources.map((r: { uri: string }) => r.uri);
    assertEquals(new Set(uris).size, uris.length);
    assert(uris.includes(DEFAULT_SKILLS_INDEX_URI));
    assertEquals(
      (await rpc("resources/list")).result.resources,
      listed.result.resources,
    );
    const index = JSON.parse(
      (await rpc("resources/read", { uri: DEFAULT_SKILLS_INDEX_URI })).result
        .contents[0].text,
    );
    assertEquals(index.skills.length, 3);
    assertEquals(index.skills[0].name, "lor-manage-skill");
    const fallback = await rpc("tools/call", {
      name: "get_default_skill",
      arguments: { name: "lor-add-note" },
    });
    assertEquals(
      fallback.result.structuredContent.data.name,
      "lor-manage-note",
    );
    assert(
      fallback.result.structuredContent.data.content.includes(
        "# Manage A LOR Note",
      ),
    );
    const denied = await rpc("tools/call", {
      name: "get_default_skill",
      arguments: { name: "lor-add-note", path: "../../.env" },
    });
    assertEquals(denied.result.isError, true);
    const defaults = await rpc("tools/call", {
      name: "list_default_skills",
      arguments: {},
    });
    assertEquals(defaults.result.structuredContent.data.skills.length, 3);
    assert(!JSON.stringify(index).includes("# Manage A LOR Skill"));
    const manifest = JSON.parse(
      (await rpc("resources/read", { uri: index.skills[0].manifestUri })).result
        .contents[0].text,
    );
    const entry =
      (await rpc("resources/read", { uri: index.skills[0].entrypointUri }))
        .result.contents[0];
    assertEquals(
      await textHash(entry.text),
      manifest.files.find((f: { path: string }) => f.path === "SKILL.md")
        .sha256,
    );
    for (const uri of uris) {
      assertExists(
        (await rpc("resources/read", { uri })).result.contents[0].text,
      );
    }
    for (
      const uri of [
        "file:///etc/passwd",
        "lor://skills/lor-manage-skill/1.0.0/../../.env",
        "lor://skills/lor-manage-skill/9.0.0/SKILL.md",
      ]
    ) {
      assertExists((await rpc("resources/read", { uri })).error);
    }
  } finally {
    if (sessionId) {
      await handler(
        new Request("http://127.0.0.1:8765/mcp", {
          method: "DELETE",
          headers: { "mcp-session-id": sessionId },
        }),
      );
    }
  }
});
