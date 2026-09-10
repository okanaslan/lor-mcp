import { z } from "zod";

const safeName = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(64);
const safeVersion = z.string().regex(/^\d+\.\d+\.\d+$/);
const safePath = z.string().max(240).refine((path) =>
  path.split("/").every((part) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(part))
);

export const packageManifestSchema = z.object({
  schemaVersion: z.literal(1),
  name: safeName,
  version: safeVersion,
  description: z.string().min(1).max(1024),
  files: z.array(
    z.object({
      path: safePath,
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
      size: z.number().int().min(0).max(1024 * 1024),
    }).strict(),
  ).min(1).max(64),
}).strict().superRefine((manifest, context) => {
  const paths = manifest.files.map((file) => file.path);
  if (new Set(paths).size !== paths.length || !paths.includes("SKILL.md")) {
    context.addIssue({
      code: "custom",
      message: "Files must be unique and include SKILL.md.",
    });
  }
  if (
    manifest.files.reduce((sum, file) => sum + file.size, 0) > 4 * 1024 * 1024
  ) {
    context.addIssue({
      code: "custom",
      message: "Skill exceeds the 4 MiB package limit.",
    });
  }
  if (
    paths.some((path) => paths.some((other) => other.startsWith(`${path}/`)))
  ) {
    context.addIssue({
      code: "custom",
      message: "A file cannot also be a directory.",
    });
  }
});

export type SkillPackageManifest = z.infer<typeof packageManifestSchema>;
export interface SkillPackage {
  manifest: SkillPackageManifest;
  files: Record<string, string>;
}

export async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function textHash(text: string): Promise<string> {
  return await sha256(new TextEncoder().encode(text));
}

export async function validatePackage(bundle: SkillPackage): Promise<void> {
  const manifest = packageManifestSchema.parse(bundle.manifest);
  if (Object.keys(bundle.files).length !== manifest.files.length) {
    throw new Error("Package file count does not match its manifest.");
  }
  for (const file of manifest.files) {
    const text = bundle.files[file.path];
    if (typeof text !== "string") {
      throw new Error(`Missing package file: ${file.path}`);
    }
    const bytes = new TextEncoder().encode(text);
    if (bytes.length !== file.size || await sha256(bytes) !== file.sha256) {
      throw new Error(`Package integrity check failed: ${file.path}`);
    }
  }
}
