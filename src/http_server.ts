import { WebStandardStreamableHTTPServerTransport } from "@mcp/web-http";
import { isInitializeRequest } from "@mcp/types";
import type { CatalogToolOptions } from "@src/tools/catalog_tools.ts";
import { createServer } from "@src/server.ts";
import { createNoopLogger } from "@src/logger.ts";

const MCP_PATH = "/mcp";

type Transport = WebStandardStreamableHTTPServerTransport;

export interface HttpMcpOptions extends CatalogToolOptions {
  maxSessions?: number;
  maxRequestBytes?: number;
  sessionIdleMs?: number;
  requestBodyTimeoutMs?: number;
  now?: () => number;
}

export function createHttpMcpHandler(
  options: HttpMcpOptions = {},
): (request: Request) => Promise<Response> {
  const transports = new Map<
    string,
    { transport: Transport; lastUsed: number; inFlight: number }
  >();
  const maxSessions = options.maxSessions ?? 64;
  const maxRequestBytes = options.maxRequestBytes ?? 4 * 1024 * 1024;
  const sessionIdleMs = options.sessionIdleMs ?? 30 * 60 * 1000;
  const requestBodyTimeoutMs = options.requestBodyTimeoutMs ?? 15_000;
  const now = options.now ?? Date.now;
  let initializing = 0;
  for (
    const value of [
      maxSessions,
      maxRequestBytes,
      sessionIdleMs,
      requestBodyTimeoutMs,
    ]
  ) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new Error("HTTP limits must be positive safe integers.");
    }
  }
  const logger = (options.logger ?? createNoopLogger()).child({
    component: "http",
  });

  return async (request: Request): Promise<Response> => {
    const startedAt = performance.now();
    const url = new URL(request.url);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
      logger.warn(
        { event: "http_boundary_denied", reason: "host" },
        "Rejected non-local HTTP host.",
      );
      return new Response("Forbidden host", { status: 403 });
    }
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) {
      logger.warn(
        { event: "http_boundary_denied", reason: "origin" },
        "Rejected cross-origin HTTP request.",
      );
      return new Response("Forbidden origin", { status: 403 });
    }
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

    for (const [id, session] of transports) {
      if (!session.inFlight && now() - session.lastUsed >= sessionIdleMs) {
        await session.transport.close();
        logSessionClosed(id);
      }
    }
    let parsedBody: unknown;
    if (request.method === "POST") {
      try {
        parsedBody = await parseJsonBody(
          request,
          maxRequestBytes,
          requestBodyTimeoutMs,
        );
      } catch (error) {
        const status = error instanceof BodyError ? error.status : 400;
        return logResponse(
          jsonRpcError(
            status,
            status === 400 ? -32700 : -32000,
            status === 413
              ? "Request exceeds the body-size limit"
              : status === 408
              ? "Request body timed out"
              : "Invalid JSON request",
          ),
        );
      }
    }

    if (sessionId) {
      const session = transports.get(sessionId);
      if (!session) {
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
      session.lastUsed = now();
      session.inFlight++;
      try {
        return logResponse(
          await session.transport.handleRequest(request, { parsedBody }),
        );
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
      } finally {
        session.inFlight--;
        session.lastUsed = now();
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

    if (transports.size + initializing >= maxSessions) {
      return logResponse(
        jsonRpcError(
          503,
          -32000,
          "Session capacity reached. Close an unused session or retry later.",
        ),
      );
    }
    initializing++;

    const transport: Transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true,
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (initializedSessionId: string) => {
        transports.set(initializedSessionId, {
          transport,
          lastUsed: now(),
          inFlight: 1,
        });
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
    try {
      await server.connect(transport);
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
    } finally {
      initializing--;
      const session = transport.sessionId
        ? transports.get(transport.sessionId)
        : undefined;
      if (session) {
        session.inFlight = 0;
        session.lastUsed = now();
      } else await server.close();
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
    if (
      status === 404 &&
      typeof fields.pathname === "string" &&
      isExpectedAuthDiscoveryProbePath(fields.pathname)
    ) {
      logger.debug(fields, message);
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

class BodyError extends Error {
  constructor(readonly status: number) {
    super("Invalid request body");
  }
}

async function parseJsonBody(
  request: Request,
  maxBytes: number,
  timeoutMs: number,
): Promise<unknown> {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) {
    throw new BodyError(413);
  }
  if (!request.body) throw new BodyError(400);
  const reader = request.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const read = async () => {
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > maxBytes) throw new BodyError(413);
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      return JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      );
    };
    return await Promise.race([
      read(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new BodyError(408)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
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

function isExpectedAuthDiscoveryProbePath(pathname: string): boolean {
  return pathname === "/.well-known/oauth-protected-resource" ||
    pathname.startsWith("/.well-known/oauth-protected-resource/") ||
    pathname === "/.well-known/oauth-authorization-server" ||
    pathname.startsWith("/.well-known/oauth-authorization-server/") ||
    pathname === "/.well-known/openid-configuration" ||
    pathname.startsWith("/.well-known/openid-configuration/") ||
    pathname === "/mcp/.well-known/openid-configuration";
}
