# HTTP Token Validation And Scopes

## 1. Summary

Future-only. This spec defines the protected-resource side of bearer token
validation and scope handling for HTTP LOR deployments.

LOR must validate tokens before MCP session handling and must never accept token
passthrough from unrelated resource servers.

## 2. Goals

- Require `Authorization: Bearer <token>` on every protected HTTP request.
- Validate token issuer, audience, expiry, and required scopes.
- Return protocol-appropriate `401` and `403` responses.
- Keep `Mcp-Session-Id` unrelated to user identity.
- Redact tokens and token-derived sensitive details from logs.

## 3. Proposed Design

Token validation should run before MCP session lookup, session creation, or tool
dispatch. A valid token must satisfy:

- Issuer matches a configured authorization server.
- Audience/resource is bound to the canonical LOR MCP resource URI.
- Expiry and not-before claims are valid.
- Required scopes are present for the target operation.

Initial scope classes should be coarse and implementation-safe:

- `lor:read`: list, detail, match, health, export, prompt generation, and
  handoff preparation.
- `lor:write`: introduce, update, import, remove, clear, skill update proposal,
  apply, and local skill file sync.

Missing, invalid, or expired tokens should return `401` with `WWW-Authenticate`.
Valid tokens with insufficient scope should return `403` with
`error="insufficient_scope"` and the required scope.

## 4. Non-Goals

- Implement an authorization server.
- Store user accounts in LOR.
- Bind catalog workspace ownership to auth claims.
- Add per-entry ACLs.

## 5. Verification Plan

- HTTP tests for missing token, malformed header, invalid token, expired token,
  wrong audience, and wrong issuer.
- HTTP tests for `lor:read` and `lor:write` scope enforcement.
- Tests proving no MCP session is created when validation fails.
- Logging tests proving bearer tokens and claims are not emitted.

## 6. Open Questions

- Should local skill file sync require a stronger scope than other write tools?
- Should import/export have separate backup/restore scopes?
- Should future workspace ownership be claim-based or remain explicit tool
  input?
