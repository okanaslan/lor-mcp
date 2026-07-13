import { AgenticRouterError } from "@src/errors.ts";
import { basename, dirname, join } from "@std/path";

export interface AgenticRouterConfig {
  catalogNamespace: string;
  dbPath: string;
}

export interface AgenticRouterServeConfig {
  host: string;
  port: number;
}

type Env = Record<string, string | undefined>;

export interface LoadConfigOptions {
  cwd?: string;
}

export function loadConfig(
  env: Env = readDenoEnv(),
  options: LoadConfigOptions = {},
): AgenticRouterConfig {
  const cwd = options.cwd ?? Deno.cwd();
  const dataDir = join(cwd, ".agentic-router");
  const catalogNamespace =
    optionalEnv(env, "AGENTIC_ROUTER_CATALOG_NAMESPACE") ??
      defaultCatalogNamespace(cwd);
  const dbPath = optionalEnv(env, "AGENTIC_ROUTER_DB_PATH") ??
    join(dataDir, "catalog.db");

  return {
    catalogNamespace,
    dbPath,
  };
}

export function loadServeConfig(
  env: Env = readDenoEnv(),
): AgenticRouterServeConfig {
  const host = optionalEnv(env, "AGENTIC_ROUTER_HOST") ?? "127.0.0.1";
  const portValue = optionalEnv(env, "AGENTIC_ROUTER_PORT");
  const port = portValue === undefined ? 8765 : Number(portValue);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new AgenticRouterError(
      "setup_error",
      "AGENTIC_ROUTER_PORT must be an integer between 1 and 65535.",
      { field: "AGENTIC_ROUTER_PORT" },
    );
  }

  return { host, port };
}

export async function prepareConfigStorage(
  config: AgenticRouterConfig,
): Promise<void> {
  await Deno.mkdir(dirname(config.dbPath), { recursive: true });
}

function readDenoEnv(): Env {
  return {
    AGENTIC_ROUTER_CATALOG_NAMESPACE: Deno.env.get(
      "AGENTIC_ROUTER_CATALOG_NAMESPACE",
    ),
    AGENTIC_ROUTER_DB_PATH: Deno.env.get("AGENTIC_ROUTER_DB_PATH"),
    AGENTIC_ROUTER_HOST: Deno.env.get("AGENTIC_ROUTER_HOST"),
    AGENTIC_ROUTER_PORT: Deno.env.get("AGENTIC_ROUTER_PORT"),
  };
}

function optionalEnv(env: Env, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

function defaultCatalogNamespace(cwd: string): string {
  return basename(cwd) || "default";
}
