import { loadConfig, prepareConfigStorage } from "@src/config.ts";
import { CatalogService } from "@src/catalog/service.ts";
import { SqliteCatalogRepository } from "@src/catalog/sqlite_repository.ts";

export interface ToolRuntime {
  service: CatalogService;
  close(): void;
}

export async function createDefaultRuntime(): Promise<ToolRuntime> {
  const config = loadConfig();
  await prepareConfigStorage(config);
  const repository = new SqliteCatalogRepository(config.dbPath);
  await repository.initialize();

  return {
    service: new CatalogService({
      repository,
    }),
    close: () => repository.close(),
  };
}
