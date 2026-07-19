import pino, { type DestinationStream } from "pino";
import pinoPretty from "pino-pretty";
import type { LorLogConfig } from "@src/config.ts";

export type LogFields = Record<string, unknown>;

export interface LorLogger {
  trace(fields: LogFields, message: string): void;
  debug(fields: LogFields, message: string): void;
  info(fields: LogFields, message: string): void;
  warn(fields: LogFields, message: string): void;
  error(fields: LogFields, message: string): void;
  fatal(fields: LogFields, message: string): void;
  child(bindings: LogFields): LorLogger;
}

const REDACT_PATHS = [
  "dbPath",
  "path",
  "sql",
  "stack",
  "requestBody",
  "responseBody",
  "prompt",
  "catalog",
  "err.stack",
  "error.stack",
  "details.dbPath",
  "details.path",
  "details.sql",
  "details.stack",
  "data.prompt",
  "data.catalog",
  "arguments.prompt",
  "arguments.catalog",
];

const noopLogger: LorLogger = {
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  child: () => noopLogger,
};

export interface CreateLoggerOptions {
  destination?: DestinationStream;
}

export function createLogger(
  config: LorLogConfig,
  options: CreateLoggerOptions = {},
): LorLogger {
  const loggerOptions = {
    name: "lor-mcp",
    level: config.level,
    base: undefined,
    redact: {
      paths: REDACT_PATHS,
      censor: "[redacted]",
    },
  };

  if (options.destination) {
    return pino(loggerOptions, options.destination);
  }

  if (config.format === "pretty") {
    return pino(
      loggerOptions,
      pinoPretty({
        colorize: true,
        destination: 2,
        ignore: "pid,hostname",
        translateTime: "HH:MM:ss.l",
      }),
    );
  }

  return pino(loggerOptions, pino.destination(2));
}

export function createNoopLogger(): LorLogger {
  return noopLogger;
}
