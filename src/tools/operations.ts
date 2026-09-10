import type { SqliteCatalogRepository } from "@src/catalog/sqlite_repository.ts";
import { fingerprint } from "@src/catalog/revision.ts";
import { LorError, toLorError } from "@src/errors.ts";
import { errorResult, type ToolResult } from "@src/tools/response.ts";

export interface OperationReceipt {
  workspace: string;
  operationKey: string;
  payloadHash: string;
  status: "pending" | "completed";
  result: string | null;
  createdAt: string;
}

export async function executeOperation(
  repository: SqliteCatalogRepository,
  name: string,
  input: unknown,
  handler: () => Promise<ToolResult>,
): Promise<ToolResult> {
  const fields = input as Record<string, unknown>;
  if (typeof fields.idempotencyKey !== "string") return await handler();
  const workspace = repository.lookupWorkspace(
    String(fields.workspace ?? fields.targetWorkspace),
  );
  const payload = { ...fields, workspace };
  const payloadHash = fingerprint({ name, input: payload });
  const receipt = repository.reserveOperation(
    workspace,
    fields.idempotencyKey,
    payloadHash,
  );
  if (receipt) {
    if (receipt.payloadHash !== payloadHash) {
      throw new LorError(
        "idempotency_conflict",
        "Operation key is already bound to another request.",
      );
    }
    if (receipt.result !== null) {
      return JSON.parse(receipt.result) as ToolResult;
    }
    throw new LorError(
      "idempotency_conflict",
      "Operation outcome is pending or uncertain. Read its receipt and target before taking further action.",
    );
  }
  let result: ToolResult;
  try {
    result = await handler();
  } catch (error) {
    const appError = toLorError(error);
    result = errorResult(appError.code, appError.message, appError.details);
  }
  // A crash before this write leaves a pending receipt; it is never replayed.
  repository.completeOperation(workspace, fields.idempotencyKey, result);
  return result;
}
