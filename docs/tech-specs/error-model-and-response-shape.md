# Error Model And Response Shape

## 1. Summary

Draft. This tech spec defines the v1 MCP response envelope, error model,
`isError` behavior, and SDK `outputSchema` usage for Agentic Router tools.

The goal is to keep every tool response predictable for Codex agents while
keeping error output safe, concise, and namespace-isolated.

## 2. Context

The v1 MCP tool surface already defines structured response envelopes through
`structuredContent`, concise text `content`, and `isError` for tool failures.
The existence verification tech spec adds the `verification_failed` error case.

The MCP TypeScript SDK supports tool results with `structuredContent`, text
`content`, `outputSchema`, and `isError`. Successful and expected non-error
outcomes should be structured. Recoverable tool failures should return
`isError: true`.

This spec consolidates the shared response contract so individual tool specs
do not define competing error shapes.

## 3. Goals

- Keep tool responses reliable for agent consumption.
- Make response handling consistent across all v1 tools.
- Separate expected routing outcomes from tool failures.
- Define stable v1 error codes.
- Keep error output safe and free from cross-session leakage.
- Use SDK output schemas to catch response drift during implementation.

## 4. Non-Goals

- Define every tool-specific `data` payload field.
- Add HTTP-specific error behavior.
- Add logging or observability.
- Add localization.
- Define user-facing remediation guides for every error.

## 5. Proposed Design

Every v1 tool should return a standard structured envelope in
`structuredContent`.

Standard envelope fields:

- `status`: one of `ok`, `no_match`, `conflict`, or `error`.
- `data`: present for `ok`, `no_match`, and `conflict` when useful.
- `error`: present only when `status` is `error`.

Tool results should also include concise text `content` for human readability.
Codex agents should rely on `structuredContent` for control flow.

Successful and expected non-error outcomes should not set `isError`. Expected
non-error outcomes include:

- `status: ok`
- `status: no_match`
- `status: conflict`

Recoverable tool failures should return `status: error` and set
`isError: true`. Expected domain, session, setup, validation, verification, and
storage failures should be returned explicitly rather than thrown.

The error object should contain:

- `code`: stable machine-readable error code.
- `message`: concise safe caller-facing message.
- `details`: optional sanitized object for safe metadata only.

Safe `details` may include:

- Input field names.
- Entry type.
- Retryable flags.
- Validation issue summaries.

Error responses must not expose:

- Absolute filesystem paths.
- Environment variable values.
- Catalog namespace values.
- Hidden catalog entries.
- Cross-session information.
- Stack traces.
- SQL statements or database internals.

Every v1 MCP tool should register a Zod `outputSchema` for its response
envelope. Tool-specific schemas may refine `data`, but they must preserve the
shared envelope and error object shape.

## 6. Alternatives Considered

Returning text-only tool results was considered. It was not chosen because
Codex agents need stable structured responses for reliable routing decisions.

Using `structuredContent` without `outputSchema` was considered. It was not
chosen because SDK output validation can catch response drift before malformed
tool results leave the server.

Throwing expected domain errors from tool handlers was considered. It was not
chosen because explicit returned error envelopes provide stable codes,
sanitized details, and predictable text content.

Treating `no_match` and `conflict` as errors was considered. It was not chosen
because those are expected routing outcomes, not tool failures.

## 7. Implementation Notes

The implementation should add shared response builders near the MCP tool layer,
likely under `src/tools/` or a small shared response module. Tool handlers
should use those builders instead of hand-constructing envelopes.

Domain and catalog errors should map to stable response codes at the tool
boundary. Tool handlers should catch unexpected exceptions and convert them to
sanitized `internal_error` responses.

V1 error codes:

- `validation_error`
- `session_error`
- `setup_error`
- `duplicate_entry`
- `not_found`
- `verification_failed`
- `storage_error`
- `internal_error`

Expected failure mapping:

- Zod or input issues map to `validation_error`.
- Uninitialized MCP lifecycle or invalid request context maps to
  `session_error`.
- Missing namespace, database path, verifier config, or unreadable verifier
  source maps to `setup_error`.
- Duplicate namespace-local catalog references map to `duplicate_entry`.
- Missing requested catalog detail entries map to `not_found`.
- Valid verifier sources that do not contain the requested target map to
  `verification_failed`.
- SQLite read or write failures map to `storage_error`.
- Unexpected uncaught failures map to `internal_error` with a sanitized
  message.

The SDK may still produce its own validation behavior for input schema
failures. Where the implementation controls a tool or domain failure, it
should normalize the response through the shared envelope.

## 8. Risks and Tradeoffs

- Output schemas add upfront implementation work but reduce response drift.
- Optional details are useful for agents but require strict sanitization.
- Callers must inspect `status`, not only MCP `isError`.
- Mapping all expected failures at the tool boundary adds small boilerplate
  unless shared builders stay simple.

## 9. Verification Plan

When this tech spec is implemented as code, verification should include:

- Every v1 tool returns the standard envelope.
- Every v1 tool registers an output schema.
- `ok`, `no_match`, and `conflict` responses do not set `isError`.
- `status: error` responses set `isError: true`.
- Each expected failure maps to the correct stable error code.
- Error details never include filesystem paths, environment values, stack
  traces, SQL, namespace values, hidden entries, or cross-session data.
- Unexpected exceptions become sanitized `internal_error` responses.
- Text `content` summarizes the structured result without replacing it.

For this documentation change, verification is limited to reading back the
spec, checking the docs tree, running `git diff --check`, and checking git
status.

## 10. Open Questions

- Should future non-v1 tools reuse the exact same status enum, or extend it
  with tool-specific non-error statuses?
- Should later HTTP transport specs add protocol-level error mapping separate
  from tool result envelopes?
- Should implementation tests snapshot full envelopes or assert only stable
  fields?

## 11. Decision Log

- 2026-07-12: Use `structuredContent` as the canonical tool response for
  agents.
- 2026-07-12: Include concise text `content` for human readability.
- 2026-07-12: Register Zod `outputSchema` for every v1 tool response envelope.
- 2026-07-12: Treat `ok`, `no_match`, and `conflict` as non-error statuses.
- 2026-07-12: Return recoverable tool failures with `status: error` and
  `isError: true`.
- 2026-07-12: Allow optional sanitized error `details`.
- 2026-07-12: Define the v1 stable error code set.
