import { assertEquals, assertRejects } from "@std/assert";
import { createCatalogService } from "@test/helpers/catalog_fixtures.ts";
import { executeOperation } from "@src/tools/operations.ts";
import { okResult } from "@src/tools/response.ts";
import { fingerprint } from "@src/catalog/revision.ts";

Deno.test("operation receipts replay completed writes and reject changed payloads", async () => {
  const { repo } = await createCatalogService();
  try {
    let writes = 0;
    const input = { workspace: "test", idempotencyKey: "key", title: "note" };
    const run = () => {
      writes++;
      return Promise.resolve(okResult({ noteId: "n" }, "created"));
    };
    const first = await executeOperation(
      repo,
      "remember_workspace_note",
      input,
      run,
    );
    assertEquals(
      await executeOperation(repo, "remember_workspace_note", input, run),
      first,
    );
    assertEquals(writes, 1);
    await assertRejects(
      () =>
        executeOperation(repo, "remember_workspace_note", {
          ...input,
          title: "different",
        }, run),
      Error,
      "idempotency_conflict",
    );
    assertEquals(writes, 1);
  } finally {
    repo.close();
  }
});

Deno.test("pending operation after a crash cannot repeat its mutation", async () => {
  const { repo } = await createCatalogService();
  try {
    const input = { workspace: "test", idempotencyKey: "interrupted" };
    repo.reserveOperation(
      "test",
      "interrupted",
      fingerprint({ name: "remember_workspace_note", input }),
    );
    await assertRejects(
      () =>
        executeOperation(repo, "remember_workspace_note", input, () => {
          throw new Error("must not execute");
        }),
      Error,
      "pending or uncertain",
    );
    assertEquals(repo.getOperation("test", "interrupted")?.status, "pending");
  } finally {
    repo.close();
  }
});
