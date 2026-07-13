import { assertEquals } from "@std/assert";
import { errorResult, okResult, textContent } from "@src/tools/response.ts";

Deno.test("okResult returns the standard structured envelope", () => {
  const result = okResult({ entryKey: "skill-a" }, "Created skill-a.");

  assertEquals(result.structuredContent, {
    status: "ok",
    data: { entryKey: "skill-a" },
  });
  assertEquals(result.content, [textContent("Created skill-a.")]);
  assertEquals("isError" in result, false);
});

Deno.test("errorResult sets isError and sanitizes details", () => {
  const result = errorResult("setup_error", "Missing configuration.", {
    field: "AGENTIC_ROUTER_DB_PATH",
    path: "/private/tmp/router.db",
    namespace: "secret-workspace",
  });

  assertEquals(result.isError, true);
  assertEquals(result.structuredContent, {
    status: "error",
    error: {
      code: "setup_error",
      message: "Missing configuration.",
      details: { field: "AGENTIC_ROUTER_DB_PATH" },
    },
  });
});
