import { assertEquals, assertThrows } from "@std/assert";
import { page } from "@src/tools/discovery.ts";

Deno.test("discovery pages have stable ordering without duplicates", () => {
  const items = ["c", "a", "b"];
  const first = page(items, { limit: 2 }, "skills", (item) => item);
  assertEquals(first.items, ["a", "b"]);
  assertEquals(first.total, 3);
  const last = page(
    [...items].reverse(),
    { limit: 2, cursor: first.nextCursor },
    "skills",
    (item) => item,
  );
  assertEquals(last.items, ["c"]);
  assertEquals(last.nextCursor, undefined);
  assertEquals(page([], {}, "skills", (item: string) => item).items, []);
});

Deno.test("discovery rejects malformed, changed-filter and stale cursors", () => {
  const items = ["a", "b"];
  const { nextCursor: cursor } = page(
    items,
    { limit: 1 },
    "skills",
    (item) => item,
  );
  for (
    const [values, context] of [[items, "notes"], [
      [...items, "c"],
      "skills",
    ]] as const
  ) {
    assertThrows(
      () => page(values, { limit: 1, cursor }, context, (item) => item),
      Error,
      "Restart listing",
    );
  }
  assertThrows(() => page(items, { cursor: "bad" }, "skills", (item) => item));
  assertThrows(() => page(items, { limit: 101 }, "skills", (item) => item));
  assertThrows(() =>
    page(items, { limit: 2, cursor }, "skills", (item) => item)
  );
});
