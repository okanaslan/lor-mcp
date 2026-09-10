import { loadConfig, prepareConfigStorage } from "@src/config.ts";
import { CatalogService } from "@src/catalog/service.ts";
import { SqliteCatalogRepository } from "@src/catalog/sqlite_repository.ts";
import type { LorLogger } from "@src/logger.ts";
import { authorizeOperation } from "@src/tools/authorization.ts";
import { LorError } from "@src/errors.ts";
import {
  executeOperation,
  type OperationReceipt,
} from "@src/tools/operations.ts";
import type { ToolResult } from "@src/tools/response.ts";

export interface ToolRuntime {
  service: CatalogService;
  close(): void;
  authorize?(name: string, input: unknown): Promise<void>;
  execute?(
    name: string,
    input: unknown,
    handler: () => Promise<ToolResult>,
  ): Promise<ToolResult>;
  getOperation?(workspace: string, key: string): OperationReceipt | undefined;
}

export interface CreateDefaultRuntimeOptions {
  logger?: LorLogger;
}

export async function createDefaultRuntime(
  options: CreateDefaultRuntimeOptions = {},
): Promise<ToolRuntime> {
  const config = loadConfig();
  await prepareConfigStorage(config);
  const repository = new SqliteCatalogRepository(config.dbPath);
  await repository.initialize();

  return {
    execute: (name, input, handler) =>
      executeOperation(repository, name, input, handler),
    getOperation: (workspace, key) =>
      repository.getOperation(repository.lookupWorkspace(workspace), key),
    authorize: async (name, input) => {
      await authorizeOperation(
        config.accessPolicy,
        (workspace) => repository.lookupWorkspace(workspace),
        name,
        input,
      );
      if (
        name === "apply_workspace_catalog_sync" &&
        !(input as { previewDigest?: string }).previewDigest
      ) {
        throw new LorError(
          "revision_conflict",
          "Review a preview and provide previewDigest before applying catalog sync.",
          { field: "previewDigest" },
        );
      }
      if (
        ["update_skill", "update_subagent", "remove_skill", "remove_subagent"]
          .includes(name) &&
        !(input as { expectedRevision?: string }).expectedRevision
      ) {
        throw new LorError(
          "revision_conflict",
          "Read the target and provide expectedRevision before modifying it.",
          { field: "expectedRevision" },
        );
      }
    },
    service: new CatalogService({
      repository,
      skillRoots: config.skillRoots,
      logger: options.logger,
    }),
    close: () => repository.close(),
  };
}
