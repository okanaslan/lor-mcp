import { join, relative } from "@std/path";
import type { SkillCatalogEntry } from "@src/catalog/types.ts";
import { LorError } from "@src/errors.ts";

export const LOR_SKILL_CONTEXT_BEGIN = "<!-- BEGIN LOR SKILL CONTEXT -->";
export const LOR_SKILL_CONTEXT_END = "<!-- END LOR SKILL CONTEXT -->";

export interface LocalSkillSyncOptions {
  skillRoots: readonly string[];
}

export interface LocalSkillSyncPreview {
  skillName: string;
  targetFile: "SKILL.md";
  sectionName: "lor-managed-skill-context";
  sectionExists: boolean;
  wouldChange: boolean;
  renderedSection: string;
}

export interface LocalSkillSyncApplyResult extends LocalSkillSyncPreview {
  written: boolean;
}

export class LocalSkillSync {
  readonly #skillRoots: readonly string[];

  constructor(options: LocalSkillSyncOptions) {
    this.#skillRoots = options.skillRoots;
  }

  async preview(entry: SkillCatalogEntry): Promise<LocalSkillSyncPreview> {
    const skillFile = await this.resolveSkillFile(entry.skillName);
    const current = await Deno.readTextFile(skillFile);
    const renderedSection = renderSkillContextSection(entry);
    const next = upsertManagedSection(current, renderedSection);

    return {
      skillName: entry.skillName,
      targetFile: "SKILL.md",
      sectionName: "lor-managed-skill-context",
      sectionExists: hasCompleteManagedSection(current),
      wouldChange: next !== current,
      renderedSection,
    };
  }

  async apply(entry: SkillCatalogEntry): Promise<LocalSkillSyncApplyResult> {
    const skillFile = await this.resolveSkillFile(entry.skillName);
    const current = await Deno.readTextFile(skillFile);
    const renderedSection = renderSkillContextSection(entry);
    const next = upsertManagedSection(current, renderedSection);
    const sectionExists = hasCompleteManagedSection(current);
    const wouldChange = next !== current;

    if (wouldChange) {
      await Deno.writeTextFile(skillFile, next);
    }

    return {
      skillName: entry.skillName,
      targetFile: "SKILL.md",
      sectionName: "lor-managed-skill-context",
      sectionExists,
      wouldChange,
      renderedSection,
      written: wouldChange,
    };
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
        return skillFile;
      }
    }

    throw new LorError(
      "not_found",
      "Skill file was not found in the configured skill roots.",
      { skillName },
    );
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

  lines.push(LOR_SKILL_CONTEXT_END);
  return `${lines.join("\n")}\n`;
}

export function upsertManagedSection(
  current: string,
  renderedSection: string,
): string {
  const beginIndex = current.indexOf(LOR_SKILL_CONTEXT_BEGIN);
  const endIndex = current.indexOf(LOR_SKILL_CONTEXT_END);
  if ((beginIndex === -1) !== (endIndex === -1) || beginIndex > endIndex) {
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
  return `- ${value.replace(/\n/g, " ")}`;
}
