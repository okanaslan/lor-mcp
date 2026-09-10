import { assert, assertEquals, assertRejects } from "@std/assert";
import { join } from "@std/path";
import {
  installSkills,
  previewSkillInstall,
} from "@src/skills/local_skill_installer.ts";
import { type SkillPackage, textHash } from "@src/skills/skill_package.ts";
import { loadBundledSkill } from "@src/skills/bundled_skills.ts";
import { runSkillCli } from "@src/skills/cli.ts";

async function fixture(
  version = "1.0.0",
  files: Record<string, string> = {
    "SKILL.md": "# Test skill\n",
    "references/guide.md": "Guide\n",
  },
): Promise<SkillPackage> {
  const entries = [];
  for (const [path, text] of Object.entries(files)) {
    entries.push({
      path,
      size: new TextEncoder().encode(text).length,
      sha256: await textHash(text),
    });
  }
  return {
    manifest: {
      schemaVersion: 1,
      name: "test-skill",
      version,
      description: "Test skill",
      files: entries,
    },
    files,
  };
}

async function withRoot(run: (root: string) => Promise<void>): Promise<void> {
  const root = await Deno.makeTempDir();
  try {
    await run(root);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test("install preview is read-only; install verifies files and repeat install is unchanged", async () => {
  await withRoot(async (root) => {
    const bundle = await fixture();
    const preview = await previewSkillInstall(root, [bundle]);
    assertEquals(preview.skills[0].status, "install");
    assertEquals(Array.from(Deno.readDirSync(root)), []);
    await installSkills(root, [bundle], preview.plan);
    assertEquals(
      await Deno.readTextFile(join(root, "test-skill", "references/guide.md")),
      "Guide\n",
    );
    const again = await previewSkillInstall(root, [bundle]);
    assertEquals(again.skills[0].status, "unchanged");
    const receiptBefore = await Deno.stat(
      join(root, "test-skill", ".lor-install.json"),
    );
    await installSkills(root, [bundle], again.plan);
    assertEquals(
      (await Deno.stat(join(root, "test-skill", ".lor-install.json"))).mtime,
      receiptBefore.mtime,
    );
    assertEquals(Array.from(Deno.readDirSync(root)).map((e) => e.name), [
      "test-skill",
    ]);
  });
});

Deno.test("new version replaces only an intact managed skill, including removed package files", async () => {
  await withRoot(async (root) => {
    const v1 = await fixture();
    await installSkills(
      root,
      [v1],
      (await previewSkillInstall(root, [v1])).plan,
    );
    const v2 = await fixture("1.1.0", {
      "SKILL.md": "# Updated\n",
      "references/new.md": "New guide",
    });
    const preview = await previewSkillInstall(root, [v2]);
    assertEquals(preview.skills[0].status, "update");
    await installSkills(root, [v2], preview.plan);
    assertEquals(
      await Deno.readTextFile(join(root, "test-skill", "SKILL.md")),
      "# Updated\n",
    );
    await assertRejects(
      () => Deno.stat(join(root, "test-skill", "references/guide.md")),
      Deno.errors.NotFound,
    );
    assertEquals(
      (await previewSkillInstall(root, [v2])).skills[0].status,
      "unchanged",
    );
    assertEquals(
      (await previewSkillInstall(root, [v1])).skills[0].status,
      "conflict",
    );
  });
});

Deno.test("local edits, additions, deletions, and malformed receipts prevent all package writes", async () => {
  for (const change of ["edit", "add", "delete", "receipt"]) {
    await withRoot(async (root) => {
      const v1 = await fixture();
      await installSkills(
        root,
        [v1],
        (await previewSkillInstall(root, [v1])).plan,
      );
      const directory = join(root, "test-skill");
      if (change === "edit") {
        await Deno.writeTextFile(join(directory, "SKILL.md"), "User edit");
      }
      if (change === "add") {
        await Deno.writeTextFile(join(directory, "notes.txt"), "Keep me");
      }
      if (change === "delete") {
        await Deno.remove(join(directory, "references/guide.md"));
      }
      if (change === "receipt") {
        await Deno.writeTextFile(
          join(directory, ".lor-install.json"),
          "broken",
        );
      }
      const v2 = await fixture("2.0.0");
      const preview = await previewSkillInstall(root, [v2]);
      assertEquals(preview.skills[0].status, "conflict", change);
      await assertRejects(
        () => installSkills(root, [v2], preview.plan),
        Error,
        "conflicts",
      );
      assertEquals(
        await Deno.readTextFile(join(directory, "SKILL.md")),
        change === "edit" ? "User edit" : "# Test skill\n",
      );
      if (change === "add") {
        assertEquals(
          await Deno.readTextFile(join(directory, "notes.txt")),
          "Keep me",
        );
      }
    });
  }
});

Deno.test("unmanaged existing skill and symlink targets remain untouched", async () => {
  await withRoot(async (root) => {
    const bundle = await fixture();
    await Deno.mkdir(join(root, "test-skill"));
    await Deno.writeTextFile(
      join(root, "test-skill/SKILL.md"),
      "Existing skill",
    );
    assertEquals(
      (await previewSkillInstall(root, [bundle])).skills[0].status,
      "conflict",
    );
    await Deno.rename(join(root, "test-skill"), join(root, "outside"));
    await Deno.symlink(join(root, "outside"), join(root, "test-skill"));
    const preview = await previewSkillInstall(root, [bundle]);
    await assertRejects(
      () => installSkills(root, [bundle], preview.plan),
      Error,
      "conflicts",
    );
    assertEquals(
      await Deno.readTextFile(join(root, "outside/SKILL.md")),
      "Existing skill",
    );
    await assertRejects(
      () => previewSkillInstall(join(root, "test-skill"), [bundle]),
      Error,
      "symlink",
    );
  });
});

Deno.test("nested symlinks and receipt symlinks are refused without modifying their destination", async () => {
  for (const path of ["references", ".lor-install.json"]) {
    await withRoot(async (root) => {
      const bundle = await fixture();
      await installSkills(
        root,
        [bundle],
        (await previewSkillInstall(root, [bundle])).plan,
      );
      const file = join(root, "test-skill", path);
      await Deno.rename(file, join(root, "saved"));
      await Deno.symlink(join(root, "saved"), file);
      const preview = await previewSkillInstall(root, [bundle]);
      assertEquals(preview.skills[0].status, "conflict");
      await assertRejects(
        () => installSkills(root, [bundle], preview.plan),
        Error,
        "conflicts",
      );
      assert((await Deno.lstat(file)).isSymlink);
    });
  }
});

Deno.test("preview binds the root, package version, and installed state", async () => {
  await withRoot(async (root) => {
    const bundle = await fixture();
    const original = await previewSkillInstall(root, [bundle]);
    await withRoot(async (otherRoot) => {
      await assertRejects(
        () => installSkills(otherRoot, [bundle], original.plan),
        Error,
        "stale",
      );
    });
    await assertRejects(
      async () => installSkills(root, [await fixture("2.0.0")], original.plan),
      Error,
      "stale",
    );
    await installSkills(root, [bundle], original.plan);
    await assertRejects(
      () => installSkills(root, [bundle], original.plan),
      Error,
      "stale",
    );
    const changed = await fixture("1.0.0", { "SKILL.md": "Different release" });
    assertEquals(
      (await previewSkillInstall(root, [changed])).skills[0].status,
      "conflict",
    );
  });
});

Deno.test("package integrity, traversal, duplicate paths and file/directory collisions are rejected", async () => {
  await withRoot(async (root) => {
    const corrupt = await fixture();
    corrupt.files["SKILL.md"] = "Tampered";
    await assertRejects(
      () => previewSkillInstall(root, [corrupt]),
      Error,
      "integrity",
    );
    for (
      const path of [
        "../escape",
        "/tmp/escape",
        "a/../../escape",
        "a\\escape",
        ".lor-install.json",
        "a/./b",
        "a//b",
      ]
    ) {
      const bundle = await fixture("1.0.0", {
        "SKILL.md": "Skill",
        [path]: "Bad",
      });
      await assertRejects(() => previewSkillInstall(root, [bundle]));
    }
    const duplicate = await fixture();
    duplicate.manifest.files.push(duplicate.manifest.files[0]);
    await assertRejects(() => previewSkillInstall(root, [duplicate]));
    await assertRejects(async () =>
      previewSkillInstall(root, [
        await fixture("1.0.0", { "SKILL.md": "x", a: "x", "a/b": "x" }),
      ])
    );
    assertEquals(Array.from(Deno.readDirSync(root)), []);
  });
});

Deno.test("active install lock is preserved and no skill is written", async () => {
  await withRoot(async (root) => {
    const bundle = await fixture();
    const preview = await previewSkillInstall(root, [bundle]);
    await Deno.writeTextFile(
      join(root, ".lor-skills-install.lock"),
      "Other installer",
    );
    await assertRejects(
      () => installSkills(root, [bundle], preview.plan),
      Error,
      "lock",
    );
    assertEquals(Array.from(Deno.readDirSync(root)).map((e) => e.name), [
      ".lor-skills-install.lock",
    ]);
    assertEquals(
      await Deno.readTextFile(join(root, ".lor-skills-install.lock")),
      "Other installer",
    );
  });
});

Deno.test("CLI requires preview token and installs the real bundled skill", async () => {
  await withRoot(async (root) => {
    const args = ["--root", root, "--skill", "lor-manage-skill"];
    await assertRejects(
      () => runSkillCli(["install", ...args]),
      Error,
      "preview",
    );
    await assertRejects(
      () => runSkillCli(["preview", ...args, "--force", "true"]),
      Error,
      "Invalid",
    );
    const preview = await runSkillCli(["preview", ...args]) as { plan: string };
    await runSkillCli(["install", ...args, "--plan", preview.plan]);
    const bundle = await loadBundledSkill("lor-manage-skill");
    assertEquals(
      await Deno.readTextFile(join(root, "lor-manage-skill/SKILL.md")),
      bundle.files["SKILL.md"],
    );
    assertEquals(
      (await previewSkillInstall(root, [bundle])).skills[0].status,
      "unchanged",
    );
  });
});

Deno.test("a failed replacement restores the previous skill and releases the install lock", async () => {
  await withRoot(async (root) => {
    const original = await fixture();
    await installSkills(
      root,
      [original],
      (await previewSkillInstall(root, [original])).plan,
    );
    const update = await fixture("2.0.0", { "SKILL.md": "Updated" });
    const preview = await previewSkillInstall(root, [update]);
    const rename = Deno.rename;
    Deno.rename = async (from, to) => {
      if (String(from).endsWith("/next")) {
        throw new Error("Simulated replacement failure");
      }
      await rename(from, to);
    };
    try {
      await assertRejects(
        () => installSkills(root, [update], preview.plan),
        Error,
        "Simulated replacement failure",
      );
    } finally {
      Deno.rename = rename;
    }
    assertEquals(
      (await previewSkillInstall(root, [original])).skills[0].status,
      "unchanged",
    );
    assertEquals(Array.from(Deno.readDirSync(root)).map((e) => e.name), [
      "test-skill",
    ]);
  });
});

Deno.test("an edit detected after moving the old directory is restored without losing that edit", async () => {
  await withRoot(async (root) => {
    const original = await fixture();
    await installSkills(
      root,
      [original],
      (await previewSkillInstall(root, [original])).plan,
    );
    const update = await fixture("2.0.0");
    const preview = await previewSkillInstall(root, [update]);
    const rename = Deno.rename;
    Deno.rename = async (from, to) => {
      await rename(from, to);
      if (String(to).endsWith("/previous")) {
        await Deno.writeTextFile(
          join(String(to), "SKILL.md"),
          "Concurrent user edit",
        );
      }
    };
    try {
      await assertRejects(
        () => installSkills(root, [update], preview.plan),
        Error,
        "changed during installation",
      );
    } finally {
      Deno.rename = rename;
    }
    assertEquals(
      await Deno.readTextFile(join(root, "test-skill/SKILL.md")),
      "Concurrent user edit",
    );
  });
});

Deno.test("concurrent installers cannot both apply a preview", async () => {
  await withRoot(async (root) => {
    const bundle = await fixture();
    const preview = await previewSkillInstall(root, [bundle]);
    const results = await Promise.allSettled([
      installSkills(root, [bundle], preview.plan),
      installSkills(root, [bundle], preview.plan),
    ]);
    assertEquals(
      results.filter((result) => result.status === "fulfilled").length,
      1,
    );
    assertEquals(
      (await previewSkillInstall(root, [bundle])).skills[0].status,
      "unchanged",
    );
  });
});

Deno.test("one conflict prevents writing other selected packages", async () => {
  await withRoot(async (root) => {
    const one = await fixture();
    const two = await fixture();
    two.manifest.name = "other-skill";
    await Deno.mkdir(join(root, "test-skill"));
    const preview = await previewSkillInstall(root, [one, two]);
    await assertRejects(
      () => installSkills(root, [one, two], preview.plan),
      Error,
      "conflicts",
    );
    assertEquals(Array.from(Deno.readDirSync(root)).map((e) => e.name), [
      "test-skill",
    ]);
  });
});

Deno.test("manifest limits reject oversized and missing files without writes", async () => {
  await withRoot(async (root) => {
    const oversized = await fixture();
    oversized.manifest.files[0].size = 1024 * 1024 + 1;
    await assertRejects(() => previewSkillInstall(root, [oversized]));
    const missing = await fixture();
    delete missing.files["references/guide.md"];
    await assertRejects(
      () => previewSkillInstall(root, [missing]),
      Error,
      "file count",
    );
    await assertRejects(
      () => previewSkillInstall(root, []),
      Error,
      "at least one",
    );
    const duplicate = await fixture();
    await assertRejects(
      () => previewSkillInstall(root, [duplicate, duplicate]),
      Error,
      "duplicate",
    );
    assertEquals(Array.from(Deno.readDirSync(root)), []);
  });
});
