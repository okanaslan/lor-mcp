import { createHash } from "node:crypto";
import { LorError } from "@src/errors.ts";

export function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest(
    "hex",
  );
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).filter(([, v]) => v !== undefined).sort((
        [a],
        [b],
      ) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)]),
    );
  }
  return value;
}

export function assertRevision(
  current: string | undefined,
  expected: string | undefined,
): void {
  if (expected !== undefined && current !== expected) {
    throw new LorError(
      "revision_conflict",
      "The entry changed since it was read.",
      { expectedRevision: expected, currentRevision: current },
    );
  }
}
