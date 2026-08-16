import { loadConfig, prepareConfigStorage } from "@src/config.ts";
import { CatalogService } from "@src/catalog/service.ts";
import { SqliteCatalogRepository } from "@src/catalog/sqlite_repository.ts";
import type { LorLogger } from "@src/logger.ts";

export interface ToolRuntime {
  service: CatalogService;
  close(): void;
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
    service: new CatalogService({
      repository,
      skillRoots: config.skillRoots,
      logger: options.logger,
    }),
    close: () => repository.close(),
  };
}
