import { StdioServerTransport } from "@mcp/stdio";
import { loadLogConfig } from "@src/config.ts";
import { createLogger } from "@src/logger.ts";
import { createServer } from "@src/server.ts";

async function main(): Promise<void> {
  const logger = createLogger(loadLogConfig());
  const server = createServer({ logger });
  const transport = new StdioServerTransport();
  logger.info(
    { event: "server_start", transport: "stdio" },
    "Local Orchestration Router (LOR) stdio transport starting.",
  );
  await server.connect(transport);
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const logger = createLogger({ level: "info", format: "pretty" });
    logger.fatal(
      { event: "server_start_failed", transport: "stdio", error },
      `Local Orchestration Router (LOR) startup failed: ${message}`,
    );
    Deno.exit(1);
  }
}
