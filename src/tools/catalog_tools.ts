import type { McpServer } from "@mcp/server";
import {
  clearWorkspaceCatalogInputSchema,
  type ClearWorkspaceCatalogToolInput,
  findMatchingCatalogEntryInputSchema,
  type FindMatchingCatalogEntryToolInput,
  getCatalogEntryDetailInputSchema,
  type GetCatalogEntryDetailToolInput,
  introduceAgentInputSchema,
  type IntroduceAgentToolInput,
  introduceSkillInputSchema,
  type IntroduceSkillToolInput,
  listCatalogEntriesInputSchema,
  type ListCatalogEntriesToolInput,
  toolOutputSchema,
} from "@src/tools/schemas.ts";
import {
  errorResult,
  okResult,
  statusResult,
  type ToolResult,
} from "@src/tools/response.ts";
import { createDefaultRuntime, type ToolRuntime } from "@src/tools/runtime.ts";
import { AgenticRouterError, toAgenticRouterError } from "@src/errors.ts";

export interface CatalogToolOptions {
  runtimeFactory?: () => Promise<ToolRuntime>;
}

export function registerCatalogTools(
  server: McpServer,
  options: CatalogToolOptions = {},
): void {
  const runtimeFactory = options.runtimeFactory ?? createDefaultRuntime;

  server.registerTool(
    "introduce_agent",
    {
      description: "Introduce an existing Codex agent to the catalog.",
      inputSchema: introduceAgentInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: IntroduceAgentToolInput) =>
      withRuntime(runtimeFactory, async (runtime) => {
        const entry = await runtime.service.introduceAgent(input);
        return okResult(entry, `Introduced agent ${entry.displayName}.`);
      }),
  );

  server.registerTool(
    "introduce_skill",
    {
      description: "Introduce an existing Codex skill to the catalog.",
      inputSchema: introduceSkillInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: IntroduceSkillToolInput) =>
      withRuntime(runtimeFactory, async (runtime) => {
        const entry = await runtime.service.introduceSkill(input);
        return okResult(entry, `Introduced skill ${entry.displayName}.`);
      }),
  );

  server.registerTool(
    "list_catalog_entries",
    {
      description: "List introduced agents and skills in a workspace catalog.",
      inputSchema: listCatalogEntriesInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: ListCatalogEntriesToolInput) =>
      withRuntime(runtimeFactory, async (runtime) => {
        const entries = await runtime.service.listEntries(input);
        return okResult(
          { entries },
          `Found ${entries.length} catalog entries.`,
        );
      }),
  );

  server.registerTool(
    "clear_workspace_catalog",
    {
      description:
        "Clear introduced agents and skills from one workspace catalog.",
      inputSchema: clearWorkspaceCatalogInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: ClearWorkspaceCatalogToolInput) =>
      withRuntime(runtimeFactory, async (runtime) => {
        const result = await runtime.service.clearWorkspaceCatalog(input);
        return okResult(
          result,
          `Cleared ${result.deletedTotal} catalog entries.`,
        );
      }),
  );

  server.registerTool(
    "get_catalog_entry_detail",
    {
      description: "Get full metadata for one introduced catalog entry.",
      inputSchema: getCatalogEntryDetailInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: GetCatalogEntryDetailToolInput) =>
      withRuntime(runtimeFactory, async (runtime) => {
        const entry = await runtime.service.getEntryDetail(input);
        if (!entry) {
          throw new AgenticRouterError(
            "not_found",
            "Catalog entry was not found.",
            { entryType: input.entryType },
          );
        }
        return okResult(entry, `Found ${entry.displayName}.`);
      }),
  );

  server.registerTool(
    "find_matching_catalog_entry",
    {
      description: "Find matching introduced agents and skills for a task.",
      inputSchema: findMatchingCatalogEntryInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: FindMatchingCatalogEntryToolInput) =>
      withRuntime(runtimeFactory, async (runtime) => {
        const result = await runtime.service.findMatchingEntries(input);
        if (result.status === "no_match") {
          return statusResult("no_match", result.data, "No matching entries.");
        }
        if (result.status === "conflict") {
          return statusResult(
            "conflict",
            result.data,
            "Multiple agents matched equally well.",
          );
        }
        return okResult(result.data, "Found matching catalog entries.");
      }),
  );
}

async function withRuntime(
  runtimeFactory: () => Promise<ToolRuntime>,
  handler: (runtime: ToolRuntime) => Promise<ToolResult>,
): Promise<ToolResult> {
  let runtime: ToolRuntime | undefined;
  try {
    runtime = await runtimeFactory();
    return await handler(runtime);
  } catch (error) {
    const appError = toAgenticRouterError(error);
    return errorResult(
      appError.code,
      stripErrorPrefix(appError.message, appError.code),
      appError.details,
    );
  } finally {
    runtime?.close();
  }
}

function stripErrorPrefix(message: string, code: string): string {
  return message.startsWith(`${code}: `)
    ? message.slice(code.length + 2)
    : message;
}
