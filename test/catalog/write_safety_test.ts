import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { createCatalogService } from "@test/helpers/catalog_fixtures.ts";

const input = {
  workspace: "test",
  scope: "workspace" as const,
  skillName: "sample",
  projectName: "test",
  displayName: "Original",
  primarySpecialty: "test",
  specialtyTags: ["test"],
};

Deno.test("stale updates and deletes cannot overwrite a concurrent change", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const original = await service.introduceSkill(input);
    assertExists(original.revision);
    await service.updateSkill({
      ...input,
      displayName: "Changed",
      expectedRevision: original.revision,
    });
    await assertRejects(
      () =>
        service.updateSkill({
          ...input,
          displayName: "Lost",
          expectedRevision: original.revision,
        }),
      Error,
      "revision_conflict",
    );
    await assertRejects(
      () =>
        service.removeSkill({ ...input, expectedRevision: original.revision }),
      Error,
      "revision_conflict",
    );
    assertEquals((await service.getSkillDetail(input))?.displayName, "Changed");
  } finally {
    repo.close();
  }
});

Deno.test("a proposal cannot apply over a newer entry revision", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceSkill(input);
    const { proposal } = await service.proposeSkillUpdate({
      ...input,
      reason: "test",
      metadata: { displayName: "Proposed" },
    });
    await service.updateSkill({ ...input, displayName: "Concurrent" });
    await assertRejects(
      () =>
        service.applySkillUpdate({
          workspace: "test",
          proposalId: proposal.proposalId,
          confirm: true,
        }),
      Error,
      "revision_conflict",
    );
    assertEquals(
      (await service.getSkillDetail(input))?.displayName,
      "Concurrent",
    );
  } finally {
    repo.close();
  }
});
