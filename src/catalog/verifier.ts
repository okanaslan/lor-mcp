import { join } from "@std/path";
import type { VerificationMetadata } from "@src/catalog/types.ts";
import { AgenticRouterError } from "@src/errors.ts";

type Clock = () => string;

interface AgentRegistry {
  agents?: Array<{ codexSessionId?: unknown }>;
}

export async function verifyAgentExists(
  codexSessionId: string,
  registryPath: string,
  now: Clock,
): Promise<VerificationMetadata> {
  if (!registryPath.trim()) {
    throw new AgenticRouterError(
      "setup_error",
      "Agent registry configuration is required.",
      { field: "AGENTIC_ROUTER_AGENT_REGISTRY_PATH" },
    );
  }

  let registry: AgentRegistry;
  try {
    registry = JSON.parse(await Deno.readTextFile(registryPath));
  } catch {
    throw new AgenticRouterError(
      "setup_error",
      "Agent registry could not be read or parsed.",
      { field: "AGENTIC_ROUTER_AGENT_REGISTRY_PATH" },
    );
  }

  const exists = Array.isArray(registry.agents) &&
    registry.agents.some((agent) => agent.codexSessionId === codexSessionId);

  if (!exists) {
    throw new AgenticRouterError(
      "verification_failed",
      "Codex session ID was not found in the configured agent registry.",
      { entryType: "agent" },
    );
  }

  return {
    verificationStatus: "verified",
    verificationSource: "agent_registry_json",
    verifiedAt: now(),
  };
}

export async function verifySkillExists(
  skillName: string,
  skillRoots: string[],
  now: Clock,
): Promise<VerificationMetadata> {
  if (skillRoots.length === 0) {
    throw new AgenticRouterError(
      "setup_error",
      "At least one skill root must be configured.",
      { field: "AGENTIC_ROUTER_SKILL_ROOTS" },
    );
  }

  if (skillName.startsWith("_")) {
    throw new AgenticRouterError(
      "verification_failed",
      "Private or template skills cannot be introduced.",
      { entryType: "skill" },
    );
  }

  for (const root of skillRoots) {
    try {
      const info = await Deno.stat(join(root, skillName, "SKILL.md"));
      if (info.isFile) {
        return {
          verificationStatus: "verified",
          verificationSource: "skill_roots",
          verifiedAt: now(),
        };
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw new AgenticRouterError(
          "setup_error",
          "Configured skill roots could not be read.",
          { field: "AGENTIC_ROUTER_SKILL_ROOTS" },
        );
      }
    }
  }

  throw new AgenticRouterError(
    "verification_failed",
    "Skill was not found in the configured skill roots.",
    { entryType: "skill" },
  );
}
