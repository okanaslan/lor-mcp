# Session Identity And Catalog Scoping

## 1. Summary

Draft. This tech spec defines how Local Orchestration Router (LOR) scopes
catalog records across local HTTP and stdio v1 runtimes.

Catalog records should survive MCP reconnects and server restarts for the same
client workspace. To support that, v1 uses a client-supplied `workspace` value
as the durable catalog scope and resolves known aliases to a canonical
workspace.

## 2. Context

Local Orchestration Router (LOR) v1 is a Deno TypeScript MCP server with local
Streamable HTTP as the primary Codex connection mode and stdio as a fallback.
The MCP initialization lifecycle defines when the server is ready to accept
catalog tool calls.

For HTTP, the MCP Streamable HTTP transport provides a reusable `Mcp-Session-Id`
header for protocol session routing. For stdio, MCP provides initialize metadata
such as `protocolVersion`, capabilities, and `clientInfo`, followed by the
`notifications/initialized` readiness notification.

Existing feature specs require catalog records to be isolated by session scope
and durable enough for later listing, matching, update, and removal. The use
cases describe the catalog as belonging to the current project or workspace.

## 3. Goals

- Define stable workspace catalog scoping for local HTTP and stdio v1.
- Preserve catalog records across reconnects for the same client-supplied
  workspace.
- Keep MCP initialization as the readiness boundary for catalog tools.
- Prevent accidental cross-workspace catalog mixing.
- Prevent accidental split catalogs for path variants of the same workspace.
- Avoid treating MCP `clientInfo` as identity or access control.

## 4. Non-Goals

- Add user authentication.
- Add multi-user authorization.
- Choose a storage schema or database.
- Add a custom `create_session` tool.
- Define final catalog tool request and response schemas.

## 5. Proposed Design

Local Orchestration Router (LOR) v1 should use a client-supplied `workspace`
value for durable catalog ownership. The caller should pass the client workspace
path, folder name, or another stable client-chosen workspace slug with every
catalog tool request.

After MCP initialization completes, the active request context combines:

- `connectionId`: a process-local identifier for the initialized MCP connection.
- `mcpSessionId`: HTTP transport session ID when running over Streamable HTTP.
- `workspace`: the client-supplied stable workspace.
- `clientInfo`: descriptive client metadata received during initialization.

Catalog records are stored and queried by the resolved canonical `workspace`,
not by `clientInfo`. `clientInfo` may be recorded for diagnostics, but it must
not be used as authentication, authorization, or durable catalog identity.

Before any catalog read or write, LOR should normalize and resolve `workspace`:

- Trim whitespace.
- For path-shaped values, collapse repeated path separators and remove trailing
  slashes.
- Preserve case.
- Preserve non-path slugs.
- If the normalized value is a registered alias, use its canonical workspace.
- If the normalized value is an absolute path and has no alias, create a
  self-alias and create a basename alias only when the basename is unclaimed.

Catalog tools must reject calls before MCP initialization completes. Tool input
validation must reject a missing or empty `workspace`.

All catalog operations that read or write records must filter by the resolved
canonical `workspace`, including duplicate checks, list, detail, match, update,
remove, clear, import, export, health, and handoff preparation.

When a client reconnects or the server restarts and the caller sends the same
canonical workspace or a registered alias, the server should read the same
durable catalog records. When the caller sends a different unresolved
`workspace`, the server must not list, match, update, remove, or infer records
from the other workspace.

## 6. Alternatives Considered

Using the stdio connection as the only catalog scope was considered. It was not
chosen because records would not survive reconnects or restarts, which weakens
the durable catalog use cases.

Deriving scope from MCP `clientInfo` was considered. It was not chosen because
`clientInfo` is client-provided metadata and must not be treated as trusted
identity.

Deriving scope from the process working directory was considered. It was not
chosen because launch contexts can vary and may not reliably represent the
intended workspace.

Deriving workspace scope from server configuration or server current working
directory was considered. It was rejected because catalog scope is user data
from the client workspace, not static server state.

## 7. Implementation Notes

Tool handlers should accept `workspace` through each tool input schema and pass
it to catalog domain and repository functions. They must not read workspace
scope from environment variables, server cwd, or initialization metadata.

The workspace value should be documented as client-specific, stable, and
user-chosen. A practical value is the client's workspace folder name.

Storage code should treat `workspace` as part of every catalog record's
ownership boundary after alias resolution. Duplicate detection must be
workspace-local.

The `register_workspace_alias` tool should let callers explicitly map an
alternate workspace string to a canonical workspace. Conflicting alias
reassignment must require `confirm: true`.

Validation errors caused by a missing workspace should be explicit enough for
the caller to resend the tool call with the client workspace folder name without
revealing records from any other workspace.

## 8. Risks and Tradeoffs

- Misconfigured aliases can intentionally point multiple workspace strings at
  one catalog, so reassignment requires confirmation.
- Requiring the client to provide workspace increases tool input verbosity but
  avoids depending on server launch context.
- Existing historical rows under split workspace keys are not automatically
  merged; aliases prevent new splits and make explicitly mapped keys reusable.
- The v1 workspace value is not authentication; future multi-user deployments
  need a stronger identity and authorization model.

## 9. Verification Plan

When this tech spec is implemented as code, verification should include:

- Missing tool-input `workspace` returns a validation error.
- Catalog calls before MCP initialization fail.
- Reconnecting with the same workspace can read prior durable records.
- Different workspaces cannot list, match, update, remove, or infer each other's
  records.
- Changing `clientInfo` does not change catalog scope when the tool-input
  workspace is unchanged.
- Path-shaped workspace values normalize trailing slashes and repeated
  separators.
- Registered aliases return the same catalog entries as the canonical workspace.
- Ambiguous basename aliases are not auto-reassigned.

For this documentation change, verification is limited to reading back the spec,
checking the docs tree, running `git diff --check`, and checking git status.

## 10. Open Questions

- Should workspace format be free-form or restricted later?
- Should future import/export include workspace or require an explicit target
  workspace?
- Should a diagnostics tool report the requested workspace without exposing
  catalog data?

## 11. Decision Log

- 2026-07-12: Preserve catalog entries across MCP reconnects and restarts for
  the same workspace.
- 2026-07-12: Earlier stdio planning used a server-configured durable catalog
  scope.
- 2026-07-12: Fail catalog tools when the workspace is missing instead of using
  a global or ephemeral scope.
- 2026-07-12: Keep MCP initialization as the readiness boundary for catalog
  tools.
- 2026-07-12: Treat `clientInfo` as descriptive metadata only, not identity or
  access control.
- 2026-07-13: Use local Streamable HTTP sessions for HTTP routing while keeping
  durable catalog scope independent from the protocol session ID.
- 2026-07-13: Earlier implementation defaulted workspace to the server workspace
  directory name and kept a server-side override.
- 2026-07-13: Replace server-derived catalog scope with required client-supplied
  `workspace` tool input.
- 2026-07-19: Add normalization and workspace alias resolution so equivalent
  path and folder-name inputs can use one canonical workspace catalog.
