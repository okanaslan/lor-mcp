import { McpServer } from "@mcp/server";
import {
  type CatalogToolOptions,
  registerCatalogTools,
} from "@src/tools/catalog_tools.ts";

export function createServer(options: CatalogToolOptions = {}): McpServer {
  const server = new McpServer({
    name: "agentic-router",
    version: "0.1.0",
  });

  registerCatalogTools(server, options);

  return server;
}
