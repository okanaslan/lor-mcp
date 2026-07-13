import { createHttpMcpHandler } from "@src/http_server.ts";
import { loadServeConfig } from "@src/config.ts";

async function main(): Promise<void> {
  const { host, port } = loadServeConfig();
  const handler = createHttpMcpHandler();

  console.error(`Agentic Router listening at http://${host}:${port}/mcp`);
  await Deno.serve({ hostname: host, port }, handler).finished;
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Agentic Router startup failed: ${message}`);
    Deno.exit(1);
  }
}
