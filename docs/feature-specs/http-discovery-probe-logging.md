# HTTP Discovery Probe Logging

## 1. Summary

Implemented. This feature reduces log noise from expected OAuth and OpenID
Connect `.well-known` discovery probes while LOR's local HTTP server remains
unauthenticated.

## 2. Goals

- Keep expected auth discovery probes from appearing as warnings.
- Preserve real warning logs for unexpected client or routing problems.
- Avoid adding fake OAuth or OIDC discovery metadata.
- Keep request and response bodies out of logs.

## 3. Non-Goals

- Add HTTP authorization.
- Change HTTP status codes for discovery probe paths.
- Suppress server errors.
- Log request bodies, response bodies, tokens, prompts, or catalog payloads.

## 4. Functional Requirements

- The server must identify expected `.well-known` auth discovery probe paths.
- Expected discovery probe `404` responses must be logged below warning
  severity.
- Unrelated `4xx` responses must keep warning-level behavior unless separately
  classified.
- The server must keep returning the same HTTP status codes.
- The server must not return fake authorization discovery documents.

## 5. User Stories / Use Cases

- [Review Clean HTTP Discovery Logs](../use-cases/review-clean-http-discovery-logs.md)

## 6. Data Model

No durable domain data is required. This is HTTP request classification logic.

## 7. Error Handling

- Classification failures must not change request handling.
- Server errors must still be logged at error severity.

## 8. Security and Permissions

- Logs must not include raw request or response bodies.
- Logs must not include credentials, tokens, prompts, or catalog payloads.
- LOR must not imply HTTP auth support until real auth is implemented.

## 9. Open Questions

- Should expected discovery probes be logged at `debug` or omitted entirely when
  `LOR_LOG_LEVEL` is higher?

## 10. Decision Log

- 2026-08-06: Implement debug-level logging for expected auth discovery probe
  `404` responses without changing response status codes or adding fake
  discovery documents.
- 2026-08-06: Plan expected auth discovery probe `404` responses as debug-level
  request noise, not warnings.
