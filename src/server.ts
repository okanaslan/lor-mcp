import { McpServer } from "@mcp/server";
import {
  type CatalogToolOptions,
  registerCatalogTools,
} from "@src/tools/catalog_tools.ts";
import { LOR_MCP_VERSION } from "@src/version.ts";

export function createServer(options: CatalogToolOptions = {}): McpServer {
  const server = new McpServer({
    name: "lor-mcp",
    version: LOR_MCP_VERSION,
  });

  registerCatalogTools(server, options);

  return server;
}
