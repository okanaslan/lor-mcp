import { assertEquals } from "@std/assert";
import { findCatalogMatches } from "@src/catalog/matcher.ts";
import type { CatalogEntry } from "@src/catalog/types.ts";

const baseEntry = {
  workspace: "LOR-MCP",
  scope: "workspace",
  projectName: "Local Orchestration Router (LOR)",
  specialtyTags: ["routing", "mcp"],
  reachability: {
    reachabilityStatus: "unknown",
    dispatchMode: "manual",
  },
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
      agentStatus: "active",
      reachability: {
        reachabilityStatus: "unreachable",
        dispatchMode: "codex_thread",
        lastReachabilityCheckAt: "2026-07-12T00:01:00.000Z",
        lastReachabilityError: "Thread not found.",
      },
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
  assertEquals(result.data.agents[0]?.reachability, {
    reachabilityStatus: "unreachable",
    dispatchMode: "codex_thread",
  });
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
  assertEquals(result.data.subagents, []);
});

Deno.test("findCatalogMatches returns ranked subagents capped at three", () => {
  const entries: CatalogEntry[] = [
    {
      ...baseEntry,
      entryType: "subagent",
      entryKey: "api-test-subagent",
      name: "api-test-subagent",
      displayName: "API Test Subagent",
      purpose: "Write focused backend API tests.",
      limitedScope: "Only inspect API handlers and related tests.",
      primarySpecialty: "backend api testing",
      specialtyTags: ["backend", "api", "tests"],
      agentReferences: [],
      skillReferences: [],
      unresolvedReferences: [],
      constraints: [],
      expectedOutput: "A concise test summary.",
      prompt: "Use this prompt for API tests.",
    },
    ...["alpha", "beta", "gamma", "delta"].map((name) => ({
      ...baseEntry,
      scope: "global" as const,
      entryType: "subagent" as const,
      entryKey: `${name}-review-subagent`,
      name: `${name}-review-subagent`,
      displayName: `${name} Review Subagent`,
      purpose: "Review backend api tests.",
      limitedScope: "Only review focused test changes.",
      primarySpecialty: "backend api review",
      specialtyTags: ["backend", "api", "review"],
      agentReferences: [],
      skillReferences: [],
      unresolvedReferences: [],
      constraints: [],
      expectedOutput: "Review notes.",
      prompt: "Use this prompt for review.",
    })),
  ];

  const result = findCatalogMatches(entries, {
    workspace: "LOR-MCP",
    task: "write backend api tests",
  });

  assertEquals(result.status, "ok");
  assertEquals(result.data.agentsAmbiguous, false);
  assertEquals(result.data.conflict, undefined);
  assertEquals(result.data.subagents.length, 3);
  assertEquals(result.data.subagents[0]?.entryKey, "api-test-subagent");
  assertEquals(
    result.data.subagents[0]?.purpose,
    "Write focused backend API tests.",
  );
  assertEquals(
    result.data.subagents[0]?.prompt,
    "Use this prompt for API tests.",
  );
  assertEquals(result.data.subagents[0]?.matchedFields, [
    "primarySpecialty",
    "specialtyTags",
    "purpose",
    "limitedScope",
    "displayName",
  ]);
});

Deno.test("findCatalogMatches returns conflict for near-equal top agents", () => {
  const result = findCatalogMatches([
    {
      ...baseEntry,
      entryType: "agent",
      entryKey: "implementation-agent",
      codexSessionId: "implementation-agent",
      agentStatus: "active",
      displayName: "Implementation Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    },
    {
      ...baseEntry,
      entryType: "agent",
      entryKey: "platform-agent",
      codexSessionId: "platform-agent",
      agentStatus: "active",
      displayName: "Platform Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["platform"],
    },
    {
      ...baseEntry,
      entryType: "skill",
      entryKey: "backend-skill",
      skillName: "backend-skill",
      displayName: "Backend Skill",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    },
  ], {
    workspace: "LOR-MCP",
    task: "implement backend api platform",
  });

  assertEquals(result.status, "conflict");
  assertEquals(result.data.agentsAmbiguous, true);
  assertEquals(
    result.data.conflict?.candidates.map((candidate) => candidate.entryKey),
    ["platform-agent", "implementation-agent"],
  );
  assertEquals(
    result.data.conflict?.differentiatingFields,
    ["specialtyTags", "displayName"],
  );
  assertEquals(
    result.data.conflict?.differentiatingSignals,
    ["platform", "implement"],
  );
  assertEquals(
    result.data.conflict?.suggestedClarificationQuestion,
    "Which agent should handle this task: Platform Agent or Implementation Agent?",
  );
  assertEquals(
    result.data.conflict?.recommendedNextAction,
    "Ask the user to choose an agent or rerun matching with a more specific projectName or specialtyHints value before preparing a handoff.",
  );
  assertEquals(result.data.skills.map((skill) => skill.entryKey), [
    "backend-skill",
  ]);
  assertEquals(
    result.data.conflict?.candidates[0]?.explanation.summary,
    "Platform Agent (agent) matched primary specialty using backend, api, platform.",
  );
});

Deno.test("findCatalogMatches auto-selects an exact project-name match", () => {
  const result = findCatalogMatches([
    {
      ...baseEntry,
      projectName: "Billing Platform",
      entryType: "agent",
      entryKey: "billing-platform-agent",
      codexSessionId: "billing-platform-agent",
      agentStatus: "active",
      displayName: "Service Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    },
    {
      ...baseEntry,
      projectName: "Billing Tools",
      entryType: "agent",
      entryKey: "billing-tools-agent",
      codexSessionId: "billing-tools-agent",
      agentStatus: "active",
      displayName: "Support Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["api"],
    },
  ], {
    workspace: "LOR-MCP",
    task: "implement backend api for billing platform",
  });

  assertEquals(result.status, "ok");
  assertEquals(result.data.agentsAmbiguous, false);
  assertEquals(result.data.conflict, undefined);
  assertEquals(result.data.agents.map((agent) => agent.entryKey), [
    "billing-platform-agent",
    "billing-tools-agent",
  ]);
});

Deno.test("findCatalogMatches auto-selects stronger primary specialty", () => {
  const result = findCatalogMatches([
    {
      ...baseEntry,
      projectName: "Local Orchestration Router (LOR)",
      entryType: "agent",
      entryKey: "backend-specialist",
      codexSessionId: "backend-specialist",
      agentStatus: "active",
      displayName: "Service Agent",
      primarySpecialty: "backend api",
      specialtyTags: ["service"],
    },
    {
      ...baseEntry,
      projectName: "API Tools",
      entryType: "agent",
      entryKey: "tag-match-agent",
      codexSessionId: "tag-match-agent",
      agentStatus: "active",
      displayName: "Support Agent",
      primarySpecialty: "general support",
      specialtyTags: ["backend", "api"],
    },
  ], {
    workspace: "LOR-MCP",
    task: "backend api",
  });

  assertEquals(result.status, "ok");
  assertEquals(result.data.agentsAmbiguous, false);
  assertEquals(result.data.conflict, undefined);
  assertEquals(result.data.agents.map((agent) => agent.entryKey), [
    "backend-specialist",
    "tag-match-agent",
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
  assertEquals(result.data.subagents, []);
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
