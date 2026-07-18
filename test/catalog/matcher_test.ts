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
