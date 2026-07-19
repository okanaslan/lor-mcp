# HTTP Auth Mode And Config

## 1. Summary

Future-only. This spec defines the configuration boundary for enabling HTTP
authorization in LOR. Auth must be explicit, disabled for the current local
runtime by default, and validated at startup.

## 2. Goals

- Keep local `127.0.0.1` development unauthenticated by default.
- Add one explicit HTTP auth mode switch before adding token validation.
- Make remote or non-loopback protected deployments fail closed.
- Keep stdio outside the HTTP OAuth configuration path.

## 3. Proposed Design

Future config should introduce an auth mode with these values:

- `disabled`: current default; no discovery endpoints; `/mcp` remains
  unauthenticated.
- `resource_server`: `/mcp` requires bearer tokens and LOR exposes protected
  resource metadata.

Suggested server-side env names:

- `LOR_HTTP_AUTH_MODE`
- `LOR_HTTP_RESOURCE_URI`
- `LOR_HTTP_AUTHORIZATION_SERVERS`
- `LOR_HTTP_REQUIRED_SCOPES`

Startup validation should reject `resource_server` mode when required resource
URI or authorization server metadata is missing. If `LOR_HOST` is not loopback,
future runtime config should require explicit auth or another documented safety
override.

## 4. Non-Goals

- Define exact token validation mechanics.
- Define OAuth client registration or login UX.
- Change the current `deno task serve` default behavior.
- Add auth config to Codex client setup.

## 5. Verification Plan

- Config tests for default `disabled` mode.
- Config tests for valid `resource_server` mode.
- Config tests for missing resource URI or authorization servers.
- Startup tests proving remote bind cannot silently run without the chosen
  safety policy.
- Stdio tests proving HTTP auth env does not affect stdio startup.

## 6. Open Questions

- Should remote bind require auth unconditionally, or should there be a separate
  explicit development override?
- Should scopes be configured globally first, then split per tool class later?
