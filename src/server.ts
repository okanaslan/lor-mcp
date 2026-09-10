import { McpServer } from "@mcp/server";
import {
  type CatalogToolOptions,
  registerCatalogTools,
} from "@src/tools/catalog_tools.ts";
import { LOR_MCP_VERSION } from "@src/version.ts";
import { registerBundledSkillResources } from "@src/skills/skill_resources.ts";
import { SERVER_INSTRUCTIONS } from "@src/instructions.ts";
import {
  contractFingerprint,
  createToolRegistrar,
  type ToolContract,
} from "@src/tools/registry.ts";
import { registerResultPages, ResultPages } from "@src/tools/result_pages.ts";
import { createDefaultRuntime } from "@src/tools/runtime.ts";
import { registerCatalogContext } from "@src/catalog/context.ts";

export function createServer(
  options: CatalogToolOptions = {},
  pages = new ResultPages(),
): McpServer {
  const server = new McpServer({
    name: "lor-mcp",
    version: LOR_MCP_VERSION,
  }, { instructions: SERVER_INSTRUCTIONS });

  const contracts: ToolContract[] = [];
  const registerTool = createToolRegistrar(server, contracts, pages.bound);
  const runtimeFactory = options.runtimeFactory ??
    (() => createDefaultRuntime({ logger: options.logger }));
  registerCatalogTools(server, {
    ...options,
    runtimeFactory,
    registerTool,
    toolContractFingerprint: () => contractFingerprint(contracts),
  });
  registerBundledSkillResources(server, registerTool);
  registerCatalogContext(server, runtimeFactory, pages);
  registerResultPages(server, registerTool, pages, runtimeFactory);

  return server;
}
