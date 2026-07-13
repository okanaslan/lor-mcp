import { AgenticRouterError } from "@src/errors.ts";

export interface AgenticRouterConfig {
  catalogNamespace: string;
  dbPath: string;
  agentRegistryPath: string;
  skillRoots: string[];
}

type Env = Record<string, string | undefined>;

export function loadConfig(env: Env = readDenoEnv()): AgenticRouterConfig {
  const catalogNamespace = requireEnv(
    env,
    "AGENTIC_ROUTER_CATALOG_NAMESPACE",
  );
  const dbPath = requireEnv(env, "AGENTIC_ROUTER_DB_PATH");
  const agentRegistryPath = requireEnv(
    env,
    "AGENTIC_ROUTER_AGENT_REGISTRY_PATH",
  );
  const skillRootsValue = requireEnv(env, "AGENTIC_ROUTER_SKILL_ROOTS");
  const delimiter = Deno.build.os === "windows" ? ";" : ":";
  const skillRoots = skillRootsValue
    .split(delimiter)
    .map((root) => root.trim())
    .filter((root) => root.length > 0);

  if (skillRoots.length === 0) {
    throw new AgenticRouterError(
      "setup_error",
      "AGENTIC_ROUTER_SKILL_ROOTS must include at least one path.",
      { field: "AGENTIC_ROUTER_SKILL_ROOTS" },
    );
  }

  return {
    catalogNamespace,
    dbPath,
    agentRegistryPath,
    skillRoots,
  };
}

function readDenoEnv(): Env {
  return {
    AGENTIC_ROUTER_CATALOG_NAMESPACE: Deno.env.get(
      "AGENTIC_ROUTER_CATALOG_NAMESPACE",
    ),
    AGENTIC_ROUTER_DB_PATH: Deno.env.get("AGENTIC_ROUTER_DB_PATH"),
    AGENTIC_ROUTER_AGENT_REGISTRY_PATH: Deno.env.get(
      "AGENTIC_ROUTER_AGENT_REGISTRY_PATH",
    ),
    AGENTIC_ROUTER_SKILL_ROOTS: Deno.env.get("AGENTIC_ROUTER_SKILL_ROOTS"),
  };
}

function requireEnv(env: Env, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new AgenticRouterError("setup_error", `${name} is required.`, {
      field: name,
    });
  }
  return value;
}
