# Future HTTP Authorization Discovery

## 1. Summary

Future-only. This tech spec defines how Local Orchestration Router (LOR) should
implement MCP HTTP authorization discovery if LOR later becomes a protected,
network-accessible, or multi-user MCP server.

The current local server remains unauthenticated. It binds to `127.0.0.1`,
serves MCP at `/mcp`, and should continue returning normal `404` responses for
OAuth and OpenID Connect discovery probes until real authorization is
implemented.

## 2. Context

Codex and other MCP clients may probe `.well-known` OAuth or OpenID Connect
metadata URLs when connecting to an HTTP MCP server. Those probes are expected
client discovery behavior. For the current local-only LOR runtime, returning
`404` is correct because LOR does not require bearer tokens and does not expose
an authorization server.

MCP authorization is optional. If LOR later supports authorization for HTTP, it
must implement a real OAuth-based flow rather than metadata-only endpoints that
make clients believe a protected resource exists.

Reference specs:

- [MCP Authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
- [MCP Transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)

## 3. Supporting Specs

- [HTTP Discovery Probe Logging](http-discovery-probe-logging.md)
- [HTTP Auth Mode And Config](http-auth-mode-and-config.md)
- [HTTP Protected Resource Metadata](http-protected-resource-metadata.md)
- [HTTP Token Validation And Scopes](http-token-validation-and-scopes.md)
- [HTTP Auth Middleware Boundary](http-auth-middleware-boundary.md)
- [HTTP Security Hardening](http-security-hardening.md)
- [HTTP Authorization Server Integration](http-authorization-server-integration.md)

## 4. Goals

- Define the late-future authorization discovery shape for HTTP LOR deployments.
- Keep current local unauthenticated behavior explicit.
- Avoid fake discovery documents before LOR has real token validation.
- Preserve stdio as a non-OAuth transport.

## 5. Non-Goals

- Implement OAuth, OpenID Connect, scopes, login, consent, or token validation.
- Add auth to the current local `127.0.0.1` development server.
- Add MCP tools or change existing MCP tool schemas.
- Define a full authorization server product.
- Support OAuth over stdio.

## 6. Proposed Future Model

If LOR becomes protected over HTTP, LOR should act as an OAuth protected
resource / resource server. A separate or co-located authorization server should
authenticate users and issue bearer tokens for the LOR MCP resource.

Protected MCP requests should require:

- `Authorization: Bearer <token>` on every HTTP request.
- Tokens audience-bound to the canonical LOR MCP resource URI.
- Token validation before requests reach MCP session or tool handling.
- `401 Unauthorized` for missing, invalid, or expired tokens.
- `403 Forbidden` for valid tokens with insufficient scope.

The current `Mcp-Session-Id` remains an MCP transport session identifier only.
It must not become authentication, authorization, or durable user identity.

## 7. Discovery Endpoints

When HTTP authorization is actually enabled, LOR should provide OAuth Protected
Resource Metadata so clients can discover the authorization server:

- `/.well-known/oauth-protected-resource/mcp`
- `/.well-known/oauth-protected-resource`

The protected resource metadata should include the LOR resource identifier and
one or more `authorization_servers`.

LOR should serve authorization server metadata only if LOR owns or co-locates
the authorization server:

- `/.well-known/oauth-authorization-server`
- Path-insertion variants required by the active MCP authorization spec when the
  issuer has a path component.

LOR should serve OpenID Connect provider metadata only if the authorization
server supports OIDC:

- `/.well-known/openid-configuration`
- Path-insertion and path-appending variants required by the active MCP
  authorization spec when the issuer has a path component.

Until real authorization exists, LOR should not return successful JSON metadata
from any of these endpoints.

## 8. Protected Request Behavior

Unauthenticated requests to `/mcp` should return `401` with a `WWW-Authenticate`
header that points to protected resource metadata:

```http
WWW-Authenticate: Bearer resource_metadata="http://127.0.0.1:8765/.well-known/oauth-protected-resource/mcp"
```

If scopes are used, the challenge should include the minimum scope required for
the current request. Insufficient scope responses should return `403` and a
`WWW-Authenticate` header with `error="insufficient_scope"` and the required
scope.

Authorization should be enforced before MCP session lookup, session creation, or
tool dispatch. Discovery endpoints should not require authentication.

## 9. Current Local Behavior

For the current v1 local runtime:

- `/mcp` remains unauthenticated.
- `.well-known` OAuth and OpenID Connect probes should return `404`.
- Discovery-probe log noise should be handled by logging policy, not by fake
  discovery endpoints.
- Stdio should continue using environment-based local configuration and should
  not follow HTTP OAuth discovery.

## 10. Verification Plan

When this future spec is implemented as code, verification should include:

- HTTP tests for protected resource metadata endpoints.
- HTTP tests for authorization server metadata endpoints, if LOR owns an
  authorization server.
- HTTP tests for OIDC discovery endpoints, if OIDC is supported.
- `/mcp` tests for missing token, invalid token, valid token, and insufficient
  scope.
- Tests proving token validation happens before MCP session creation or tool
  dispatch.
- Tests proving stdio does not use HTTP OAuth discovery.
- Logging tests proving expected `.well-known` probes are not surfaced as
  misleading runtime warnings.

For this docs-only change, verification is limited to reading the touched docs,
searching for the expected auth discovery terms, checking Markdown formatting,
and running `git diff --check`.

## 11. Open Questions

- Should future LOR auth use a co-located authorization server or integrate with
  an external provider?
- Which scopes should map to read-only tools, destructive catalog operations,
  local skill file sync, import/export, and admin-style operations?
- Should a future local server keep auth disabled by default even if remote
  deployments require it?

## 12. Decision Log

- 2026-07-19: Keep current local HTTP unauthenticated and defer OAuth/OIDC
  discovery until LOR has real authorization.
- 2026-07-19: Do not implement fake `.well-known` discovery responses only to
  satisfy client probes.
