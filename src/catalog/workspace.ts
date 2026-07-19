import { LorError } from "@src/errors.ts";

export function requireWorkspace(value: string, field = "workspace"): string {
  const normalized = normalizeWorkspace(value);
  if (!normalized) {
    throw new LorError("validation_error", `${field} is required.`, {
      field,
    });
  }
  return normalized;
}

export function normalizeWorkspace(value: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "";
  }
  if (!isPathShaped(trimmed)) {
    return trimmed;
  }

  const normalizedSeparators = trimmed.replaceAll("\\", "/").replace(
    /\/+/g,
    "/",
  );
  if (normalizedSeparators === "/") {
    return normalizedSeparators;
  }
  return normalizedSeparators.replace(/\/+$/g, "");
}

export function isAbsoluteWorkspacePath(workspace: string): boolean {
  return normalizeWorkspace(workspace).startsWith("/");
}

export function workspaceBasename(workspace: string): string | undefined {
  const normalized = normalizeWorkspace(workspace);
  if (!isAbsoluteWorkspacePath(normalized) || normalized === "/") {
    return undefined;
  }
  return normalized.split("/").at(-1) || undefined;
}

function isPathShaped(value: string): boolean {
  return value.includes("/") || value.includes("\\");
}
