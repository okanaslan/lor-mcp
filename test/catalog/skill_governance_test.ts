import { assert, assertEquals, assertRejects } from "@std/assert";
import {
  createCatalogService,
  FIXED_NOW,
} from "@test/helpers/catalog_fixtures.ts";
import {
  contentFingerprint,
  freshness,
  governanceSchema,
} from "@src/catalog/skill_governance.ts";
import type { SkillCatalogEntry } from "@src/catalog/types.ts";

export const skillInput = (skillName: string) => ({
  workspace: "governance-test",
  scope: "global" as const,
  skillName,
  displayName: skillName,
  projectName: "test",
  primarySpecialty: "review",
  specialtyTags: ["review"],
  skillContext: { whenToUse: "Review code" },
});
Deno.test("governance persists through proposals and registration is not content review", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill(skillInput("review"));
    const before = await service.getSkillDetail(skillInput("review"));
    assert(before);
    assertEquals(before.freshness, "unreviewed");
    const proposal = await service.proposeSkillUpdate({
      ...skillInput("review"),
      reason: "Define ownership",
      governance: {
        responsibility: {
          summary: "Review changes",
          owns: ["defect findings"],
          excludes: ["commits"],
          relationships: [],
        },
      },
    });
    await service.applySkillUpdate({
      workspace: "governance-test",
      scope: "global",
      proposalId: proposal.proposal.proposalId,
      confirm: true,
    });
    const after = await service.getSkillDetail(skillInput("review"));
    assertEquals(after?.governance?.responsibility?.owns, ["defect findings"]);
    assert(after?.revision !== before.revision);
    await assertRejects(() =>
      service.applySkillUpdate({
        workspace: "governance-test",
        scope: "global",
        proposalId: proposal.proposal.proposalId,
        confirm: true,
      })
    );
  } finally {
    repo.close();
  }
});
Deno.test("freshness is bound to substantive content and an injected clock", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const entry = await service.introduceSkill(
      skillInput("fresh"),
    ) as SkillCatalogEntry;
    const reviewed = {
      ...entry,
      governance: {
        review: {
          contentFingerprint: contentFingerprint(entry),
          reviewedAt: FIXED_NOW,
          method: "manual",
          evidence: "checked source",
          outcome: "passed" as const,
          intervalDays: 1,
        },
      },
    };
    assertEquals(freshness(reviewed, FIXED_NOW), "current");
    assertEquals(
      freshness({ ...reviewed, displayName: "Renamed" }, FIXED_NOW),
      "current",
    );
    assertEquals(
      freshness(
        { ...reviewed, skillContext: { whenToUse: "Different" } },
        FIXED_NOW,
      ),
      "changed-since-review",
    );
    assertEquals(freshness(reviewed, "2026-07-13T00:00:00.000Z"), "review-due");
    assertEquals(
      freshness({
        ...reviewed,
        governance: {
          review: { ...reviewed.governance.review, outcome: "needs-attention" },
        },
      }, FIXED_NOW),
      "needs-attention",
    );
    assertEquals(
      governanceSchema.safeParse({
        provenance: {
          kind: "manual",
          capturedAt: "not-a-date",
          assurance: "claimed",
        },
      }).success,
      false,
    );
  } finally {
    repo.close();
  }
});

Deno.test("relationships validate scope, cycles, deletion and dependency revisions", async () => {
  const { repo, service } = await createCatalogService();
  const relationship = (name: string) => ({
    responsibility: {
      summary: "Specialist",
      owns: ["review"],
      excludes: [],
      relationships: [{
        kind: "specializes" as const,
        target: { scope: "global" as const, skillName: name },
        reason: "narrower workflow",
      }],
    },
  });
  try {
    await service.introduceSkill(skillInput("base"));
    await service.introduceSkill({
      ...skillInput("specialist"),
      governance: relationship("base"),
    });
    await assertRejects(() =>
      service.proposeSkillUpdate({
        ...skillInput("base"),
        reason: "cycle",
        governance: relationship("specialist"),
      })
    );
    await assertRejects(() =>
      service.introduceSkill({
        ...skillInput("missing"),
        governance: relationship("absent"),
      })
    );
    assertEquals(
      await service.getSkillDetail(skillInput("missing")),
      undefined,
    );
    const base = await service.getSkillDetail(skillInput("base"));
    assert(base);
    await assertRejects(() =>
      service.removeSkill({
        ...skillInput("base"),
        expectedRevision: base.revision,
      })
    );
    const pending = await service.proposeSkillUpdate({
      ...skillInput("specialist"),
      reason: "preview",
      metadata: { displayName: "Updated" },
    });
    await service.updateSkill({
      ...skillInput("base"),
      expectedRevision: base.revision,
      displayName: "Base changed",
    });
    await assertRejects(() =>
      service.applySkillUpdate({
        workspace: "governance-test",
        scope: "global",
        proposalId: pending.proposal.proposalId,
        confirm: true,
      })
    );
    await assertRejects(() =>
      service.introduceSkill({
        ...skillInput("cross-scope"),
        governance: {
          responsibility: {
            summary: "No cross scope",
            owns: [],
            excludes: [],
            relationships: [{
              kind: "complements",
              target: {
                scope: "workspace",
                workspace: "other",
                skillName: "base",
              },
              reason: "invalid",
            }],
          },
        },
      })
    );
  } finally {
    repo.close();
  }
});

Deno.test("review recording uses server time and rejects unrelated fingerprints", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill(skillInput("reviewed"));
    const skill = await service.getSkillDetail(skillInput("reviewed"));
    assert(skill?.contentFingerprint);
    const review = {
      contentFingerprint: skill.contentFingerprint,
      reviewedAt: "2099-01-01T00:00:00.000Z",
      method: "source review",
      evidence: "Inspected current source and tests",
      outcome: "passed" as const,
    };
    const proposal = await service.proposeSkillUpdate({
      ...skillInput("reviewed"),
      reason: "Record evidence",
      governance: { review },
    });
    assertEquals(proposal.after.governance?.review?.reviewedAt, FIXED_NOW);
    await service.applySkillUpdate({
      workspace: "governance-test",
      scope: "global",
      proposalId: proposal.proposal.proposalId,
      confirm: true,
    });
    assertEquals(
      (await service.getSkillDetail(skillInput("reviewed")))?.freshness,
      "current",
    );
    await assertRejects(() =>
      service.proposeSkillUpdate({
        ...skillInput("reviewed"),
        reason: "Invalid review",
        governance: {
          review: { ...review, contentFingerprint: "0".repeat(64) },
        },
      })
    );
    const claimed = await service.introduceSkill({
      ...skillInput("claimed"),
      governance: {
        provenance: {
          kind: "repository",
          locator: "https://example.com/source",
          assurance: "captured",
          capturedAt: "2099-01-01T00:00:00.000Z",
        },
      },
    }) as SkillCatalogEntry;
    assertEquals(claimed.governance?.provenance?.assurance, "claimed");
    assertEquals(claimed.governance?.provenance?.capturedAt, FIXED_NOW);
  } finally {
    repo.close();
  }
});

Deno.test("deprecation preserves exact identity and follows replacements only explicitly", async () => {
  const { repo, service } = await createCatalogService();
  const deprecate = async (name: string, replacement?: string) => {
    const p = await service.proposeSkillUpdate({
      ...skillInput(name),
      reason: "Consolidation",
      governance: {
        lifecycle: {
          status: "deprecated",
          reason: "Use canonical workflow",
          deprecatedAt: "2099-01-01T00:00:00.000Z",
          replacement: replacement
            ? { scope: "global", skillName: replacement }
            : undefined,
        },
      },
    });
    await service.applySkillUpdate({
      workspace: "governance-test",
      scope: "global",
      proposalId: p.proposal.proposalId,
      confirm: true,
    });
  };
  try {
    for (const name of ["old", "next", "canonical"]) {
      await service.introduceSkill(skillInput(name));
    }
    await deprecate("old", "next");
    await deprecate("next", "canonical");
    const exact = await service.getSkillDetail(skillInput("old"));
    assertEquals(exact?.skillName, "old");
    assertEquals(exact?.governance?.lifecycle?.status, "deprecated");
    assertEquals(
      exact?.governance?.lifecycle?.status === "deprecated" &&
        exact.governance.lifecycle.deprecatedAt,
      FIXED_NOW,
    );
    const resolved = await service.getSkillDetail({
      ...skillInput("old"),
      followReplacement: true,
    });
    assertEquals(resolved?.skillName, "canonical");
    assertEquals(resolved?.resolution?.chain.map((r) => r.skillName), [
      "old",
      "next",
      "canonical",
    ]);
    const matches = await service.findMatchingSkills({
      workspace: "governance-test",
      task: "review",
    });
    assert(
      !matches.data.skills.some((e) => ["old", "next"].includes(e.entryKey)),
    );
    const page = await service.listCatalogPage({
      workspace: "governance-test",
      entryType: "skill",
      lifecycle: "deprecated",
    }, { limit: 1 });
    assertEquals(page.total, 2);
    assert(page.nextCursor);
    const next = await service.listCatalogPage({
      workspace: "governance-test",
      entryType: "skill",
      lifecycle: "deprecated",
    }, { limit: 1, cursor: page.nextCursor });
    assertEquals(next.items.length, 1);
    await assertRejects(() => deprecate("canonical", "old"));
    const target = await service.getSkillDetail(skillInput("canonical"));
    assert(target);
    await assertRejects(() =>
      service.removeSkill({
        ...skillInput("canonical"),
        expectedRevision: target.revision,
      })
    );
  } finally {
    repo.close();
  }
});

Deno.test("v2 import resolves out-of-order and reciprocal relationships atomically", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const base = { ...skillInput("a"), scope: "workspace" as const };
    await service.introduceSkill(base);
    await service.introduceSkill({
      ...base,
      skillName: "b",
      governance: {
        responsibility: {
          summary: "B",
          owns: [],
          excludes: [],
          relationships: [{
            kind: "complements",
            reason: "together",
            target: {
              scope: "workspace",
              workspace: base.workspace,
              skillName: "a",
            },
          }],
        },
      },
    });
    const p = await service.proposeSkillUpdate({
      ...base,
      reason: "reciprocal",
      governance: {
        responsibility: {
          summary: "A",
          owns: [],
          excludes: [],
          relationships: [{
            kind: "complements",
            reason: "together",
            target: {
              scope: "workspace",
              workspace: base.workspace,
              skillName: "b",
            },
          }],
        },
      },
    });
    await service.applySkillUpdate({
      workspace: base.workspace,
      scope: "workspace",
      proposalId: p.proposal.proposalId,
      confirm: true,
    });
    const exported = await service.exportCatalog({ workspace: base.workspace });
    assertEquals(exported.version, 2);
    exported.entries.reverse();
    const result = await service.importCatalog({
      workspace: "destination",
      catalog: exported,
    });
    assertEquals(result.importedCount, 2);
    const restored = await service.getSkillDetail({
      workspace: "destination",
      scope: "workspace",
      skillName: "b",
    });
    assertEquals(
      restored?.governance?.responsibility?.relationships[0].target,
      { scope: "workspace", workspace: "destination", skillName: "a" },
    );
    assertEquals(restored?.governance?.provenance?.kind, "catalog-import");
    const invalid = structuredClone(exported);
    const first = invalid.entries.find((e) => e.entryType === "skill");
    assert(first?.entryType === "skill" && first.governance?.responsibility);
    first.governance.responsibility.relationships[0].target = {
      scope: "global",
      skillName: "missing",
    };
    await assertRejects(() =>
      service.importCatalog({ workspace: "failed-import", catalog: invalid })
    );
    assertEquals(
      (await service.listEntries({
        workspace: "failed-import",
        scope: "workspace",
      })).length,
      0,
    );
    await assertRejects(() =>
      service.promoteSkillToGlobal({
        workspace: base.workspace,
        skillName: "a",
      })
    );
    assertEquals(
      await service.getSkillDetail({
        workspace: base.workspace,
        scope: "global",
        skillName: "a",
      }),
      undefined,
    );
    await service.introduceSubagent({
      workspace: "destination",
      scope: "workspace",
      name: "consumer",
      projectName: "test",
      displayName: "consumer",
      purpose: "review",
      limitedScope: "review",
      primarySpecialty: "review",
      specialtyTags: ["review"],
      skillReferences: [{ entryType: "skill", name: "a", scope: "workspace" }],
    });
    await assertRejects(() =>
      service.clearWorkspaceSkills({ workspace: "destination", confirm: true })
    );
    const cleared = await service.clearWorkspaceCatalog({
      workspace: "destination",
      confirm: true,
    });
    assertEquals(cleared.deletedSkills, 2);
  } finally {
    repo.close();
  }
});

Deno.test("legacy v1 imports stay active and unreviewed", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const catalog = {
      version: 1 as const,
      exportedAt: FIXED_NOW,
      workspace: "legacy",
      filters: {},
      entries: [{
        entryType: "skill" as const,
        ...skillInput("legacy"),
        verificationStatus: "verified" as const,
        verificationSource: "mcp_introduction",
        verifiedAt: FIXED_NOW,
      }],
    };
    await service.importCatalog({ workspace: "legacy", catalog });
    const skill = await service.getSkillDetail({
      workspace: "legacy",
      scope: "workspace",
      skillName: "legacy",
    });
    assertEquals(skill?.freshness, "unreviewed");
    assertEquals(skill?.governance?.lifecycle, undefined);
  } finally {
    repo.close();
  }
});
