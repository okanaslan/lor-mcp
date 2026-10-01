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
export const governancePatchSchema = z.strictObject({
  responsibility: responsibilitySchema.nullable().optional(),
  provenance: provenanceSchema.nullable().optional(),
  review: reviewSchema.nullable().optional(),
  lifecycle: lifecycleSchema.optional(),
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
