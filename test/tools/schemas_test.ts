import { assertEquals } from "@std/assert";
import { clearWorkspaceCatalogInputSchema } from "@src/tools/schemas.ts";

Deno.test("clearWorkspaceCatalogInputSchema requires confirm true", () => {
  assertEquals(
    clearWorkspaceCatalogInputSchema.safeParse({
      workspace: "Agentic-Router",
      confirm: true,
    }).success,
    true,
  );
  assertEquals(
    clearWorkspaceCatalogInputSchema.safeParse({
      workspace: "Agentic-Router",
    }).success,
    false,
  );
  assertEquals(
    clearWorkspaceCatalogInputSchema.safeParse({
      workspace: "Agentic-Router",
      confirm: false,
    }).success,
    false,
  );
});
