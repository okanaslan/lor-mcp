import { dirname, join, relative } from "@std/path";
import type { SkillCatalogEntry } from "@src/catalog/types.ts";
import { LorError } from "@src/errors.ts";
import { fingerprint } from "@src/catalog/revision.ts";

export const LOR_SKILL_CONTEXT_BEGIN = "<!-- BEGIN LOR SKILL CONTEXT -->";
export const LOR_SKILL_CONTEXT_END = "<!-- END LOR SKILL CONTEXT -->";

export interface LocalSkillSyncOptions {
  skillRoots: readonly string[];
}

export interface LocalSkillSyncPreview {
  previewDigest: string;
  skillName: string;
  targetFile: "SKILL.md";
  sectionName: "lor-managed-skill-context";
  sectionExists: boolean;
  wouldChange: boolean;
  renderedSection: string;
}

export interface LocalSkillSyncApplyResult extends LocalSkillSyncPreview {
  written: boolean;
  backupFile?: string;
}

export interface LocalSkillInventory {
  skillNames: readonly string[];
}

export class LocalSkillSync {
  readonly #skillRoots: readonly string[];

  constructor(options: LocalSkillSyncOptions) {
    this.#skillRoots = options.skillRoots;
  }

  get configuredRootCount(): number {
    return this.#skillRoots.length;
  }

  async preview(entry: SkillCatalogEntry): Promise<LocalSkillSyncPreview> {
    const skillFile = await this.resolveSkillFile(entry.skillName);
    const current = await readSkillFile(skillFile);
    const renderedSection = renderSkillContextSection(entry);
    const next = upsertManagedSection(current, renderedSection);

    return {
      previewDigest: fingerprint({ skillFile, current, next }),
      skillName: entry.skillName,
      targetFile: "SKILL.md",
      sectionName: "lor-managed-skill-context",
      sectionExists: hasCompleteManagedSection(current),
      wouldChange: next !== current,
      renderedSection,
    };
  }

  async apply(
    entry: SkillCatalogEntry,
    expectedDigest?: string,
  ): Promise<LocalSkillSyncApplyResult> {
    const skillFile = await this.resolveSkillFile(entry.skillName);
    const lockPath = join(dirname(skillFile), ".lor-context-sync.lock");
    let lock: Deno.FsFile;
    try {
      lock = await Deno.open(lockPath, {
        createNew: true,
        write: true,
        mode: 0o600,
      });
    } catch (error) {
      if (error instanceof Deno.errors.AlreadyExists) {
        throw new LorError(
          "local_file_modified",
          "A local sync may be running. Inspect the sync lock before retrying.",
        );
      }
      throw error;
    }
    let stagedFile: string | undefined;
    try {
      const current = await readSkillFile(skillFile);
      const renderedSection = renderSkillContextSection(entry);
      const next = upsertManagedSection(current, renderedSection);
      const sectionExists = hasCompleteManagedSection(current);
      const wouldChange = next !== current;
      const previewDigest = fingerprint({ skillFile, current, next });
      if (expectedDigest !== undefined && expectedDigest !== previewDigest) {
        throw new LorError(
          "local_file_modified",
          "The file or proposed content changed. Preview again before applying.",
        );
      }
      if (new TextEncoder().encode(next).length > MAX_SKILL_FILE_BYTES) {
        throw new LorError(
          "validation_error",
          "Updated skill file exceeds the 1 MiB limit.",
        );
      }
      let backupFile: string | undefined;

      if (wouldChange) {
        stagedFile = await Deno.makeTempFile({
          dir: dirname(skillFile),
          prefix: ".lor-context-",
        });
        const staged = await Deno.open(stagedFile, {
          write: true,
          truncate: true,
        });
        try {
          const bytes = new TextEncoder().encode(next);
          let offset = 0;
          while (offset < bytes.length) {
            offset += await staged.write(bytes.subarray(offset));
          }
          await staged.sync();
        } finally {
          staged.close();
        }
        if (
          await this.resolveSkillFile(entry.skillName) !== skillFile ||
          await readSkillFile(skillFile) !== current
        ) {
          throw new LorError(
            "local_file_modified",
            "The destination changed while preparing the write. Preview again.",
          );
        }
        backupFile = join(
          dirname(skillFile),
          `.lor-context-backup-${crypto.randomUUID()}.md`,
        );
        await Deno.writeTextFile(backupFile, current, {
          createNew: true,
          mode: 0o600,
        });
        await Deno.rename(stagedFile, skillFile);
        stagedFile = undefined;
      }

      return {
        previewDigest,
        skillName: entry.skillName,
        targetFile: "SKILL.md",
        sectionName: "lor-managed-skill-context",
        sectionExists,
        wouldChange,
        renderedSection,
        written: wouldChange,
        backupFile,
      };
    } finally {
      try {
        if (stagedFile) await Deno.remove(stagedFile);
      } finally {
        lock.close();
        await Deno.remove(lockPath);
      }
    }
  }

  async resolveSkillFile(skillName: string): Promise<string> {
    validateSkillNameForFileResolution(skillName);

    for (const root of this.#skillRoots) {
      const rootPath = await realPathOrUndefined(root);
      if (!rootPath) {
        continue;
      }

      const candidate = join(rootPath, skillName, "SKILL.md");
      const skillFile = await realPathOrUndefined(candidate);
      if (skillFile && isWithinRoot(rootPath, skillFile)) {
        if (
          (await Deno.lstat(root)).isSymlink ||
          (await Deno.lstat(join(rootPath, skillName))).isSymlink ||
          (await Deno.lstat(candidate)).isSymlink
        ) {
          throw new LorError(
            "validation_error",
            "Skill sync does not follow symlink roots, directories or files.",
          );
        }
        return skillFile;
      }
    }

    throw new LorError(
      "not_found",
      "Skill file was not found in the configured skill roots.",
      { skillName },
    );
  }

  async hasSkillFile(skillName: string): Promise<boolean> {
    try {
      await this.resolveSkillFile(skillName);
      return true;
    } catch (error) {
      if (error instanceof LorError && error.code === "not_found") {
        return false;
      }
      throw error;
    }
  }

  async inventory(): Promise<LocalSkillInventory> {
    const skillNames = new Set<string>();
    for (const root of this.#skillRoots) {
      const rootPath = await realPathOrUndefined(root);
      if (!rootPath) {
        continue;
      }
      for await (const entry of Deno.readDir(rootPath)) {
        if (!entry.isDirectory) {
          continue;
        }
        const skillFile = await realPathOrUndefined(
          join(rootPath, entry.name, "SKILL.md"),
        );
        if (skillFile && isWithinRoot(rootPath, skillFile)) {
          skillNames.add(entry.name);
        }
      }
    }
    return { skillNames: [...skillNames].sort() };
  }
}

export function renderSkillContextSection(entry: SkillCatalogEntry): string {
  if (!entry.skillContext) {
    throw new LorError(
      "validation_error",
      "Skill does not have stored context to sync.",
      { field: "skillContext" },
    );
  }

  const lines = [
    LOR_SKILL_CONTEXT_BEGIN,
    "## LOR Managed Context",
    "",
    "<!-- This section is managed by LOR MCP. Update it through approved local skill sync. -->",
    "",
    `Skill: ${entry.displayName}`,
    `Primary specialty: ${entry.primarySpecialty}`,
    `Specialty tags: ${entry.specialtyTags.join(", ")}`,
  ];

  if (entry.skillContext.whenToUse) {
    lines.push("", "### When To Use", "", entry.skillContext.whenToUse);
  }
  if (entry.skillContext.usageNotes) {
    lines.push("", "### Usage Notes", "", entry.skillContext.usageNotes);
  }
  if (entry.skillContext.constraints?.length) {
    lines.push("", "### Constraints", "");
    lines.push(...entry.skillContext.constraints.map(toMarkdownListItem));
  }
  if (entry.skillContext.examplePrompts?.length) {
    lines.push("", "### Example Prompts", "");
    lines.push(...entry.skillContext.examplePrompts.map(toMarkdownListItem));
  }
  const implementationGuidance = entry.skillContext.implementationGuidance;
  if (implementationGuidance) {
    lines.push("", "### Implementation Guidance");
    if (implementationGuidance.firstInspect?.length) {
      pushGuidanceList(
        lines,
        "First Inspect",
        implementationGuidance.firstInspect,
      );
    }
    if (implementationGuidance.implementationRules?.length) {
      pushGuidanceList(
        lines,
        "Implementation Rules",
        implementationGuidance.implementationRules,
      );
    }
    if (implementationGuidance.commonFixPatterns?.length) {
      lines.push("", "#### Common Fix Patterns", "");
      for (const pattern of implementationGuidance.commonFixPatterns) {
        const parts = [
          `Problem: ${singleLine(pattern.problem)}`,
          `Approach: ${singleLine(pattern.approach)}`,
        ];
        if (pattern.antiPattern) {
          parts.push(`Anti-pattern: ${singleLine(pattern.antiPattern)}`);
        }
        lines.push(`- ${parts.join("; ")}`);
      }
    }
    if (implementationGuidance.testsToAdd?.length) {
      pushGuidanceList(
        lines,
        "Tests To Add",
        implementationGuidance.testsToAdd,
      );
    }
    if (implementationGuidance.verification?.length) {
      pushGuidanceList(
        lines,
        "Verification",
        implementationGuidance.verification,
      );
    }
    if (implementationGuidance.handoffChecklist?.length) {
      pushGuidanceList(
        lines,
        "Handoff Checklist",
        implementationGuidance.handoffChecklist,
      );
    }
  }

  lines.push(LOR_SKILL_CONTEXT_END);
  const rendered = `${lines.join("\n")}\n`;
  if (
    rendered.split(LOR_SKILL_CONTEXT_BEGIN).length !== 2 ||
    rendered.split(LOR_SKILL_CONTEXT_END).length !== 2
  ) {
    throw new LorError(
      "validation_error",
      "Skill context contains reserved managed-section markers.",
    );
  }
  return rendered;
}

export function upsertManagedSection(
  current: string,
  renderedSection: string,
): string {
  const beginIndex = current.indexOf(LOR_SKILL_CONTEXT_BEGIN);
  const endIndex = current.indexOf(LOR_SKILL_CONTEXT_END);
  if (
    (beginIndex === -1) !== (endIndex === -1) || beginIndex > endIndex ||
    current.split(LOR_SKILL_CONTEXT_BEGIN).length > 2 ||
    current.split(LOR_SKILL_CONTEXT_END).length > 2
  ) {
    throw new LorError(
      "validation_error",
      "Skill file contains an incomplete LOR managed section.",
    );
  }

  if (beginIndex !== -1) {
    const replacementEnd = endIndex + LOR_SKILL_CONTEXT_END.length;
    const before = trimTrailingBlankLines(current.slice(0, beginIndex));
    const after = trimLeadingBlankLines(current.slice(replacementEnd));
    return joinFileSections(before, renderedSection.trimEnd(), after);
  }

  return joinFileSections(current.trimEnd(), renderedSection.trimEnd(), "");
}

const MAX_SKILL_FILE_BYTES = 1024 * 1024;

async function readSkillFile(path: string): Promise<string> {
  const info = await Deno.lstat(path);
  if (!info.isFile || info.isSymlink || info.size > MAX_SKILL_FILE_BYTES) {
    throw new LorError(
      "validation_error",
      "Skill sync requires a regular file no larger than 1 MiB.",
    );
  }
  const file = await Deno.open(path, { read: true });
  try {
    const bytes = new Uint8Array(MAX_SKILL_FILE_BYTES + 1);
    let offset = 0;
    while (offset < bytes.length) {
      const count = await file.read(bytes.subarray(offset));
      if (count === null) break;
      offset += count;
    }
    if (offset > MAX_SKILL_FILE_BYTES) {
      throw new LorError(
        "validation_error",
        "Skill file exceeds the 1 MiB limit.",
      );
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(
      bytes.subarray(0, offset),
    );
  } finally {
    file.close();
  }
}

function hasCompleteManagedSection(content: string): boolean {
  const beginIndex = content.indexOf(LOR_SKILL_CONTEXT_BEGIN);
  const endIndex = content.indexOf(LOR_SKILL_CONTEXT_END);
  return beginIndex !== -1 && endIndex !== -1 && beginIndex < endIndex;
}

function validateSkillNameForFileResolution(skillName: string): void {
  if (
    skillName.includes("/") ||
    skillName.includes("\\") ||
    skillName === "." ||
    skillName === ".."
  ) {
    throw new LorError(
      "validation_error",
      "skillName must be a registered skill name, not a path.",
      { field: "skillName" },
    );
  }
}

function isWithinRoot(root: string, candidate: string): boolean {
  const path = relative(root, candidate);
  return path === "SKILL.md" ||
    (!path.startsWith("..") && !path.startsWith("/") && !path.includes(".."));
}

async function realPathOrUndefined(path: string): Promise<string | undefined> {
  try {
    return await Deno.realPath(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return undefined;
    }
    throw error;
  }
}

function joinFileSections(
  before: string,
  middle: string,
  after: string,
): string {
  const sections = [before, middle, after].filter((section) => section.length);
  return `${sections.join("\n\n")}\n`;
}

function trimTrailingBlankLines(value: string): string {
  return value.replace(/\n+$/g, "");
}

function trimLeadingBlankLines(value: string): string {
  return value.replace(/^\n+/g, "");
}

function toMarkdownListItem(value: string): string {
  return `- ${singleLine(value)}`;
}

function pushGuidanceList(
  lines: string[],
  heading: string,
  values: readonly string[],
): void {
  lines.push("", `#### ${heading}`, "");
  lines.push(...values.map(toMarkdownListItem));
}

function singleLine(value: string): string {
  return value.replace(/\n/g, " ");
}
