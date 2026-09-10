import { loadConfig, prepareConfigStorage } from "@src/config.ts";
import { CatalogService } from "@src/catalog/service.ts";
import { SqliteCatalogRepository } from "@src/catalog/sqlite_repository.ts";
import type { LorLogger } from "@src/logger.ts";
import { authorizeOperation } from "@src/tools/authorization.ts";

export interface ToolRuntime {
  service: CatalogService;
  close(): void;
  authorize?(name: string, input: unknown): Promise<void>;
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
    authorize: (name, input) =>
      authorizeOperation(
        config.accessPolicy,
        (workspace) => repository.lookupWorkspace(workspace),
        name,
        input,
      ),
    service: new CatalogService({
      repository,
      skillRoots: config.skillRoots,
      logger: options.logger,
    }),
    close: () => repository.close(),
  };
}
