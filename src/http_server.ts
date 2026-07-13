import { WebStandardStreamableHTTPServerTransport } from "@mcp/web-http";
import { isInitializeRequest } from "@mcp/types";
import type { CatalogToolOptions } from "@src/tools/catalog_tools.ts";
import { createServer } from "@src/server.ts";

const MCP_PATH = "/mcp";

type Transport = WebStandardStreamableHTTPServerTransport;

export function createHttpMcpHandler(
  options: CatalogToolOptions = {},
): (request: Request) => Promise<Response> {
  const transports = new Map<string, Transport>();

  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    if (url.pathname !== MCP_PATH) {
      return new Response("Not Found", { status: 404 });
    }

    const sessionId = request.headers.get("mcp-session-id") ?? undefined;
    if (sessionId) {
      const transport = transports.get(sessionId);
      if (!transport) {
        return jsonRpcError(404, -32001, "Session not found");
      }
      return await transport.handleRequest(request);
    }

    if (request.method !== "POST") {
      return jsonRpcError(400, -32000, "Bad Request: Session ID required");
    }

    const parsedBody = await parseJsonBody(request);
    if (!isInitializeBody(parsedBody)) {
      return jsonRpcError(400, -32000, "Bad Request: initialize required");
    }

    const transport: Transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true,
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (initializedSessionId: string) => {
        transports.set(initializedSessionId, transport);
      },
      onsessionclosed: (closedSessionId: string) => {
        transports.delete(closedSessionId);
      },
    });
    transport.onclose = () => {
      if (transport.sessionId) {
        transports.delete(transport.sessionId);
      }
    };

    const server = createServer(options);
    await server.connect(transport);
    return await transport.handleRequest(request, { parsedBody });
  };
}

function isInitializeBody(body: unknown): boolean {
  return Array.isArray(body)
    ? body.some((message) => isInitializeRequest(message))
    : isInitializeRequest(body);
}

async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.clone().json();
  } catch {
    return undefined;
  }
}

function jsonRpcError(
  status: number,
  code: number,
  message: string,
): Response {
  return Response.json({
    jsonrpc: "2.0",
    error: { code, message },
    id: null,
  }, { status });
}
