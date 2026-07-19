# HTTP Security Hardening

## 1. Summary

Future-only. This spec collects HTTP security requirements that should accompany
any future move from local unauthenticated LOR to protected or network-reachable
LOR deployments.

## 2. Goals

- Preserve localhost-only safety for the current development server.
- Add Origin validation for browser-reachable HTTP requests.
- Require HTTPS for non-local protected deployments.
- Prevent tokens, prompts, catalog payloads, and local file paths from leaking
  into logs.
- Keep destructive tools behind existing explicit confirmation fields.

## 3. Proposed Design

Future HTTP hardening should include:

- Loopback bind by default.
- Explicit config for non-loopback bind.
- Origin validation before MCP handling.
- HTTPS requirement for remote deployments.
- Bearer token redaction in logger serializers.
- No request or response body logging.
- No absolute local skill file paths in MCP error responses.
- Rate or size limits for metadata, initialize, and tools/call requests if LOR
  becomes network-accessible.

Auth does not replace tool-level confirmation. Destructive operations such as
clear, remove, apply skill update, and local skill file sync should keep their
existing explicit confirmation requirements.

## 4. Non-Goals

- Define OAuth scopes.
- Define deployment packaging.
- Add a daemon, installer, or reverse proxy.
- Add user accounts.

## 5. Verification Plan

- HTTP tests for allowed and rejected Origin headers.
- Config tests for loopback and non-loopback bind policies.
- Logging tests for token and payload redaction.
- Tests proving destructive tool confirmations are still required after auth is
  enabled.
- Manual review of Deno permissions for future auth tasks.

## 6. Open Questions

- Should Origin validation be enabled for local-only mode immediately?
- Should remote mode require a reverse proxy instead of native TLS in Deno?
- What request body size limit is appropriate for catalog import?
