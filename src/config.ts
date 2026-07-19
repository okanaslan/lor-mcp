import { LorError } from "@src/errors.ts";
import { dirname, join } from "@std/path";

export interface LorConfig {
  dbPath: string;
}

export interface LorServeConfig {
  host: string;
  port: number;
}

export type LorLogLevel =
  | "trace"
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal"
  | "silent";

export type LorLogFormat = "pretty" | "json";

export interface LorLogConfig {
  level: LorLogLevel;
  format: LorLogFormat;
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

export function loadLogConfig(
  env: Env = readDenoEnv(),
): LorLogConfig {
  const level = optionalEnv(env, "LOR_LOG_LEVEL") ?? "info";
  const format = optionalEnv(env, "LOR_LOG_FORMAT") ?? "pretty";

  if (!isLogLevel(level)) {
    throw new LorError(
      "setup_error",
      "LOR_LOG_LEVEL must be one of trace, debug, info, warn, error, fatal, or silent.",
      { field: "LOR_LOG_LEVEL" },
    );
  }
  if (!isLogFormat(format)) {
    throw new LorError(
      "setup_error",
      "LOR_LOG_FORMAT must be either pretty or json.",
      { field: "LOR_LOG_FORMAT" },
    );
  }

  return { level, format };
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
    LOR_LOG_LEVEL: Deno.env.get("LOR_LOG_LEVEL"),
    LOR_LOG_FORMAT: Deno.env.get("LOR_LOG_FORMAT"),
  };
}

function optionalEnv(env: Env, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

function isLogLevel(value: string): value is LorLogLevel {
  return [
    "trace",
    "debug",
    "info",
    "warn",
    "error",
    "fatal",
    "silent",
  ].includes(value);
}

function isLogFormat(value: string): value is LorLogFormat {
  return value === "pretty" || value === "json";
}
