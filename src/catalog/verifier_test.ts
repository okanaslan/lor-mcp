import { assertEquals, assertRejects } from "@std/assert";
import { join } from "@std/path";
import { verifyAgentExists, verifySkillExists } from "@src/catalog/verifier.ts";

Deno.test("verifyAgentExists accepts session ids from configured registry", async () => {
  const dir = await Deno.makeTempDir();
  const registryPath = join(dir, "agents.json");
  await Deno.writeTextFile(
    registryPath,
    JSON.stringify({ agents: [{ codexSessionId: "agent-1" }] }),
  );

  const result = await verifyAgentExists(
    "agent-1",
    registryPath,
    () => "2026-07-12T00:00:00.000Z",
  );

  assertEquals(result.verificationStatus, "verified");
  assertEquals(result.verificationSource, "agent_registry_json");
});

Deno.test("verifyAgentExists rejects unknown session ids", async () => {
  const dir = await Deno.makeTempDir();
  const registryPath = join(dir, "agents.json");
  await Deno.writeTextFile(registryPath, JSON.stringify({ agents: [] }));

  await assertRejects(
    () =>
      verifyAgentExists(
        "missing-agent",
        registryPath,
        () => "2026-07-12T00:00:00.000Z",
      ),
    Error,
    "verification_failed",
  );
});

Deno.test("verifySkillExists accepts public skill folders with SKILL.md", async () => {
  const root = await Deno.makeTempDir();
  await Deno.mkdir(join(root, "backend-skill"));
  await Deno.writeTextFile(join(root, "backend-skill", "SKILL.md"), "# Skill");

  const result = await verifySkillExists(
    "backend-skill",
    [root],
    () => "2026-07-12T00:00:00.000Z",
  );

  assertEquals(result.verificationStatus, "verified");
  assertEquals(result.verificationSource, "skill_roots");
});

Deno.test("verifySkillExists rejects private skill folders", async () => {
  const root = await Deno.makeTempDir();
  await Deno.mkdir(join(root, "_template"));
  await Deno.writeTextFile(join(root, "_template", "SKILL.md"), "# Template");

  await assertRejects(
    () =>
      verifySkillExists("_template", [root], () => "2026-07-12T00:00:00.000Z"),
    Error,
    "verification_failed",
  );
});
