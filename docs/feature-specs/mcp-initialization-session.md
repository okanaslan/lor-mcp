# MCP Initialization Session

## 1. Summary

Draft. This feature defines how Agentic Router uses the MCP initialization
lifecycle as the session boundary for catalog operations instead of adding a
custom `create_session` tool.

## 2. Goals

- Use the standard MCP initialization exchange to establish server readiness.
- Treat the initialized MCP session as the scope for catalog operations.
- Avoid introducing a custom session-creation tool for the initial product.
- Preserve client metadata from initialization for diagnostics and future
  routing context.

## 3. Non-Goals

- Define user authentication or account management.
- Add OAuth or external authorization flows.
- Persist catalog data across unrelated MCP sessions.
- Choose a concrete transport implementation.
- Replace MCP lifecycle behavior with custom protocol behavior.

## 4. Functional Requirements

- The server must participate in the MCP lifecycle initialization exchange.
- The server must receive an `initialize` request before accepting normal
  catalog operations.
- The server must return its protocol version, capabilities, and server
  implementation information in the initialize response.
- The server must wait for the client `initialized` notification before treating
  the connection as ready for catalog operations.
- The server must derive catalog session scope from the active initialized MCP
  session.
- Catalog tools must not require a separate `create_session` tool or explicit
  session identifier in their input.
- The server should record initialization `clientInfo` as descriptive metadata.
- The server must not treat `clientInfo` as authenticated user identity.
- For transports that support server-assigned MCP session IDs, the server should
  use the protocol session ID as the catalog session key.
- For transports without a reusable protocol session ID, the server must still
  keep catalog data scoped to the active initialized connection/session context.
- If an MCP session ends or is terminated, the server must stop accepting
  catalog operations for that session.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that an MCP host connects
to Agentic Router, completes initialization, and can then call catalog tools
without first creating an application-specific session.

## 6. Data Model

Conceptual `McpCatalogSession` fields:

- `sessionKey`: internal key derived from the active MCP session context.
- `protocolVersion`: negotiated MCP protocol version.
- `clientInfo`: descriptive client implementation metadata from initialization.
- `serverInfo`: Agentic Router server implementation metadata.
- `capabilities`: server capabilities returned during initialization.
- `initializedAt`: time the initialization exchange completed.
- `endedAt`: time the session ended, when known.

The feature spec does not require a specific storage engine, transport, or
database schema.

## 7. Error Handling

- Catalog operations before initialization completes must return a lifecycle
  error.
- Catalog operations after session termination must return a session error.
- Requests with missing or invalid protocol session context must return a
  session error.
- Initialization failures must prevent catalog operations from starting.

## 8. Security and Permissions

- MCP session IDs must not be treated as authentication by themselves.
- `clientInfo` must be treated as client-provided metadata, not proof of host,
  client, or user identity.
- Session keys must be generated or derived in a way that avoids predictable
  identifiers.
- Future remote or multi-user deployments may require authentication that binds
  catalog sessions to a user identity.

## 9. Open Questions

- Which MCP transport will the first implementation support?
- Should catalog records survive reconnects when a host creates a new MCP
  session?
- What exact server capabilities should Agentic Router advertise at
  initialization?

## 10. Decision Log

- 2026-07-10: Use MCP initialization lifecycle instead of a custom
  `create_session` tool.
- 2026-07-10: Initially scoped catalog operations to the active initialized MCP
  session.
- 2026-07-13: Use the workspace as the durable catalog scope
  while keeping MCP initialization as the readiness boundary.
- 2026-07-10: Treat `clientInfo` as descriptive metadata only.
- 2026-07-10: Defer user authentication and durable cross-session identity.
