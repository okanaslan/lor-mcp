export type ErrorCode =
  | "validation_error"
  | "session_error"
  | "setup_error"
  | "duplicate_entry"
  | "not_found"
  | "verification_failed"
  | "storage_error"
  | "internal_error";

export class AgenticRouterError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(`${code}: ${message}`);
    this.name = "AgenticRouterError";
  }
}

export function toAgenticRouterError(error: unknown): AgenticRouterError {
  if (error instanceof AgenticRouterError) {
    return error;
  }

  if (error instanceof Error) {
    return new AgenticRouterError("internal_error", "Unexpected server error.");
  }

  return new AgenticRouterError("internal_error", "Unexpected server error.");
}
