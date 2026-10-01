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
