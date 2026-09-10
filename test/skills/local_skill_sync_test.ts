import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { join } from "@std/path";
import {
  LocalSkillSync,
  LOR_SKILL_CONTEXT_BEGIN,
  LOR_SKILL_CONTEXT_END,
  upsertManagedSection,
} from "@src/skills/local_skill_sync.ts";
import type { SkillCatalogEntry } from "@src/catalog/types.ts";
import { FIXED_NOW } from "@test/helpers/catalog_fixtures.ts";

Deno.test("LocalSkillSync binds preview to file and content and keeps a recovery copy", async () => {
  const { root, file } = await createSkillFile("backend-skill", "Original\n");
  try {
    const sync = new LocalSkillSync({ skillRoots: [root] });
    const preview = await sync.preview(skillEntry());
    await Deno.writeTextFile(file, "User edit\n");
    await assertRejects(
      () => sync.apply(skillEntry(), preview.previewDigest),
      Error,
      "local_file_modified",
    );
    assertEquals(await Deno.readTextFile(file), "User edit\n");
    const current = await sync.preview(skillEntry());
    await assertRejects(
      () =>
        sync.apply(
          skillEntry({ displayName: "Changed" }),
          current.previewDigest,
        ),
      Error,
      "local_file_modified",
    );
    const applied = await sync.apply(skillEntry(), current.previewDigest);
    assertEquals(await Deno.readTextFile(applied.backupFile!), "User edit\n");
    assertEquals(
      (await sync.apply(
        skillEntry(),
        (await sync.preview(skillEntry())).previewDigest,
      )).written,
      false,
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("LocalSkillSync rejects symlinks, oversized files, locks and duplicate markers", async () => {
  const { root, file } = await createSkillFile("backend-skill", "Original");
  try {
    const sync = new LocalSkillSync({ skillRoots: [root] });
    await Deno.rename(file, join(root, "original.md"));
    await Deno.symlink(join(root, "original.md"), file);
    await assertRejects(() => sync.preview(skillEntry()), Error, "symlink");
    await Deno.remove(file);
    await Deno.writeTextFile(file, "x".repeat(1024 * 1024 + 1));
    await assertRejects(() => sync.preview(skillEntry()), Error, "1 MiB");
    await Deno.writeTextFile(file, "Original");
    const lock = join(root, "backend-skill", ".lor-context-sync.lock");
    await Deno.writeTextFile(lock, "");
    await assertRejects(() => sync.apply(skillEntry()), Error, "sync lock");
    assertEquals(await Deno.readTextFile(file), "Original");
    const block =
      `${LOR_SKILL_CONTEXT_BEGIN}\ncontent\n${LOR_SKILL_CONTEXT_END}`;
    assertThrows(() => upsertManagedSection(`${block}\n${block}`, block));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

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

Deno.test("LocalSkillSync renders implementation guidance in managed section", async () => {
  const { root } = await createSkillFile(
    "backend-skill",
    "# Backend Skill\n",
  );
  const sync = new LocalSkillSync({ skillRoots: [root] });

  const preview = await sync.preview(skillEntry({
    skillContext: {
      implementationGuidance: {
        firstInspect: ["src/catalog/service.ts"],
        implementationRules: ["Keep matching deterministic."],
        commonFixPatterns: [{
          problem: "Repeated validation logic",
          approach: "Extract a focused helper.",
          antiPattern: "Parse user input inside handlers.",
        }],
        testsToAdd: ["Add service and schema tests."],
        verification: ["mise x deno@latest -- deno task test"],
        handoffChecklist: ["Report exact verification results."],
      },
    },
  }));

  assertEquals(
    preview.renderedSection.includes("### Implementation Guidance"),
    true,
  );
  assertEquals(preview.renderedSection.includes("#### First Inspect"), true);
  assertEquals(
    preview.renderedSection.includes("- src/catalog/service.ts"),
    true,
  );
  assertEquals(
    preview.renderedSection.includes(
      "- Problem: Repeated validation logic; Approach: Extract a focused helper.; Anti-pattern: Parse user input inside handlers.",
    ),
    true,
  );
  assertEquals(preview.renderedSection.includes("#### Verification"), true);
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

Deno.test("LocalSkillSync inventories local skill names from configured roots", async () => {
  const { root } = await createSkillFile("backend-skill", "# Backend Skill\n");
  await Deno.mkdir(join(root, "frontend-skill"), { recursive: true });
  await Deno.writeTextFile(
    join(root, "frontend-skill", "SKILL.md"),
    "# Frontend Skill\n",
  );
  await Deno.mkdir(join(root, "not-a-skill"), { recursive: true });
  const sync = new LocalSkillSync({ skillRoots: [root] });

  const inventory = await sync.inventory();

  assertEquals(sync.configuredRootCount, 1);
  assertEquals(inventory.skillNames, ["backend-skill", "frontend-skill"]);
  assertEquals(await sync.hasSkillFile("backend-skill"), true);
  assertEquals(await sync.hasSkillFile("missing-skill"), false);
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
    scope: "workspace",
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
