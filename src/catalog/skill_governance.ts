import * as z from "zod/v4";
import { LorError } from "@src/errors.ts";
import { fingerprint } from "./revision.ts";
import type { SkillCatalogEntry } from "./types.ts";

const text = z.string().trim().min(1).max(2000);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const timestamp = z.string().datetime();
export const skillReferenceSchema = z.discriminatedUnion("scope", [
  z.strictObject({ scope: z.literal("global"), skillName: text }),
  z.strictObject({
    scope: z.literal("workspace"),
    workspace: text,
    skillName: text,
  }),
]);
export type SkillReference = z.infer<typeof skillReferenceSchema>;
export const responsibilitySchema = z.strictObject({
  summary: text,
  owns: z.array(text).max(30),
  excludes: z.array(text).max(30),
  relationships: z.array(z.strictObject({
    kind: z.enum(["complements", "delegatesTo", "specializes"]),
    target: skillReferenceSchema,
    reason: text,
  })).max(30),
});
export const provenanceSchema = z.strictObject({
  kind: z.enum([
    "manual",
    "local-file",
    "repository",
    "remote-package",
    "bundled",
    "catalog-import",
  ]),
  locator: text.optional(),
  version: text.optional(),
  sourceHash: hash.optional(),
  capturedAt: timestamp,
  assurance: z.enum(["claimed", "captured"]),
});
export const reviewSchema = z.strictObject({
  contentFingerprint: hash,
  reviewedAt: timestamp,
  method: text,
  evidence: text,
  outcome: z.enum(["passed", "needs-attention"]),
  intervalDays: z.number().int().min(1).max(3650).optional(),
});
export const lifecycleSchema = z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("active") }),
  z.strictObject({
    status: z.literal("deprecated"),
    reason: text,
    deprecatedAt: timestamp,
    replacement: skillReferenceSchema.optional(),
  }),
]);
export const governanceSchema = z.strictObject({
  responsibility: responsibilitySchema.optional(),
  provenance: provenanceSchema.optional(),
  review: reviewSchema.optional(),
  lifecycle: lifecycleSchema.optional(),
});
// Input defaults are placeholders only; service preparation assigns server time.
const unspecifiedTime = "1970-01-01T00:00:00.000Z";
const provenanceInputSchema = provenanceSchema.extend({
  capturedAt: timestamp.default(unspecifiedTime),
  assurance: z.enum(["claimed", "captured"]).default("claimed"),
});
const reviewInputSchema = reviewSchema.extend({
  reviewedAt: timestamp.default(unspecifiedTime),
});
const lifecycleInputSchema = z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("active") }),
  z.strictObject({
    status: z.literal("deprecated"),
    reason: text,
    deprecatedAt: timestamp.default(unspecifiedTime),
    replacement: skillReferenceSchema.optional(),
  }),
]);
export const governanceInputSchema = governanceSchema.extend({
  provenance: provenanceInputSchema.optional(),
  review: reviewInputSchema.optional(),
  lifecycle: lifecycleInputSchema.optional(),
});
export const governancePatchSchema = z.strictObject({
  responsibility: responsibilitySchema.nullable().optional(),
  provenance: provenanceInputSchema.nullable().optional(),
  review: reviewInputSchema.nullable().optional(),
  lifecycle: lifecycleInputSchema.optional(),
}).refine(
  (v) => Object.values(v).some((x) => x !== undefined),
  "Specify a governance change.",
);
export type SkillGovernance = z.infer<typeof governanceSchema>;
export type GovernancePatch = z.infer<typeof governancePatchSchema>;
export type Freshness =
  | "unreviewed"
  | "current"
  | "changed-since-review"
  | "review-due"
  | "needs-attention";
export function validateGovernance(value: unknown): SkillGovernance {
  const result = governanceSchema.safeParse(value);
  if (!result.success) {
    throw new LorError(
      "validation_error",
      "Invalid skill governance metadata.",
    );
  }
  return result.data;
}
export function validateGovernancePatch(value: unknown): GovernancePatch {
  const result = governancePatchSchema.safeParse(value);
  if (!result.success) {
    throw new LorError("validation_error", "Invalid skill governance patch.");
  }
  return result.data;
}
export function mergeGovernance(
  current: SkillGovernance | undefined,
  patch: GovernancePatch | undefined,
): SkillGovernance | undefined {
  if (!patch) return current;
  const next = { ...current };
  for (const key of Object.keys(patch) as (keyof GovernancePatch)[]) {
    const value = patch[key];
    if (value === null) delete next[key];
    else if (value !== undefined) Object.assign(next, { [key]: value });
  }
  return next;
}
export function contentFingerprint(entry: SkillCatalogEntry): string {
  return fingerprint({
    primarySpecialty: entry.primarySpecialty,
    specialtyTags: entry.specialtyTags,
    skillContext: entry.skillContext,
    routing: entry.routing,
    responsibility: entry.governance?.responsibility,
  });
}
export function freshness(entry: SkillCatalogEntry, now: string): Freshness {
  const review = entry.governance?.review;
  if (!review) return "unreviewed";
  if (Date.parse(review.reviewedAt) > Date.parse(now)) return "needs-attention";
  if (review.contentFingerprint !== contentFingerprint(entry)) {
    return "changed-since-review";
  }
  if (review.outcome === "needs-attention") return "needs-attention";
  if (
    review.intervalDays &&
    Date.parse(now) >=
      Date.parse(review.reviewedAt) + review.intervalDays * 86400000
  ) return "review-due";
  return "current";
}
export function skillReference(
  entry: Pick<SkillCatalogEntry, "scope" | "workspace" | "skillName">,
): SkillReference {
  return entry.scope === "global"
    ? { scope: "global", skillName: entry.skillName }
    : {
      scope: "workspace",
      workspace: entry.workspace,
      skillName: entry.skillName,
    };
}
export function referenceKey(ref: SkillReference): string {
  return JSON.stringify([
    ref.scope,
    ref.scope === "workspace" ? ref.workspace : "global",
    ref.skillName,
  ]);
}
export function skillTargets(entry: SkillCatalogEntry): SkillReference[] {
  const targets =
    entry.governance?.responsibility?.relationships.map((r) => r.target) ?? [];
  const lifecycle = entry.governance?.lifecycle;
  return lifecycle?.status === "deprecated" && lifecycle.replacement
    ? [...targets, lifecycle.replacement]
    : targets;
}
export function isDeprecated(entry: SkillCatalogEntry): boolean {
  return entry.governance?.lifecycle?.status === "deprecated";
}

/** Caller supplied sources are claims. Only a trusted source reader may attest capture. */
export function prepareGovernance(
  entry: SkillCatalogEntry,
  patch: GovernancePatch | undefined,
  now: string,
): SkillGovernance | undefined {
  const governance = mergeGovernance(entry.governance, patch);
  if (!governance) return undefined;
  if (patch?.provenance) {
    governance.provenance = {
      ...patch.provenance,
      assurance: "claimed",
      capturedAt: now,
    };
  }
  if (patch?.review) {
    const expected = contentFingerprint({ ...entry, governance });
    if (patch.review.contentFingerprint !== expected) {
      throw new LorError(
        "validation_error",
        "Review fingerprint does not cover the proposed skill content.",
        { expectedFingerprint: expected },
      );
    }
    governance.review = { ...patch.review, reviewedAt: now };
  }
  if (patch?.lifecycle?.status === "deprecated") {
    governance.lifecycle = { ...patch.lifecycle, deprecatedAt: now };
  }
  return governance;
}
export function describeSkill(
  entry: SkillCatalogEntry,
  now: string,
): SkillCatalogEntry {
  return {
    ...entry,
    freshness: freshness(entry, now),
    contentFingerprint: contentFingerprint(entry),
  };
}
