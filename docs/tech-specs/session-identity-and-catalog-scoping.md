# Session Identity And Catalog Scoping

## 1. Summary

Draft. This tech spec defines how Agentic Router scopes catalog records across
local HTTP and stdio v1 runtimes.

Catalog records should survive MCP reconnects and server restarts for the same
workspace. To support that, v1 uses a resolved workspace catalog namespace as
the durable catalog scope.

## 2. Context

Agentic Router v1 is a Deno TypeScript MCP server with local Streamable HTTP as
the primary Codex connection mode and stdio as a fallback. The MCP
initialization lifecycle defines when the server is ready to accept catalog
tool calls.

For HTTP, the MCP Streamable HTTP transport provides a reusable
`Mcp-Session-Id` header for protocol session routing. For stdio, MCP provides
initialize metadata such as `protocolVersion`, capabilities, and `clientInfo`,
followed by the `notifications/initialized` readiness notification.

Existing feature specs require catalog records to be isolated by session scope
and durable enough for later listing, matching, update, and removal. The use
cases describe the catalog as belonging to the current project or workspace.

## 3. Goals

- Define stable workspace catalog scoping for local HTTP and stdio v1.
- Preserve catalog records across reconnects for the same configured workspace
  namespace.
- Keep MCP initialization as the readiness boundary for catalog tools.
- Prevent accidental cross-workspace catalog mixing.
- Avoid treating MCP `clientInfo` as identity or access control.

## 4. Non-Goals

- Add user authentication.
- Add multi-user authorization.
- Choose a storage schema or database.
- Add a custom `create_session` tool.
- Define final catalog tool request and response schemas.

## 5. Proposed Design

Agentic Router v1 should use a workspace catalog namespace for durable catalog
ownership. The namespace defaults to the current workspace directory name and
can be overridden with `AGENTIC_ROUTER_CATALOG_NAMESPACE`.

After MCP initialization completes, the active request context combines:

- `connectionId`: a process-local identifier for the initialized MCP
  connection.
- `mcpSessionId`: HTTP transport session ID when running over Streamable HTTP.
- `catalogNamespace`: the configured stable workspace namespace.
- `clientInfo`: descriptive client metadata received during initialization.

Catalog records are stored and queried by `catalogNamespace`, not by
`clientInfo`. `clientInfo` may be recorded for diagnostics, but it must not be
used as authentication, authorization, or durable catalog identity.

Catalog tools must reject calls before MCP initialization completes. The server
must not silently create a global default namespace or an ephemeral namespace
for catalog operations.

All catalog operations that read or write records must filter by
`catalogNamespace`, including duplicate checks, list, detail, match, update,
remove, import, export, and health checks when those tools exist.

When the MCP server reconnects or restarts with the same namespace, it should
read the same durable catalog records. When the server starts with a different
namespace, it must not list, match, update, remove, or infer records from the
other namespace.

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

Creating a global default namespace when configuration is missing was
considered. It was not chosen because it can silently mix unrelated workspace
catalogs. The implemented default is derived from the workspace directory name,
which keeps client setup simple without using a shared global namespace.

## 7. Implementation Notes

Future code should expose a small session module that resolves the active
catalog scope for tool handlers. Tool handlers should call this module instead
of reading environment variables or initialization metadata directly.

The Deno run and serve tasks should grant environment access for
`AGENTIC_ROUTER_CATALOG_NAMESPACE` when env access is needed. The namespace
value is configuration, not a secret.

The namespace should be documented as workspace-specific, stable, and
user-chosen. A practical namespace value may be a short project slug or another
stable workspace identifier selected by the user.

Storage code should treat `catalogNamespace` as part of every catalog record's
ownership boundary. Duplicate detection must be namespace-local.

Setup/session errors caused by a missing namespace should be explicit enough
for the caller to fix MCP configuration without revealing records from any
other namespace.

## 8. Risks and Tradeoffs

- Misconfigured duplicate namespaces can mix catalogs across workspaces.
- The workspace-derived default reduces setup but can be wrong if the server is
  launched from the wrong directory.
- Explicit namespace override remains available for stable multi-workspace
  setups.
- The v1 namespace is not authentication; future multi-user deployments need a
  stronger identity and authorization model.

## 9. Verification Plan

When this tech spec is implemented as code, verification should include:

- Missing `AGENTIC_ROUTER_CATALOG_NAMESPACE` falls back to the workspace
  directory name.
- Catalog calls before MCP initialization fail.
- Reconnecting with the same namespace can read prior durable records.
- Different namespaces cannot list, match, update, remove, or infer each
  other's records.
- Changing `clientInfo` does not change catalog scope when the namespace is
  unchanged.

For this documentation change, verification is limited to reading back the
spec, checking the docs tree, running `git diff --check`, and checking git
status.

## 10. Open Questions

- Should namespace format be free-form or restricted later?
- Should future import/export include the namespace or require an explicit
  target namespace?
- Should a diagnostics tool report the active namespace without exposing
  catalog data?

## 11. Decision Log

- 2026-07-12: Preserve catalog entries across MCP reconnects and restarts for
  the same workspace.
- 2026-07-12: Use `AGENTIC_ROUTER_CATALOG_NAMESPACE` as the durable v1 catalog
  scope for stdio.
- 2026-07-12: Fail catalog tools when the namespace is missing instead of using
  a global or ephemeral scope.
- 2026-07-12: Keep MCP initialization as the readiness boundary for catalog
  tools.
- 2026-07-12: Treat `clientInfo` as descriptive metadata only, not identity or
  access control.
- 2026-07-13: Use local Streamable HTTP sessions for HTTP routing while keeping
  durable catalog scope independent from the protocol session ID.
- 2026-07-13: Default namespace to the workspace directory name and keep
  `AGENTIC_ROUTER_CATALOG_NAMESPACE` as a server-side override.
