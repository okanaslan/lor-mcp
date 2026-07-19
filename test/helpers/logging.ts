import type { LogFields, LorLogger } from "@src/logger.ts";

export interface CapturedLog {
  level: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  fields: LogFields;
  message: string;
}

export class CapturingLogger implements LorLogger {
  readonly logs: CapturedLog[] = [];

  trace(fields: LogFields, message: string): void {
    this.capture("trace", fields, message);
  }

  debug(fields: LogFields, message: string): void {
    this.capture("debug", fields, message);
  }

  info(fields: LogFields, message: string): void {
    this.capture("info", fields, message);
  }

  warn(fields: LogFields, message: string): void {
    this.capture("warn", fields, message);
  }

  error(fields: LogFields, message: string): void {
    this.capture("error", fields, message);
  }

  fatal(fields: LogFields, message: string): void {
    this.capture("fatal", fields, message);
  }

  child(bindings: LogFields): LorLogger {
    return {
      trace: (fields, message) => {
        this.trace({ ...bindings, ...fields }, message);
      },
      debug: (fields, message) => {
        this.debug({ ...bindings, ...fields }, message);
      },
      info: (fields, message) => {
        this.info({ ...bindings, ...fields }, message);
      },
      warn: (fields, message) => {
        this.warn({ ...bindings, ...fields }, message);
      },
      error: (fields, message) => {
        this.error({ ...bindings, ...fields }, message);
      },
      fatal: (fields, message) => {
        this.fatal({ ...bindings, ...fields }, message);
      },
      child: (childBindings) => this.child({ ...bindings, ...childBindings }),
    };
  }

  private capture(
    level: CapturedLog["level"],
    fields: LogFields,
    message: string,
  ): void {
    this.logs.push({ level, fields, message });
  }
}
