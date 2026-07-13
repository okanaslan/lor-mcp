import type { ErrorCode } from "@src/errors.ts";

type ContentBlock = { type: "text"; text: string };

export interface ToolResult {
  structuredContent: Record<string, unknown>;
  content: ContentBlock[];
  isError?: true;
}

const UNSAFE_DETAIL_KEYS = new Set([
  "path",
  "dbPath",
  "namespace",
  "stack",
  "sql",
]);

export function textContent(text: string): ContentBlock {
  return { type: "text", text };
}

export function okResult(data: unknown, text: string): ToolResult {
  return {
    structuredContent: { status: "ok", data },
    content: [textContent(text)],
  };
}

export function statusResult(
  status: "no_match" | "conflict",
  data: unknown,
  text: string,
): ToolResult {
  return {
    structuredContent: { status, data },
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
    !UNSAFE_DETAIL_KEYS.has(key) && isSafeValue(value)
  );
  return safeEntries.length > 0 ? Object.fromEntries(safeEntries) : undefined;
}

function isSafeValue(value: unknown): boolean {
  return typeof value === "string" || typeof value === "number" ||
    typeof value === "boolean" || value === null;
}
