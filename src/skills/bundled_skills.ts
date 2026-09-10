import catalog from "../../skills/manifest.json" with { type: "json" };
import {
  type SkillPackage,
  textHash,
  validatePackage,
} from "@src/skills/skill_package.ts";

export const DEFAULT_SKILLS_INDEX_URI = "lor://skills/index.json";
const packageRoot = new URL("../../skills/", import.meta.url);

export function listBundledSkills() {
  return catalog.skills.map((skill) => ({
    name: skill.name,
    version: skill.version,
    description: skill.description,
    aliases: [...skill.aliases],
    manifestUri: skillResourceUri(skill.name, skill.version, "manifest.json"),
    entrypointUri: skillResourceUri(skill.name, skill.version, "SKILL.md"),
    files: [...skill.files],
  }));
}

export function skillResourceUri(
  name: string,
  version: string,
  path: string,
): string {
  return `lor://skills/${name}/${version}/${path}`;
}

export async function loadBundledSkill(name: string): Promise<SkillPackage> {
  const skill = catalog.skills.find((entry) => entry.name === name);
  if (!skill) throw new Error(`Unknown bundled skill: ${name}`);
  const files: Record<string, string> = {};
  const entries = [];
  for (const path of skill.files) {
    const text = await Deno.readTextFile(
      new URL(`${skill.name}/${path}`, packageRoot),
    );
    files[path] = text;
    entries.push({
      path,
      sha256: await textHash(text),
      size: new TextEncoder().encode(text).length,
    });
  }
  const bundle: SkillPackage = {
    manifest: {
      schemaVersion: 1,
      name: skill.name,
      version: skill.version,
      description: skill.description,
      files: entries,
    },
    files,
  };
  await validatePackage(bundle);
  return bundle;
}

export async function readBundledFile(
  name: string,
  path: string,
): Promise<string> {
  const skill = catalog.skills.find((entry) => entry.name === name);
  if (!skill?.files.includes(path)) {
    throw new Error("Unknown bundled skill file.");
  }
  return await Deno.readTextFile(new URL(`${skill.name}/${path}`, packageRoot));
}
