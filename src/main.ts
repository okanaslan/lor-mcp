import { StdioServerTransport } from "@mcp/stdio";
import { createServer } from "@src/server.ts";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
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
