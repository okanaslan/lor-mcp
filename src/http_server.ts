import { WebStandardStreamableHTTPServerTransport } from "@mcp/web-http";
import { isInitializeRequest } from "@mcp/types";
import type { CatalogToolOptions } from "@src/tools/catalog_tools.ts";
import { createServer } from "@src/server.ts";
import { createNoopLogger } from "@src/logger.ts";

const MCP_PATH = "/mcp";

type Transport = WebStandardStreamableHTTPServerTransport;

export function createHttpMcpHandler(
  options: CatalogToolOptions = {},
): (request: Request) => Promise<Response> {
  const transports = new Map<string, Transport>();
  const logger = (options.logger ?? createNoopLogger()).child({
    component: "http",
  });

  return async (request: Request): Promise<Response> => {
    const startedAt = performance.now();
    const url = new URL(request.url);
    const sessionId = request.headers.get("mcp-session-id") ?? undefined;

    const logResponse = (response: Response): Response => {
      logHttpResponse(
        {
          event: "http_request",
          method: request.method,
          pathname: url.pathname,
          status: response.status,
          durationMs: durationMs(startedAt),
          sessionPresent: sessionId !== undefined,
        },
        "HTTP MCP request completed.",
      );
      return response;
    };

    if (url.pathname !== MCP_PATH) {
      return logResponse(new Response("Not Found", { status: 404 }));
    }

    if (sessionId) {
      const transport = transports.get(sessionId);
      if (!transport) {
        logger.warn(
          {
            event: "mcp_session_unknown",
            method: request.method,
            pathname: url.pathname,
            sessionId,
          },
          "MCP request used an unknown session id.",
        );
        return logResponse(jsonRpcError(404, -32001, "Session not found"));
      }
      try {
        return logResponse(await transport.handleRequest(request));
      } catch (error) {
        logger.error(
          {
            event: "http_request_failed",
            method: request.method,
            pathname: url.pathname,
            sessionId,
            durationMs: durationMs(startedAt),
            error,
          },
          "HTTP MCP request failed.",
        );
        throw error;
      }
    }

    if (request.method !== "POST") {
      logger.warn(
        {
          event: "mcp_session_required",
          method: request.method,
          pathname: url.pathname,
        },
        "MCP request was missing a session id.",
      );
      return logResponse(
        jsonRpcError(400, -32000, "Bad Request: Session ID required"),
      );
    }

    const parsedBody = await parseJsonBody(request);
    if (!isInitializeBody(parsedBody)) {
      logger.warn(
        {
          event: "mcp_initialize_required",
          method: request.method,
          pathname: url.pathname,
        },
        "MCP request without session id was not initialize.",
      );
      return logResponse(
        jsonRpcError(400, -32000, "Bad Request: initialize required"),
      );
    }

    const transport: Transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true,
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (initializedSessionId: string) => {
        transports.set(initializedSessionId, transport);
        logger.info(
          {
            event: "mcp_session_created",
            sessionId: initializedSessionId,
            activeSessions: transports.size,
          },
          "MCP session created.",
        );
      },
      onsessionclosed: (closedSessionId: string) => {
        logSessionClosed(closedSessionId);
      },
    });
    transport.onclose = () => {
      if (transport.sessionId) {
        logSessionClosed(transport.sessionId);
      }
    };

    const server = createServer(options);
    await server.connect(transport);
    try {
      return logResponse(
        await transport.handleRequest(request, { parsedBody }),
      );
    } catch (error) {
      logger.error(
        {
          event: "http_request_failed",
          method: request.method,
          pathname: url.pathname,
          durationMs: durationMs(startedAt),
          error,
        },
        "HTTP MCP request failed.",
      );
      throw error;
    }
  };

  function logSessionClosed(closedSessionId: string): void {
    if (!transports.delete(closedSessionId)) {
      return;
    }
    logger.info(
      {
        event: "mcp_session_closed",
        sessionId: closedSessionId,
        activeSessions: transports.size,
      },
      "MCP session closed.",
    );
  }

  function logHttpResponse(
    fields: Record<string, unknown>,
    message: string,
  ): void {
    const status = typeof fields.status === "number" ? fields.status : 0;
    if (status >= 500) {
      logger.error(fields, message);
      return;
    }
    if (status >= 400) {
      logger.warn(fields, message);
      return;
    }
    logger.debug(fields, message);
  }
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

function durationMs(startedAt: number): number {
  return Math.round((performance.now() - startedAt) * 100) / 100;
}
