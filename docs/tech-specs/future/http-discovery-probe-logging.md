# HTTP Discovery Probe Logging

## 1. Summary

Future-supporting, near-term safe. This spec defines how LOR should log expected
`.well-known` OAuth and OpenID Connect discovery probes while the local server
remains unauthenticated.

The goal is to reduce noisy warnings without adding fake discovery endpoints or
changing MCP behavior.

## 2. Goals

- Keep normal `404` responses for auth discovery probes while auth is disabled.
- Classify expected `.well-known` probe logs below warning severity.
- Preserve warnings for unexpected 4xx requests that may indicate client or
  routing problems.
- Keep request and response bodies out of logs.

## 3. Proposed Design

HTTP logging should detect known auth discovery probe paths:

- `/.well-known/oauth-protected-resource`
- `/.well-known/oauth-protected-resource/...`
- `/.well-known/oauth-authorization-server`
- `/.well-known/oauth-authorization-server/...`
- `/.well-known/openid-configuration`
- `/.well-known/openid-configuration/...`
- `/mcp/.well-known/openid-configuration`

When those paths return `404`, LOR should log the completed request at `debug`.
All other 4xx responses should keep the existing warning behavior unless a later
spec defines a more precise classification.

## 4. Non-Goals

- Add OAuth or OpenID Connect discovery endpoints.
- Change HTTP response status codes.
- Suppress server errors.
- Log raw request bodies, response bodies, tokens, prompts, or catalog payloads.

## 5. Verification Plan

- HTTP logging test for expected `.well-known` `404` probe logged at `debug`.
- HTTP logging test for unrelated `404` still logged at `warn`.
- HTTP logging test proving request body text is not logged.
- Existing HTTP MCP session and tool-call tests continue to pass.

## 6. Decision Log

- 2026-07-19: Treat expected auth discovery probes as log noise until real HTTP
  authorization exists.
