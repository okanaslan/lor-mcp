# MCP Server Runtime And Project Structure

## 1. Summary

Draft. This tech spec defines the v1 runtime and project structure for Local
Orchestration Router (LOR) as a Deno TypeScript MCP server that runs over local
Streamable HTTP, with stdio retained as a compatibility and development
fallback.

The goal is to establish the implementation shape without deciding
authentication, deployment automation, or catalog expansion beyond the v1 tool
set.

## 2. Context

The repository is currently documentation-only for Local Orchestration Router
(LOR). Feature specs already define the intended MCP initialization behavior and
catalog features for introducing, listing, matching, updating, and removing
agents and skills.

The first implementation needs a clear runtime boundary so later technical specs
can focus on storage, session identity, matching, and tool contracts. The chosen
runtime is Deno with TypeScript. The primary local transport is Streamable HTTP
so Codex can connect to an already-running server by URL only. Stdio remains
available for direct development and compatibility.

The current MCP TypeScript SDK examples are Node-oriented, but Deno supports npm
package imports. The implementation should therefore be Deno-first while using
the current MCP TypeScript server package through Deno npm compatibility.

## 3. Goals

- Establish a Deno TypeScript project structure for the MCP server.
- Define the local HTTP executable entrypoint for Codex MCP usage.
- Keep the stdio executable entrypoint as a fallback.
- Keep server startup separate from MCP tool registration.
- Keep catalog domain logic independent from MCP transport code.
- Define expected Deno tasks for run, check, test, lint, and format.
- Keep runtime permissions explicit and minimal.

## 4. Non-Goals

- Choose a durable storage implementation.
- Define all catalog MCP tool request and response schemas.
- Add authentication or authorization.
- Add launch agents, daemon managers, or deployment configuration.
- Add application code in this spec.

## 5. Proposed Design

Local Orchestration Router (LOR) should be implemented as a Deno-first
TypeScript project with a single `deno.json` configuration file. `deno.json`
owns tasks, import aliases, compiler options, lint settings, and format
settings.

The initial source layout should separate runtime startup, MCP server assembly,
tool registration, session helpers, and catalog domain logic:

- `src/main.ts`: stdio executable entrypoint.
- `src/http_main.ts`: local Streamable HTTP executable entrypoint.
- `src/http_server.ts`: web-standard HTTP MCP request/session handler.
- `src/server.ts`: creates and configures the MCP server instance.
- `src/tools/`: MCP tool registration modules.
- `src/catalog/`: catalog domain logic independent from MCP transport.
- `src/skills/`: local skill file sync helpers that are isolated from MCP
  transport code.
- `test/`: root-level Deno tests mirroring the source tree.
- `test/helpers/`: shared fixtures and setup utilities for tests.

The HTTP entrypoint should start `Deno.serve` on `127.0.0.1:8765` by default and
expose MCP at `/mcp`. It should use the MCP TypeScript SDK
`WebStandardStreamableHTTPServerTransport` and in-memory session routing keyed
by `Mcp-Session-Id`. The stdio entrypoint should continue to create the server,
connect it to stdio, and report fatal startup failures to stderr. Neither
entrypoint should contain catalog matching, storage, or tool-specific business
logic.

Server configuration should have local storage, local skill roots, and transport
defaults so Codex client configuration only needs the HTTP URL. Environment
variables remain server-side overrides for storage, skill roots, host, port, and
logging. Catalog workspace scope must come from the client-supplied `workspace`
tool input, and introduction tools register supplied agent or skill metadata
directly without requiring server-side pre-registration files.

Local development may load server-side overrides from an ignored `.env` file
using Deno's task-level `--env-file` flag, for example
`deno task --env-file=.env serve`. The repository should track `.env.example`
with safe local defaults and keep developer-specific `.env` files out of git.

Runtime logging should use Pino with leveled logs. Local console logs should be
human-readable by default, with JSON available through `LOR_LOG_FORMAT=json`.
All logs must go to stderr so stdout remains reserved for stdio MCP protocol
messages. Logging should cover startup, HTTP request/session lifecycle, and MCP
tool calls while avoiding raw request bodies, response bodies, prompts, and
catalog payloads.

Future HTTP authorization discovery is tracked separately in
[Future HTTP Authorization Discovery](../future/http-authorization-discovery.md).
The current local runtime should not add OAuth or OpenID Connect discovery
endpoints until real authorization is implemented.

MCP tools should use Zod schemas for input validation. Tool modules should adapt
MCP requests into catalog/session domain calls and return MCP-compatible
responses. Domain modules should avoid importing transport-specific APIs unless
a later spec explicitly changes that boundary.

## 6. Alternatives Considered

Node TypeScript was considered because the MCP TypeScript SDK examples and
quickstarts are Node-oriented. It was not chosen because the v1 project should
be Deno-first.

Go was considered for a compiled binary and strong service ergonomics. It was
not chosen because the current MCP TypeScript server package and Zod validation
provide a more direct path for the first MCP implementation.

Launch agent or daemon management was considered. It was not chosen for this
step because manual `deno task serve` keeps the first HTTP workflow simple while
still allowing Codex to connect by URL only.

## 7. Implementation Notes

The initial `deno.json` should include tasks equivalent to:

- `serve`: run `src/http_main.ts` with explicit local HTTP, filesystem, env, and
  SQLite permissions.
- `run`: run `src/main.ts` with explicit permissions for stdio fallback.
- `check`: type-check both runtime entrypoints, including npm package types.
- `test`: run Deno tests from the root `test/` tree.
- `lint`: run Deno lint.
- `fmt`: check formatting or format files, depending on the task convention
  chosen during implementation.

Runtime permissions should stay explicit. The HTTP serve task should bind only
to local loopback by default and should not expose a public network listener.
Storage permissions should cover the configured local database. Env permissions
should include logging overrides such as `LOR_LOG_LEVEL` and `LOR_LOG_FORMAT`
and local skill sync overrides such as `LOR_SKILL_ROOTS`.

Local skill sync should resolve `SKILL.md` files only from server-owned skill
roots. The default roots are `.temp/skills`, `~/.codex/skills`, and
`~/.agents/skills`; `LOR_SKILL_ROOTS` may override those roots with a
comma-separated list. Tool input must not include local file paths.

Source files should use import aliases from `deno.json` instead of direct npm
specifier strings scattered through the codebase. The MCP SDK and Zod imports
should be centralized through those aliases.

The first code scaffold must verify that the selected MCP TypeScript server
package works through Deno npm compatibility before building catalog features on
top of it.

## 8. Risks and Tradeoffs

- Deno npm compatibility may expose MCP SDK edge cases that are not visible in
  Node-oriented examples.
- Local HTTP adds a manual server process but greatly reduces Codex client
  configuration.
- Stdio fallback keeps direct local debugging available.
- Deno-first tooling avoids Node package boilerplate but may require extra care
  when following MCP SDK examples.
- Keeping domain logic transport-independent adds a small structure cost but
  should make future HTTP support easier.

## 9. Verification Plan

When this tech spec is implemented as code, verification should include:

- Deno task discovery through `deno task`.
- Type checking with the configured check task.
- Deno tests for any domain modules added in the implementation.
- An HTTP smoke check that initializes a Streamable HTTP session and lists MCP
  tools through `/mcp`.
- A stdio smoke check that starts the MCP server without catalog tools failing
  during registration.
- A permission review confirming the run task does not grant unnecessary
  filesystem, network, or environment access.

For this documentation change, verification is limited to reading back the spec,
checking the docs tree, running `git diff --check`, and checking git status.

## 10. Open Questions

- Should a later release add launch agent or daemon management for always-on
  startup?
- Should the format task check formatting only or rewrite formatting?
- Should the first scaffold include a minimal diagnostic tool, or wait until
  catalog tools are implemented?

## 11. Decision Log

- 2026-07-12: Use Deno with TypeScript as the v1 runtime.
- 2026-07-12: Initially selected stdio as the only v1 MCP transport.
- 2026-07-12: Use a Deno-first `deno.json` for tasks and import aliases.
- 2026-07-12: Use the current MCP TypeScript server package through Deno npm
  compatibility.
- 2026-07-12: Use Zod schemas for MCP tool input validation.
- 2026-07-12: Defer storage, matching, exact tool schemas, authentication, and
  deployment to separate specs.
- 2026-07-13: Add manual local Streamable HTTP as the primary Codex connection
  mode and keep stdio as a fallback.
- 2026-07-13: Use server-owned local transport and storage defaults so Codex
  client configuration only needs the MCP URL.
- 2026-07-13: Keep catalog workspace scope in client-supplied tool input instead
  of server configuration.
- 2026-07-19: Add server-owned local skill roots for approval-gated local
  `SKILL.md` sync.
- 2026-07-19: Track future HTTP OAuth/OIDC discovery separately and keep the
  current local runtime unauthenticated.
