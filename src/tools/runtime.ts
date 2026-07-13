import { loadConfig } from "@src/config.ts";
import { CatalogService } from "@src/catalog/service.ts";
import { SqliteCatalogRepository } from "@src/catalog/sqlite_repository.ts";

export interface ToolRuntime {
  catalogNamespace: string;
  service: CatalogService;
  close(): void;
}

export async function createDefaultRuntime(): Promise<ToolRuntime> {
  const config = loadConfig();
  const repository = new SqliteCatalogRepository(config.dbPath);
  await repository.initialize();

  return {
    catalogNamespace: config.catalogNamespace,
    service: new CatalogService({
      repository,
      agentRegistryPath: config.agentRegistryPath,
      skillRoots: config.skillRoots,
    }),
    close: () => repository.close(),
  };
}
