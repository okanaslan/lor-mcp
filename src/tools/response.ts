import type { ErrorCode } from "@src/errors.ts";

type ContentBlock = { type: "text"; text: string };

export interface ToolResult {
  structuredContent: Record<string, unknown>;
  content: ContentBlock[];
  isError?: true;
}

const SAFE_DETAIL_KEYS = new Set([
  "field",
  "entryType",
  "entryKey",
  "skillName",
  "scope",
  "proposalId",
  "expectedRevision",
  "currentRevision",
  "retryAfterMs",
]);

export function textContent(text: string): ContentBlock {
  return { type: "text", text };
}

export function okResult(data: unknown, text: string): ToolResult {
  return {
    structuredContent: { status: "ok", data: JSON.parse(JSON.stringify(data)) },
    content: [textContent(text)],
  };
}

export function statusResult(
  status: "no_match" | "conflict",
  data: unknown,
  text: string,
): ToolResult {
  return {
    structuredContent: { status, data: JSON.parse(JSON.stringify(data)) },
    content: [textContent(text)],
  };
}

export function errorResult(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
): ToolResult {
  const error: Record<string, unknown> = {
    code,
    message,
    recovery: recoveryFor(code),
  };
  const sanitizedDetails = sanitizeDetails(details);
  if (sanitizedDetails) {
    error.details = sanitizedDetails;
  }

  return {
    structuredContent: {
      status: "error",
      error,
    },
    content: [textContent(message)],
    isError: true,
  };
}

function sanitizeDetails(
  details?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!details) {
    return undefined;
  }

  const safeEntries = Object.entries(details).filter(([key, value]) =>
    SAFE_DETAIL_KEYS.has(key) && isSafeValue(value)
  );
  return safeEntries.length > 0 ? Object.fromEntries(safeEntries) : undefined;
}

function recoveryFor(code: ErrorCode): string {
  switch (code) {
    case "request_cancelled":
      return "Cancelled before execution. A new request may be submitted when intended.";
    case "revision_conflict":
    case "local_file_modified":
      return "Read the current target and prepare a new update or preview.";
    case "proposal_expired":
      return "Create and review a new proposal.";
    case "duplicate_entry":
      return "Read the existing entry before deciding whether to update it.";
    case "invalid_cursor":
      return "Restart listing without a cursor.";
    case "access_denied":
      return "Use an authorized workspace and operation; arguments cannot grant access.";
    case "validation_error":
      return "Correct the indicated input field before retrying.";
    case "idempotency_conflict":
      return "An operation key cannot be reused for a different payload.";
    case "not_found":
      return "Check the identifier and scope with the relevant list tool.";
    default:
      return "Inspect diagnostics and read back state before retrying an uncertain write.";
  }
}

export function correlateResult(
  result: ToolResult,
  requestId: string,
): ToolResult {
  result.structuredContent.requestId = requestId;
  result.content.push(textContent(JSON.stringify(result.structuredContent)));
  return result;
}

function isSafeValue(value: unknown): boolean {
  return typeof value === "string" || typeof value === "number" ||
    typeof value === "boolean" || value === null;
}
