export type ErrorCode =
  | "validation_error"
  | "session_error"
  | "setup_error"
  | "duplicate_entry"
  | "not_found"
  | "verification_failed"
  | "storage_error"
  | "internal_error";

export class LorError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(`${code}: ${message}`);
    this.name = "LorError";
  }
}

export function toLorError(error: unknown): LorError {
  if (error instanceof LorError) {
    return error;
  }

  if (error instanceof Error) {
    return new LorError("internal_error", "Unexpected server error.");
  }

  return new LorError("internal_error", "Unexpected server error.");
}
