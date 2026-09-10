import { fingerprint } from "@src/catalog/revision.ts";
import { LorError } from "@src/errors.ts";

export interface PageRequest {
  cursor?: string;
  limit?: number;
}
export interface CatalogPage<T> {
  items: T[];
  total: number;
  nextCursor?: string;
}

export function paginationState(
  input: PageRequest,
  context: unknown,
  generation: string,
) {
  const limit = input.limit ?? 20;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new LorError("validation_error", "limit must be between 1 and 100.");
  }
  const snapshot = fingerprint({ context, generation, limit });
  let after = "";
  if (input.cursor) {
    try {
      if (input.cursor.length > 512) throw new Error();
      const parsed = JSON.parse(atob(input.cursor));
      if (
        parsed.snapshot !== snapshot || typeof parsed.after !== "string" ||
        !parsed.after
      ) throw new Error();
      after = parsed.after;
    } catch {
      throw new LorError(
        "invalid_cursor",
        "Cursor is invalid or the catalog changed. Restart listing.",
      );
    }
  }
  return {
    limit,
    after,
    // The cursor binds filters and generation to a bounded SQL keyset position.
    cursor: (key: string) => btoa(JSON.stringify({ snapshot, after: key })),
  };
}
