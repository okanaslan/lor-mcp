# HTTP Auth Middleware Boundary

## 1. Summary

Future-only. This spec defines where HTTP authorization should sit in LOR's
Streamable HTTP request flow.

Authorization should be an HTTP-layer gate in front of MCP transport session
handling, not a concern inside catalog services or individual tool handlers.

## 2. Goals

- Keep auth enforcement before MCP session creation and lookup.
- Keep catalog domain code transport-independent.
- Avoid duplicating token checks in every MCP tool.
- Keep discovery endpoints outside the protected `/mcp` flow.

## 3. Proposed Design

Future `src/http_server.ts` should route requests in this order:

1. Serve unauthenticated discovery endpoints when auth is enabled.
2. Return `404` for unknown non-MCP paths.
3. For `/mcp`, enforce HTTP auth when auth mode is enabled.
4. Only after auth succeeds, continue MCP session lookup or initialize handling.
5. Dispatch MCP requests through the existing transport and tool registration.

Validated auth context should remain an HTTP-layer value unless a later feature
needs it for audit logging or workspace authorization. It must not replace the
client-supplied `workspace` field without a separate catalog-scoping spec.

## 4. Non-Goals

- Add auth checks to catalog repositories or matchers.
- Change MCP tool schemas.
- Treat `Mcp-Session-Id` as authenticated identity.
- Define user-to-workspace authorization.

## 5. Verification Plan

- Tests proving failed auth prevents session creation.
- Tests proving failed auth prevents existing session reuse.
- Tests proving discovery endpoints bypass token validation.
- Tests proving stdio tool handling is unchanged.
- Tests proving successful auth preserves existing MCP initialize and tools/list
  behavior.

## 6. Decision Log

- 2026-07-19: Future auth belongs at the HTTP boundary before MCP session
  handling.
