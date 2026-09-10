import { assert, assertEquals } from "@std/assert";
import {
  importCatalogInputSchema,
  introduceSkillInputSchema,
} from "@src/tools/schemas.ts";
import { outputSchemaFor } from "@src/tools/output_schemas.ts";
import { toolPolicy } from "@src/tools/policy.ts";

const input = {
  workspace: "test",
  skillName: "test",
  projectName: "test",
  displayName: "test",
  primarySpecialty: "test",
  specialtyTags: ["test"],
};

Deno.test("contracts reject unknown nested fields and oversized collections", () => {
  assert(
    !introduceSkillInputSchema.safeParse({
      ...input,
      routing: { positiveKeywrods: ["test"] },
    }).success,
  );
  assert(
    !introduceSkillInputSchema.safeParse({
      ...input,
      specialtyTags: Array(129).fill("test"),
    }).success,
  );
  assert(
    !introduceSkillInputSchema.safeParse({ ...input, extra: true }).success,
  );
  assert(
    !importCatalogInputSchema.safeParse({
      workspace: "test",
      catalog: {
        version: 1,
        exportedAt: "today",
        workspace: "test",
        filters: {},
        entries: [{ entryType: "unknown" }],
      },
    }).success,
  );
});

Deno.test("output contracts reject invalid results and contradictory envelopes", () => {
  const schema = outputSchemaFor("remove_workspace_note");
  assert(!schema.safeParse({ status: "ok", data: { removed: "yes" } }).success);
  assert(!schema.safeParse({ status: "ok" }).success);
  assert(
    !schema.safeParse({
      status: "error",
      data: {},
      error: { code: "invalid", message: "invalid" },
    }).success,
  );
  assert(
    schema.safeParse({
      status: "ok",
      data: { workspace: "test", noteId: "n", removed: true },
    }).success,
  );
  assertEquals(toolPolicy("list_skills").readOnlyHint, true);
  assertEquals(toolPolicy("clear_workspace_skills").destructiveHint, true);
});
