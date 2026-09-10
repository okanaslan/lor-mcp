import { dirname, isAbsolute, join } from "@std/path";
import {
  packageManifestSchema,
  type SkillPackage,
  type SkillPackageManifest,
  textHash,
  validatePackage,
} from "@src/skills/skill_package.ts";

const RECEIPT = ".lor-install.json";
const LOCK = ".lor-skills-install.lock";

interface Snapshot {
  fingerprint: string;
  manifest?: SkillPackageManifest;
  conflict?: string;
  exists: boolean;
}

export interface SkillInstallPreview {
  root: string;
  plan: string;
  skills: Array<{
    name: string;
    version: string;
    status: "install" | "update" | "unchanged" | "conflict";
    reason?: string;
  }>;
}

export async function previewSkillInstall(
  root: string,
  bundles: readonly SkillPackage[],
): Promise<SkillInstallPreview> {
  return (await prepare(root, bundles)).preview;
}

export async function installSkills(
  root: string,
  bundles: readonly SkillPackage[],
  expectedPlan: string,
): Promise<SkillInstallPreview> {
  const prepared = await prepare(root, bundles);
  assertApplicable(prepared.preview, expectedPlan);
  if (prepared.preview.skills.every((skill) => skill.status === "unchanged")) {
    return prepared.preview;
  }
  const lockPath = join(prepared.preview.root, LOCK);
  let lock: Deno.FsFile;
  try {
    lock = await Deno.open(lockPath, { write: true, createNew: true });
  } catch (error) {
    if (error instanceof Deno.errors.AlreadyExists) {
      throw new Error(
        "Another install may be running. Check the root's install lock before retrying.",
      );
    }
    throw error;
  }
  try {
    // Recheck under the local installer lock; the preview grants no overwrite rights.
    const latest = await prepare(root, bundles);
    assertApplicable(latest.preview, expectedPlan);
    for (const [index, bundle] of latest.bundles.entries()) {
      if (latest.preview.skills[index].status === "unchanged") continue;
      await commitPackage(latest.preview.root, bundle, latest.snapshots[index]);
    }
    return latest.preview;
  } finally {
    lock.close();
    await Deno.remove(lockPath);
  }
}

async function prepare(root: string, input: readonly SkillPackage[]) {
  if (!isAbsolute(root)) {
    throw new Error("The skill root must be an absolute local directory.");
  }
  const rootInfo = await Deno.lstat(root);
  if (!rootInfo.isDirectory || rootInfo.isSymlink) {
    throw new Error(
      "The skill root must be an existing directory, not a symlink.",
    );
  }
  const canonicalRoot = await Deno.realPath(root);
  if (
    !input.length ||
    new Set(input.map((b) => b.manifest.name)).size !== input.length
  ) {
    throw new Error("Select at least one skill, without duplicate names.");
  }
  // Own a copy so callers cannot change package contents after validation.
  const bundles = structuredClone([...input]).sort((a, b) =>
    a.manifest.name.localeCompare(b.manifest.name)
  );
  const snapshots: Snapshot[] = [];
  const skills: SkillInstallPreview["skills"] = [];
  for (const bundle of bundles) {
    await validatePackage(bundle);
    bundle.manifest = canonicalManifest(bundle.manifest);
    const current = await snapshot(join(canonicalRoot, bundle.manifest.name));
    snapshots.push(current);
    let status: SkillInstallPreview["skills"][number]["status"] = "install";
    let reason = current.conflict;
    if (current.manifest) {
      if (
        JSON.stringify(current.manifest) === JSON.stringify(bundle.manifest)
      ) {
        status = "unchanged";
      } else if (
        compareVersions(bundle.manifest.version, current.manifest.version) <= 0
      ) {
        reason =
          "A changed package must have a newer version; downgrades and same-version replacements are refused.";
      } else {
        status = "update";
      }
      if (current.manifest.name !== bundle.manifest.name) {
        reason = "Installed receipt has a different skill name.";
      }
    }
    if (reason) status = "conflict";
    skills.push({
      name: bundle.manifest.name,
      version: bundle.manifest.version,
      status,
      ...(reason ? { reason } : {}),
    });
  }
  const preview: SkillInstallPreview = {
    root: canonicalRoot,
    skills,
    plan: await textHash(
      JSON.stringify({
        root: canonicalRoot,
        packages: bundles.map((b) => b.manifest),
        snapshots,
      }),
    ),
  };
  return { preview, bundles, snapshots };
}

function assertApplicable(
  preview: SkillInstallPreview,
  expectedPlan: string,
): void {
  if (preview.skills.some((skill) => skill.status === "conflict")) {
    throw new Error(
      "Installation conflicts: " +
        preview.skills.filter((s) => s.status === "conflict").map((s) =>
          `${s.name}: ${s.reason}`
        ).join("; "),
    );
  }
  if (preview.plan !== expectedPlan) {
    throw new Error(
      "The install preview is stale. Preview again before applying.",
    );
  }
}

async function snapshot(directory: string): Promise<Snapshot> {
  const info = await lstatOrMissing(directory);
  if (!info) return { fingerprint: "absent", exists: false };
  const conflict = (reason: string): Snapshot => ({
    fingerprint: reason,
    exists: true,
    conflict: reason,
  });
  if (!info.isDirectory || info.isSymlink) {
    return conflict("The target is not a regular directory.");
  }
  const receiptPath = join(directory, RECEIPT);
  const receiptInfo = await lstatOrMissing(receiptPath);
  if (
    !receiptInfo?.isFile || receiptInfo.isSymlink ||
    receiptInfo.size > 64 * 1024
  ) {
    return conflict(
      "Existing skill has no valid LOR receipt; preserve the unmanaged folder.",
    );
  }
  let manifest: SkillPackageManifest;
  try {
    manifest = canonicalManifest(
      JSON.parse(await Deno.readTextFile(receiptPath)),
    );
  } catch {
    return conflict("The installation receipt is invalid.");
  }
  const expectedFiles = new Map(
    manifest.files.map((file) => [file.path, file]),
  );
  const expectedDirs = new Set<string>();
  for (const file of manifest.files) {
    let parent = dirname(file.path);
    while (parent !== ".") {
      expectedDirs.add(parent);
      parent = dirname(parent);
    }
  }
  const found = new Set<string>();
  async function inspect(
    path: string,
    prefix: string,
  ): Promise<string | undefined> {
    for await (const entry of Deno.readDir(path)) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (relative === RECEIPT) continue;
      if (entry.isSymlink) return `Symlink found: ${relative}`;
      if (entry.isDirectory && expectedDirs.has(relative)) {
        const problem = await inspect(join(path, entry.name), relative);
        if (problem) return problem;
      } else {
        const file = expectedFiles.get(relative);
        if (!entry.isFile || !file) {
          return `Unmanaged content found: ${relative}`;
        }
        const actual = await Deno.lstat(join(path, entry.name));
        if (!actual.isFile || actual.isSymlink || actual.size !== file.size) {
          return `Locally modified file: ${relative}`;
        }
        if (
          await textHash(await Deno.readTextFile(join(path, entry.name))) !==
            file.sha256
        ) return `Locally modified file: ${relative}`;
        found.add(relative);
      }
    }
  }
  const problem = await inspect(directory, "");
  if (problem) return conflict(problem);
  if (found.size !== expectedFiles.size) {
    return conflict("An installed file is missing.");
  }
  return {
    exists: true,
    manifest,
    fingerprint: await textHash(JSON.stringify(manifest)),
  };
}

async function commitPackage(
  root: string,
  bundle: SkillPackage,
  expected: Snapshot,
): Promise<void> {
  const target = join(root, bundle.manifest.name);
  const staging = await Deno.makeTempDir({
    dir: root,
    prefix: ".lor-skill-stage-",
  });
  const next = join(staging, "next");
  const previous = join(staging, "previous");
  let moved = false;
  let keepBackup = false;
  try {
    await Deno.mkdir(next);
    for (const file of bundle.manifest.files) {
      const path = join(next, file.path);
      await Deno.mkdir(dirname(path), { recursive: true });
      await Deno.writeTextFile(path, bundle.files[file.path], {
        createNew: true,
      });
    }
    await Deno.writeTextFile(
      join(next, RECEIPT),
      JSON.stringify(bundle.manifest, null, 2) + "\n",
      { createNew: true },
    );
    const current = await snapshot(target);
    if (current.conflict || current.fingerprint !== expected.fingerprint) {
      throw new Error("The skill changed during installation; preview again.");
    }
    if (current.exists) {
      await Deno.rename(target, previous);
      moved = true;
      const saved = await snapshot(previous);
      if (saved.conflict || saved.fingerprint !== expected.fingerprint) {
        throw new Error("The skill changed during installation; restoring it.");
      }
    }
    // Installers cooperate through the root lock. The destination is user-owned,
    // not a sandbox against a different process with write access to this root.
    if (await lstatOrMissing(target)) {
      throw new Error("The destination appeared during installation.");
    }
    await Deno.rename(next, target);
    moved = false;
  } catch (error) {
    if (moved) {
      try {
        if (await lstatOrMissing(target)) {
          throw new Error("Destination occupied.");
        }
        await Deno.rename(previous, target);
      } catch {
        keepBackup = true;
        throw new Error(
          `Installation failed; the original skill is preserved at ${previous}. Inspect it before retrying.`,
          { cause: error },
        );
      }
    }
    throw error;
  } finally {
    if (!keepBackup) await Deno.remove(staging, { recursive: true });
  }
}

async function lstatOrMissing(
  path: string,
): Promise<Deno.FileInfo | undefined> {
  try {
    return await Deno.lstat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
}

function compareVersions(a: string, b: string): number {
  const left = a.split(".").map(BigInt);
  const right = b.split(".").map(BigInt);
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] > right[i] ? 1 : -1;
  }
  return 0;
}

function canonicalManifest(value: unknown): SkillPackageManifest {
  const manifest = packageManifestSchema.parse(value);
  manifest.files.sort((a, b) => a.path.localeCompare(b.path));
  return manifest;
}
