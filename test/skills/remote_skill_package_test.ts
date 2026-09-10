import { assertEquals, assertRejects } from "@std/assert";
import { createHttpMcpHandler } from "@src/http_server.ts";
import { loadBundledSkill } from "@src/skills/bundled_skills.ts";
import { fetchRemoteSkill } from "@src/skills/remote_skill_package.ts";

Deno.test("SDK client downloads the package through actual MCP resource handlers", async () => {
  const handler = createHttpMcpHandler({
    runtimeFactory: () => {
      throw new Error("No registry access expected.");
    },
  });
  const originalFetch = globalThis.fetch;
  const methods: string[] = [];
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    methods.push(request.method);
    return await handler(request);
  };
  try {
    assertEquals(
      await fetchRemoteSkill(
        "http://127.0.0.1:8765/mcp",
        "lor-manage-skill",
        "1.1.0",
      ),
      await loadBundledSkill("lor-manage-skill"),
    );
    assertEquals(methods.at(-1), "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("remote package rejects tampered resources and closes the session", async () => {
  const handler = createHttpMcpHandler();
  const originalFetch = globalThis.fetch;
  const methods: string[] = [];
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    methods.push(request.method);
    const requestBody = request.method === "POST"
      ? await request.clone().json()
      : undefined;
    const response = await handler(request);
    if (
      requestBody?.method === "resources/read" &&
      requestBody.params.uri.endsWith("/SKILL.md")
    ) {
      const body = await response.json();
      body.result.contents[0].text += "tampered";
      return Response.json(body, { headers: response.headers });
    }
    return response;
  };
  try {
    await assertRejects(
      () =>
        fetchRemoteSkill(
          "http://127.0.0.1:8765/mcp",
          "lor-manage-skill",
          "1.1.0",
        ),
      Error,
      "integrity",
    );
    assertEquals(methods.at(-1), "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("remote package rejects unsafe endpoint and skill identifiers before connecting", async () => {
  for (
    const endpoint of [
      "http://remote.example/mcp",
      "file:///tmp/mcp",
      "https://user:pass@example.com/mcp",
    ]
  ) {
    await assertRejects(() =>
      fetchRemoteSkill(endpoint, "lor-manage-skill", "1.0.0")
    );
  }
  await assertRejects(() =>
    fetchRemoteSkill("http://127.0.0.1:8765/mcp", "../secret", "1.0.0")
  );
});
