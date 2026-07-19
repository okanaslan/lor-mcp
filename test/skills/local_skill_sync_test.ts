import { assertEquals, assertRejects } from "@std/assert";
import { join } from "@std/path";
import {
  LocalSkillSync,
  LOR_SKILL_CONTEXT_BEGIN,
  LOR_SKILL_CONTEXT_END,
} from "@src/skills/local_skill_sync.ts";
import type { SkillCatalogEntry } from "@src/catalog/types.ts";
import { FIXED_NOW } from "@test/helpers/catalog_fixtures.ts";

Deno.test("LocalSkillSync previews managed section without mutating SKILL.md", async () => {
  const { root, file } = await createSkillFile(
    "backend-skill",
    [
      "# Backend Skill",
      "",
      "Original body.",
    ].join("\n"),
  );
  const sync = new LocalSkillSync({ skillRoots: [root] });

  const preview = await sync.preview(skillEntry());
  const afterPreview = await Deno.readTextFile(file);

  assertEquals(preview.sectionExists, false);
  assertEquals(preview.wouldChange, true);
  assertEquals(preview.renderedSection.includes(LOR_SKILL_CONTEXT_BEGIN), true);
  assertEquals(afterPreview, "# Backend Skill\n\nOriginal body.");
});

Deno.test("LocalSkillSync appends managed section to SKILL.md", async () => {
  const { root, file } = await createSkillFile(
    "backend-skill",
    "# Backend Skill\n",
  );
  const sync = new LocalSkillSync({ skillRoots: [root] });

  const result = await sync.apply(skillEntry());
  const updated = await Deno.readTextFile(file);

  assertEquals(result.written, true);
  assertEquals(updated.includes(LOR_SKILL_CONTEXT_BEGIN), true);
  assertEquals(updated.includes("### When To Use"), true);
  assertEquals(updated.includes("Use for backend implementation."), true);
});

Deno.test("LocalSkillSync replaces existing managed section only", async () => {
  const existing = [
    "# Backend Skill",
    "",
    "Keep this introduction.",
    "",
    LOR_SKILL_CONTEXT_BEGIN,
    "old managed content",
    LOR_SKILL_CONTEXT_END,
    "",
    "Keep this footer.",
  ].join("\n");
  const { root, file } = await createSkillFile("backend-skill", existing);
  const sync = new LocalSkillSync({ skillRoots: [root] });

  const result = await sync.apply(skillEntry({
    skillContext: {
      whenToUse: "Use after approval.",
    },
  }));
  const updated = await Deno.readTextFile(file);

  assertEquals(result.sectionExists, true);
  assertEquals(updated.includes("Keep this introduction."), true);
  assertEquals(updated.includes("Keep this footer."), true);
  assertEquals(updated.includes("old managed content"), false);
  assertEquals(updated.includes("Use after approval."), true);
});

Deno.test("LocalSkillSync rejects missing files and path-shaped skill names", async () => {
  const root = await Deno.makeTempDir();
  const sync = new LocalSkillSync({ skillRoots: [root] });

  await assertRejects(
    () => sync.preview(skillEntry({ skillName: "missing-skill" })),
    Error,
    "Skill file was not found",
  );
  await assertRejects(
    () => sync.preview(skillEntry({ skillName: "../backend-skill" })),
    Error,
    "skillName must be a registered skill name",
  );
});

async function createSkillFile(
  skillName: string,
  content: string,
): Promise<{ root: string; file: string }> {
  const root = await Deno.makeTempDir();
  const skillDir = join(root, skillName);
  await Deno.mkdir(skillDir, { recursive: true });
  const file = join(skillDir, "SKILL.md");
  await Deno.writeTextFile(file, content);
  return { root, file };
}

function skillEntry(
  overrides: Partial<SkillCatalogEntry> = {},
): SkillCatalogEntry {
  return {
    workspace: "LOR-MCP",
    entryType: "skill",
    entryKey: "backend-skill",
    skillName: "backend-skill",
    projectName: "Local Orchestration Router (LOR)",
    displayName: "Backend Skill",
    primarySpecialty: "Backend implementation",
    specialtyTags: ["backend", "testing"],
    verificationStatus: "verified",
    verificationSource: "test",
    verifiedAt: FIXED_NOW,
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
    skillContext: {
      whenToUse: "Use for backend implementation.",
      usageNotes: "Keep edits scoped.",
      constraints: ["Do not edit unrelated files."],
      examplePrompts: ["Implement a backend tool."],
    },
    ...overrides,
  };
}
