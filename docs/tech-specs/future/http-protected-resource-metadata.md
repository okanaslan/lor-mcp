# HTTP Protected Resource Metadata

## 1. Summary

Future-only. This spec defines LOR's OAuth Protected Resource Metadata behavior
when HTTP auth is enabled.

Protected resource metadata is the resource-server discovery layer. It tells MCP
clients which authorization server protects LOR and which resource URI tokens
must target.

## 2. Goals

- Serve protected resource metadata only when HTTP auth is enabled.
- Identify the canonical LOR MCP resource URI.
- Advertise one or more configured authorization servers.
- Keep current auth-disabled `.well-known` probes as `404`.

## 3. Proposed Design

When `LOR_HTTP_AUTH_MODE=resource_server`, LOR should serve metadata at:

- `/.well-known/oauth-protected-resource/mcp`
- `/.well-known/oauth-protected-resource`

The response should be JSON and include:

- `resource`: canonical LOR MCP resource URI.
- `authorization_servers`: configured authorization server issuer URLs.
- `scopes_supported`: configured minimum LOR scopes, when scopes are used.

The endpoint should not require authentication. The metadata should be generated
from validated startup config, not inferred from arbitrary request input.

## 4. Non-Goals

- Serve authorization server metadata.
- Validate tokens.
- Add tool-specific scope policy.
- Support discovery while auth mode is disabled.

## 5. Verification Plan

- HTTP tests for both protected resource metadata paths.
- Test metadata includes configured resource URI and authorization servers.
- Test auth-disabled mode returns `404`.
- Test discovery endpoints do not create MCP sessions.
- Test invalid config fails before metadata can be served.

## 6. Decision Log

- 2026-07-19: Protected resource metadata is the first future discovery layer
  LOR should implement if HTTP auth becomes real.
