import { assertEquals, assertRejects } from "@std/assert";
import { createCatalogService } from "@test/helpers/catalog_fixtures.ts";

Deno.test("CatalogService introduces agents without registry pre-registration", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const created = await service.introduceAgent({
      workspace: "Agentic-Router",
      codexSessionId: "agent-1",
      projectName: "Agentic Router",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
      handoff: {
        whenToUse: "Backend API changes",
        handoffPromptTemplate: "Handle {task}",
        requiredContext: ["task"],
        expectedOutput: "Patch summary",
        constraints: ["Stay scoped"],
      },
    });

    const detail = await service.getEntryDetail({
      workspace: "Agentic-Router",
      entryType: "agent",
      entryKey: "agent-1",
    });

    assertEquals(created.verificationStatus, "verified");
    assertEquals(created.verificationSource, "mcp_introduction");
    if (detail?.entryType !== "agent") {
      throw new Error("Expected agent detail.");
    }
    assertEquals(detail.handoff?.whenToUse, "Backend API changes");
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService introduces skills without skill root pre-registration", async () => {
  const { repo, service } = await createCatalogService();
  try {
    const created = await service.introduceSkill({
      workspace: "Agentic-Router",
      skillName: "missing-skill",
      projectName: "Agentic Router",
      displayName: "Missing Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const entries = await service.listEntries({ workspace: "Agentic-Router" });
    assertEquals(created.verificationStatus, "verified");
    assertEquals(created.verificationSource, "mcp_introduction");
    assertEquals(entries.map((entry) => entry.entryKey), ["missing-skill"]);
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService requires confirmation before clearing workspace catalog", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await assertRejects(
      () =>
        service.clearWorkspaceCatalog({
          workspace: "Agentic-Router",
          confirm: false as true,
        }),
      Error,
      "confirm must be true",
    );
  } finally {
    repo.close();
  }
});

Deno.test("CatalogService clears entries from list detail and match results", async () => {
  const { repo, service } = await createCatalogService();
  try {
    await service.introduceAgent({
      workspace: "Agentic-Router",
      codexSessionId: "agent-1",
      projectName: "Agentic Router",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });
    await service.introduceSkill({
      workspace: "Agentic-Router",
      skillName: "backend-skill",
      projectName: "Agentic Router",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    });

    const result = await service.clearWorkspaceCatalog({
      workspace: "Agentic-Router",
      confirm: true,
    });
    const entries = await service.listEntries({ workspace: "Agentic-Router" });
    const detail = await service.getEntryDetail({
      workspace: "Agentic-Router",
      entryType: "agent",
      entryKey: "agent-1",
    });
    const match = await service.findMatchingEntries({
      workspace: "Agentic-Router",
      task: "backend api change",
    });

    assertEquals(result, {
      workspace: "Agentic-Router",
      entryType: undefined,
      deletedAgents: 1,
      deletedSkills: 1,
      deletedTotal: 2,
    });
    assertEquals(entries, []);
    assertEquals(detail, undefined);
    assertEquals(match.status, "no_match");
  } finally {
    repo.close();
  }
});
