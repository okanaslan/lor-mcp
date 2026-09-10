import { assert, assertEquals, assertRejects } from "@std/assert";
import {
  MAX_RESULT_BYTES,
  RESULT_PAGE_CHARS,
  ResultPages,
} from "@src/tools/result_pages.ts";
import { correlateResult, okResult } from "@src/tools/response.ts";
import { contractFingerprint } from "@src/tools/registry.ts";
import type { ToolRuntime } from "@src/tools/runtime.ts";
import { LorError } from "@src/errors.ts";
import { outputSchemaFor } from "@src/tools/output_schemas.ts";

Deno.test("result snapshots reauthorize, expire, reject invalid offsets, and bound retained bytes", async () => {
  let now = 0;
  let allowed = true;
  let closes = 0;
  const pages = new ResultPages(() => now);
  const runtimeFactory = () =>
    Promise.resolve({
      authorize(tool: string, input: unknown) {
        assertEquals(tool, "get_workspace_note");
        assertEquals(input, { workspace: "allowed", noteId: "n" });
        if (!allowed) throw new LorError("access_denied", "Denied");
        return Promise.resolve();
      },
      close() {
        closes++;
      },
    } as unknown as ToolRuntime);
  const input = { workspace: "allowed", noteId: "n" };
  const original = correlateResult(
    okResult({ body: '\uD83D\uDE00"\\\n'.repeat(60000) }, "Large result"),
    "original-id",
  );
  const bounded = pages.bound(original, "get_workspace_note", input);
  assertEquals(bounded.structuredContent.status, "deferred");
  assert(
    new TextEncoder().encode(JSON.stringify(bounded)).length < MAX_RESULT_BYTES,
  );
  assert(
    outputSchemaFor("get_workspace_note").safeParse(bounded.structuredContent)
      .success,
  );
  const data = bounded.structuredContent.data as {
    resultResource: { uri: string };
  };
  const id = new URL(data.resultResource.uri).pathname.split("/")[1];
  let text = "";
  for (let offset = 0;; offset += RESULT_PAGE_CHARS) {
    const page = await pages.read(id, offset, runtimeFactory);
    assert(
      new TextEncoder().encode(JSON.stringify(page)).length < MAX_RESULT_BYTES,
    );
    text += page.text;
    if (!page.nextUri) break;
  }
  assertEquals(JSON.parse(text), original.structuredContent);
  await assertRejects(
    () => pages.read(id, 1, runtimeFactory),
    Error,
    "invalid_cursor",
  );
  await assertRejects(
    () => pages.read(id, 999999999, runtimeFactory),
    Error,
    "invalid_cursor",
  );
  allowed = false;
  await assertRejects(
    () => pages.read(id, 0, runtimeFactory),
    Error,
    "access_denied",
  );
  assert(closes > 1);
  now = 300001;
  await assertRejects(
    () => pages.read(id, 0, runtimeFactory),
    Error,
    "not_found",
  );
  const first = pages.bound(
    okResult({ body: "x".repeat(9 * 1024 * 1024) }, "Large"),
    "get_workspace_note",
    input,
  );
  const firstUri =
    (first.structuredContent.data as { resultResource: { uri: string } })
      .resultResource.uri;
  pages.bound(
    okResult({ body: "y".repeat(9 * 1024 * 1024) }, "Large"),
    "get_workspace_note",
    input,
  );
  await assertRejects(
    () =>
      pages.read(new URL(firstUri).pathname.split("/")[1], 0, runtimeFactory),
    Error,
    "not_found",
  );
  const tooLarge = pages.bound(
    okResult({ body: "x".repeat(17 * 1024 * 1024) }, "Large"),
    "get_workspace_note",
    input,
  );
  assertEquals(tooLarge.isError, true);
  assertEquals(
    (tooLarge.structuredContent.error as { code: string }).code,
    "response_too_large",
  );
  assert(JSON.stringify(tooLarge).includes("may already have completed"));
});

Deno.test("tool contract fingerprints are order-independent and change with advertised schema or description", () => {
  const one = {
    name: "one",
    inputSchema: {},
    outputSchema: {},
    annotations: {},
    description: "read",
  };
  const two = { ...one, name: "two" };
  assertEquals(
    contractFingerprint([one, two]),
    contractFingerprint([two, one]),
  );
  assert(
    contractFingerprint([one]) !==
      contractFingerprint([{
        ...one,
        inputSchema: { required: ["revision"] },
      }]),
  );
  assert(
    contractFingerprint([one]) !==
      contractFingerprint([{ ...one, description: "write" }]),
  );
});

Deno.test("paged bundled context keeps its database-free read contract", async () => {
  const pages = new ResultPages();
  const result = pages.bound(
    okResult({ content: "x".repeat(300000) }, "Bundled"),
    "get_default_skill",
    { name: "example", path: "SKILL.md" },
  );
  const uri =
    (result.structuredContent.data as { resultResource: { uri: string } })
      .resultResource.uri;
  const first = await pages.read(new URL(uri).pathname.split("/")[1], 0, () => {
    throw new Error("Bundled reads must not initialize the database.");
  });
  assert(first.text.includes("content"));
});
