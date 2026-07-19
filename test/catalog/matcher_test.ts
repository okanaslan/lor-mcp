import { assertEquals } from "@std/assert";
import { findCatalogMatches } from "@src/catalog/matcher.ts";
import type { CatalogEntry } from "@src/catalog/types.ts";

const baseEntry = {
  workspace: "LOR-MCP",
  projectName: "Local Orchestration Router (LOR)",
  specialtyTags: ["routing", "mcp"],
  verificationStatus: "verified",
  verificationSource: "test",
  verifiedAt: "2026-07-12T00:00:00.000Z",
  createdAt: "2026-07-12T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
} as const;

Deno.test("findCatalogMatches returns separate ranked agent and skill lists", () => {
  const entries: CatalogEntry[] = [
    {
      ...baseEntry,
      entryType: "agent",
      entryKey: "agent-1",
      codexSessionId: "agent-1",
      displayName: "Backend Agent",
      primarySpecialty: "backend api",
    },
    {
      ...baseEntry,
      entryType: "skill",
      entryKey: "skill-1",
      skillName: "api-skill",
      displayName: "API Skill",
      primarySpecialty: "backend api",
    },
  ];

  const result = findCatalogMatches(entries, {
    workspace: "LOR-MCP",
    task: "Implement a backend API route",
  });

  assertEquals(result.status, "ok");
  assertEquals(result.data.agents[0]?.entryKey, "agent-1");
  assertEquals(result.data.skills[0]?.entryKey, "skill-1");
  assertEquals(result.data.agents[0]?.explanation.confidence, "high");
  assertEquals(
    result.data.agents[0]?.explanation.summary,
    "Backend Agent (agent) matched primary specialty using backend, api, route.",
  );
  assertEquals(result.data.agents[0]?.explanation.matchedFields, [
    "primarySpecialty",
    "displayName",
    "projectName",
  ]);
  assertEquals(result.data.agents[0]?.explanation.matchedSignals, [
    "backend",
    "api",
    "route",
  ]);
});

Deno.test("findCatalogMatches filters by project and returns no_match", () => {
  const result = findCatalogMatches([
    {
      ...baseEntry,
      entryType: "skill",
      entryKey: "skill-1",
      skillName: "api-skill",
      displayName: "API Skill",
      primarySpecialty: "backend api",
    },
  ], {
    workspace: "LOR-MCP",
    task: "Implement a backend API route",
    projectName: "Other Project",
  });

  assertEquals(result.status, "no_match");
  assertEquals(result.data.agents, []);
  assertEquals(result.data.skills, []);
});

Deno.test("findCatalogMatches omits explanations when no candidates match", () => {
  const result = findCatalogMatches([
    {
      ...baseEntry,
      entryType: "skill",
      entryKey: "skill-1",
      skillName: "api-skill",
      displayName: "API Skill",
      primarySpecialty: "backend api",
    },
  ], {
    workspace: "LOR-MCP",
    task: "write marketing copy",
  });

  assertEquals(result.status, "no_match");
  assertEquals(result.data.agents, []);
  assertEquals(result.data.skills, []);
});

Deno.test("findCatalogMatches can match a skill from whenToUse context", () => {
  const result = findCatalogMatches([
    {
      ...baseEntry,
      projectName: "Workspace Tools",
      entryType: "skill",
      entryKey: "skill-1",
      skillName: "snapshot-helper",
      displayName: "General Skill",
      primarySpecialty: "documentation upkeep",
      specialtyTags: ["catalog"],
      skillContext: {
        whenToUse: "Use for flaky snapshot rendering tests.",
        usageNotes: "Keep changes focused.",
        constraints: ["Do not rewrite unrelated tests."],
        examplePrompts: ["Review a failing UI test."],
      },
    },
  ], {
    workspace: "LOR-MCP",
    task: "debug flaky snapshot rendering failure",
  });

  const skill = result.data.skills[0];

  assertEquals(result.status, "ok");
  assertEquals(skill?.entryKey, "skill-1");
  assertEquals(skill?.skillContext, {
    whenToUse: "Use for flaky snapshot rendering tests.",
    usageNotes: "Keep changes focused.",
    constraints: ["Do not rewrite unrelated tests."],
    examplePrompts: ["Review a failing UI test."],
  });
  assertEquals(skill?.matchedFields, ["skillContext.whenToUse"]);
  assertEquals(skill?.matchedSignals, ["flaky", "snapshot", "rendering"]);
  assertEquals(
    skill?.explanation.summary,
    "General Skill (skill) matched skill context usage guidance using flaky, snapshot, rendering.",
  );
});

Deno.test("findCatalogMatches ranks whenToUse above usageNotes", () => {
  const result = findCatalogMatches([
    {
      ...baseEntry,
      projectName: "Workspace Tools",
      entryType: "skill",
      entryKey: "usage-notes-skill",
      skillName: "usage-notes-skill",
      displayName: "General Skill B",
      primarySpecialty: "documentation upkeep",
      specialtyTags: ["catalog"],
      skillContext: {
        usageNotes: "Optimize image upload pipeline.",
      },
    },
    {
      ...baseEntry,
      projectName: "Workspace Tools",
      entryType: "skill",
      entryKey: "when-to-use-skill",
      skillName: "when-to-use-skill",
      displayName: "General Skill A",
      primarySpecialty: "documentation upkeep",
      specialtyTags: ["catalog"],
      skillContext: {
        whenToUse: "Optimize image upload pipeline.",
      },
    },
  ], {
    workspace: "LOR-MCP",
    task: "optimize image upload pipeline",
  });

  assertEquals(result.status, "ok");
  assertEquals(result.data.skills.map((skill) => skill.entryKey), [
    "when-to-use-skill",
    "usage-notes-skill",
  ]);
  assertEquals(result.data.skills[0]?.matchedFields, [
    "skillContext.whenToUse",
  ]);
  assertEquals(result.data.skills[1]?.matchedFields, [
    "skillContext.usageNotes",
  ]);
});

Deno.test("findCatalogMatches ranks examplePrompts between whenToUse and usageNotes", () => {
  const result = findCatalogMatches([
    {
      ...baseEntry,
      projectName: "Workspace Tools",
      entryType: "skill",
      entryKey: "usage-notes-skill",
      skillName: "usage-notes-skill",
      displayName: "General Skill C",
      primarySpecialty: "documentation upkeep",
      specialtyTags: ["catalog"],
      skillContext: {
        usageNotes: "Review mobile onboarding analytics.",
      },
    },
    {
      ...baseEntry,
      projectName: "Workspace Tools",
      entryType: "skill",
      entryKey: "example-prompts-skill",
      skillName: "example-prompts-skill",
      displayName: "General Skill B",
      primarySpecialty: "documentation upkeep",
      specialtyTags: ["catalog"],
      skillContext: {
        examplePrompts: ["Review mobile onboarding analytics."],
      },
    },
    {
      ...baseEntry,
      projectName: "Workspace Tools",
      entryType: "skill",
      entryKey: "when-to-use-skill",
      skillName: "when-to-use-skill",
      displayName: "General Skill A",
      primarySpecialty: "documentation upkeep",
      specialtyTags: ["catalog"],
      skillContext: {
        whenToUse: "Review mobile onboarding analytics.",
      },
    },
  ], {
    workspace: "LOR-MCP",
    task: "review mobile onboarding analytics",
  });

  assertEquals(result.status, "ok");
  assertEquals(result.data.skills.map((skill) => skill.entryKey), [
    "when-to-use-skill",
    "example-prompts-skill",
    "usage-notes-skill",
  ]);
  assertEquals(result.data.skills[1]?.matchedFields, [
    "skillContext.examplePrompts",
  ]);
});

Deno.test("findCatalogMatches does not match skill constraints", () => {
  const result = findCatalogMatches([
    {
      ...baseEntry,
      projectName: "Workspace Tools",
      entryType: "skill",
      entryKey: "skill-1",
      skillName: "constraints-only-skill",
      displayName: "General Skill",
      primarySpecialty: "documentation upkeep",
      specialtyTags: ["catalog"],
      skillContext: {
        constraints: ["Use for snapshot rendering only after approval."],
      },
    },
  ], {
    workspace: "LOR-MCP",
    task: "snapshot rendering approval",
  });

  assertEquals(result.status, "no_match");
  assertEquals(result.data.skills, []);
});
