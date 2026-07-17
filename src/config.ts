import { LorError } from "@src/errors.ts";
import { dirname, join } from "@std/path";

export interface LorConfig {
  dbPath: string;
}

export interface LorServeConfig {
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
): LorConfig {
  const cwd = options.cwd ?? Deno.cwd();
  const dataDir = join(cwd, ".lor-mcp");
  const dbPath = optionalEnv(env, "LOR_DB_PATH") ??
    join(dataDir, "catalog.db");

  return {
    dbPath,
  };
}

export function loadServeConfig(
  env: Env = readDenoEnv(),
): LorServeConfig {
  const host = optionalEnv(env, "LOR_HOST") ?? "127.0.0.1";
  const portValue = optionalEnv(env, "LOR_PORT");
  const port = portValue === undefined ? 8765 : Number(portValue);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new LorError(
      "setup_error",
      "LOR_PORT must be an integer between 1 and 65535.",
      { field: "LOR_PORT" },
    );
  }

  return { host, port };
}

export async function prepareConfigStorage(
  config: LorConfig,
): Promise<void> {
  await Deno.mkdir(dirname(config.dbPath), { recursive: true });
}

function readDenoEnv(): Env {
  return {
    LOR_DB_PATH: Deno.env.get("LOR_DB_PATH"),
    LOR_HOST: Deno.env.get("LOR_HOST"),
    LOR_PORT: Deno.env.get("LOR_PORT"),
  };
}

function optionalEnv(env: Env, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}
