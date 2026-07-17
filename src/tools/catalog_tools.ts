import type { McpServer } from "@mcp/server";
import { generateAgentPrompt } from "@src/agent_prompts/generator.ts";
import {
  clearWorkspaceCatalogInputSchema,
  type ClearWorkspaceCatalogToolInput,
  findMatchingCatalogEntryInputSchema,
  type FindMatchingCatalogEntryToolInput,
  generateAgentPromptInputSchema,
  type GenerateAgentPromptToolInput,
  getCatalogEntryDetailInputSchema,
  type GetCatalogEntryDetailToolInput,
  introduceAgentInputSchema,
  type IntroduceAgentToolInput,
  introduceSkillInputSchema,
  type IntroduceSkillToolInput,
  listCatalogEntriesInputSchema,
  type ListCatalogEntriesToolInput,
  prepareAgentHandoffInputSchema,
  type PrepareAgentHandoffToolInput,
  removeCatalogEntryInputSchema,
  type RemoveCatalogEntryToolInput,
  toolOutputSchema,
  updateCatalogEntryInputSchema,
  type UpdateCatalogEntryToolInput,
} from "@src/tools/schemas.ts";
import {
  errorResult,
  okResult,
  statusResult,
  type ToolResult,
} from "@src/tools/response.ts";
import { createDefaultRuntime, type ToolRuntime } from "@src/tools/runtime.ts";
import { LorError, toLorError } from "@src/errors.ts";

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
          throw new LorError(
            "not_found",
            "Catalog entry was not found.",
            { entryType: input.entryType },
          );
        }
        return okResult(entry, `Found ${entry.displayName}.`);
      }),
  );

  server.registerTool(
    "update_catalog_entry",
    {
      description: "Update editable metadata for one introduced catalog entry.",
      inputSchema: updateCatalogEntryInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: UpdateCatalogEntryToolInput) =>
      withRuntime(runtimeFactory, async (runtime) => {
        const entry = await runtime.service.updateCatalogEntry(input);
        return okResult(entry, `Updated ${entry.displayName}.`);
      }),
  );

  server.registerTool(
    "remove_catalog_entry",
    {
      description: "Remove one introduced catalog entry from a workspace.",
      inputSchema: removeCatalogEntryInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: RemoveCatalogEntryToolInput) =>
      withRuntime(runtimeFactory, async (runtime) => {
        const result = await runtime.service.removeCatalogEntry(input);
        return okResult(
          result,
          `Removed ${result.entryType} ${result.entryKey}.`,
        );
      }),
  );

  server.registerTool(
    "prepare_agent_handoff",
    {
      description:
        "Prepare a manual handoff prompt for an introduced Codex agent.",
      inputSchema: prepareAgentHandoffInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: PrepareAgentHandoffToolInput) =>
      withRuntime(runtimeFactory, async (runtime) => {
        const result = await runtime.service.prepareAgentHandoff(input);
        return okResult(
          result,
          `Prepared handoff prompt for ${result.targetAgent.displayName}.`,
        );
      }),
  );

  server.registerTool(
    "generate_agent_prompt",
    {
      description: "Generate a manual starter prompt for an empty Codex chat.",
      inputSchema: generateAgentPromptInputSchema,
      outputSchema: toolOutputSchema,
    },
    (input: GenerateAgentPromptToolInput) =>
      withToolErrors(() => {
        const result = generateAgentPrompt(input);
        return okResult(
          result,
          `Generated ${result.displayName} starter prompt.`,
        );
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

function withToolErrors(handler: () => ToolResult): ToolResult {
  try {
    return handler();
  } catch (error) {
    const appError = toLorError(error);
    return errorResult(
      appError.code,
      stripErrorPrefix(appError.message, appError.code),
      appError.details,
    );
  }
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
    const appError = toLorError(error);
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
