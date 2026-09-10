import type { McpServer } from "@mcp/server";
import * as z from "zod/v4";
import { fingerprint } from "@src/catalog/revision.ts";
import type { ToolResult } from "@src/tools/response.ts";

export interface ToolContract {
  name: string;
  description?: string;
  inputSchema: unknown;
  outputSchema: unknown;
  annotations: unknown;
}

export function contractFingerprint(
  contracts: readonly ToolContract[],
): string {
  return fingerprint(
    [...contracts].sort((a, b) => a.name.localeCompare(b.name)),
  );
}

export function createToolRegistrar(
  server: McpServer,
  contracts: ToolContract[],
  bound?: (result: ToolResult, name: string, input: unknown) => ToolResult,
): McpServer["registerTool"] {
  return (name: string, config: {
    description?: string;
    inputSchema?: unknown;
    outputSchema?: unknown;
    annotations?: unknown;
  }, handler: (...args: unknown[]) => ToolResult | Promise<ToolResult>) => {
    const schema = (value: unknown) => {
      if (value === undefined) return undefined;
      const type = value instanceof z.ZodType
        ? value
        : z.object(value as z.ZodRawShape);
      return z.toJSONSchema(type, { unrepresentable: "any" });
    };
    contracts.push({
      name,
      description: config.description,
      inputSchema: schema(config.inputSchema),
      outputSchema: schema(config.outputSchema),
      annotations: config.annotations,
    });
    return server.registerTool(name, config, async (...args: unknown[]) => {
      const result = await handler(...args);
      return bound && result.structuredContent
        ? bound(result as ToolResult, name, args[0])
        : result;
    });
  };
}
