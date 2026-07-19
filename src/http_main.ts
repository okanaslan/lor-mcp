import { createHttpMcpHandler } from "@src/http_server.ts";
import { loadLogConfig, loadServeConfig } from "@src/config.ts";
import { createLogger } from "@src/logger.ts";

async function main(): Promise<void> {
  const { host, port } = loadServeConfig();
  const logger = createLogger(loadLogConfig());
  const handler = createHttpMcpHandler({ logger });

  logger.info(
    { event: "server_start", transport: "http", host, port, pathname: "/mcp" },
    `Local Orchestration Router (LOR) listening at http://${host}:${port}/mcp`,
  );
  await Deno.serve({ hostname: host, port }, handler).finished;
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const logger = createLogger({ level: "info", format: "pretty" });
    logger.fatal(
      { event: "server_start_failed", transport: "http", error },
      `Local Orchestration Router (LOR) startup failed: ${message}`,
    );
    Deno.exit(1);
  }
}
