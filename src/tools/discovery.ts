import { fingerprint } from "@src/catalog/revision.ts";
import type { CatalogEntry, MatchData } from "@src/catalog/types.ts";
import { LorError } from "@src/errors.ts";
import { catalogResourceUri } from "@src/catalog/context.ts";

export interface PageInput {
  cursor?: string;
  limit?: number;
}

export function page<T>(
  items: readonly T[],
  input: PageInput,
  context: unknown,
  key: (item: T) => string,
) {
  const limit = input.limit ?? 20;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new LorError("validation_error", "limit must be between 1 and 100.", {
      field: "limit",
    });
  }
  const sorted = [...items].sort((a, b) => key(a).localeCompare(key(b)));
  const snapshot = fingerprint({ context, limit, items: sorted });
  let offset = 0;
  if (input.cursor) {
    try {
      const parsed = JSON.parse(atob(input.cursor));
      if (
        parsed.snapshot !== snapshot || !Number.isSafeInteger(parsed.offset) ||
        parsed.offset < 0 || parsed.offset >= sorted.length
      ) throw new Error("stale cursor");
      offset = parsed.offset;
    } catch {
      throw new LorError(
        "invalid_cursor",
        "Cursor is invalid or the catalog changed. Restart listing.",
      );
    }
  }
  const nextOffset = offset + limit;
  return {
    items: sorted.slice(offset, nextOffset),
    total: sorted.length,
    nextCursor: nextOffset < sorted.length
      ? btoa(JSON.stringify({ snapshot, offset: nextOffset }))
      : undefined,
  };
}

export function entrySummary(entry: CatalogEntry, workspace = entry.workspace) {
  return {
    workspace: entry.workspace,
    scope: entry.scope,
    entryType: entry.entryType,
    entryKey: entry.entryKey,
    displayName: entry.displayName,
    projectName: entry.projectName,
    primarySpecialty: entry.primarySpecialty,
    specialtyTags: entry.specialtyTags,
    revision: entry.revision,
    resourceUri: entry.entryType !== "agent"
      ? catalogResourceUri(
        entry.entryType,
        workspace,
        entry.scope,
        entry.entryKey,
      )
      : undefined,
  };
}

export function compactMatches(data: MatchData): MatchData {
  const compact = (entries: MatchData["skills"]) =>
    entries.map((entry) => {
      const {
        skillContext: _context,
        routing: _routing,
        negativeRouting: _negative,
        prompt: _prompt,
        agentReferences: _agents,
        skillReferences: _skills,
        unresolvedReferences: _unresolved,
        ...summary
      } = entry;
      return summary;
    });
  return {
    ...data,
    skills: compact(data.skills),
    subagents: compact(data.subagents),
  };
}
