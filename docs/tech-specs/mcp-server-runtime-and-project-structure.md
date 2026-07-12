# MCP Server Runtime And Project Structure

## 1. Summary

Draft. This tech spec defines the v1 runtime and project structure for Agentic
Router as a Deno TypeScript MCP server that runs over stdio.

The goal is to establish the implementation shape before code is scaffolded,
without deciding storage, matching, authentication, deployment, or the final
catalog tool schemas.

## 2. Context

The repository is currently documentation-only for Agentic Router. Feature
specs already define the intended MCP initialization behavior and catalog
features for introducing, listing, matching, updating, and removing agents and
skills.

The first implementation needs a clear runtime boundary so later technical
specs can focus on storage, session identity, matching, and tool contracts. The
chosen runtime is Deno with TypeScript. The first transport is stdio because the
initial product targets local Codex MCP usage.

The current MCP TypeScript SDK examples are Node-oriented, but Deno supports
npm package imports. The implementation should therefore be Deno-first while
using the current MCP TypeScript server package through Deno npm
compatibility.

## 3. Goals

- Establish a Deno TypeScript project structure for the MCP server.
- Define the stdio executable entrypoint for local Codex MCP usage.
- Keep server startup separate from MCP tool registration.
- Keep catalog domain logic independent from MCP transport code.
- Define expected Deno tasks for run, check, test, lint, and format.
- Keep runtime permissions explicit and minimal.

## 4. Non-Goals

- Choose a durable storage implementation.
- Implement HTTP transport.
- Define all catalog MCP tool request and response schemas.
- Add authentication or authorization.
- Add deployment configuration.
- Add application code in this spec.

## 5. Proposed Design

Agentic Router should be implemented as a Deno-first TypeScript project with a
single `deno.json` configuration file. `deno.json` owns tasks, import aliases,
compiler options, lint settings, and format settings.

The initial source layout should separate runtime startup, MCP server assembly,
tool registration, session helpers, and catalog domain logic:

- `src/main.ts`: stdio executable entrypoint.
- `src/server.ts`: creates and configures the MCP server instance.
- `src/tools/`: MCP tool registration modules.
- `src/catalog/`: catalog domain logic independent from MCP transport.
- `src/session/`: initialized MCP session and catalog scope helpers.
- `*_test.ts`: tests colocated beside the code they verify.

The stdio entrypoint should be the only v1 runtime boundary. It should create
the server, connect it to stdio, and report fatal startup failures to stderr.
It should not contain catalog matching, storage, or tool-specific business
logic.

MCP tools should use Zod schemas for input validation. Tool modules should
adapt MCP requests into catalog/session domain calls and return MCP-compatible
responses. Domain modules should avoid importing transport-specific APIs unless
a later spec explicitly changes that boundary.

## 6. Alternatives Considered

Node TypeScript was considered because the MCP TypeScript SDK examples and
quickstarts are Node-oriented. It was not chosen because the v1 project should
be Deno-first.

Go was considered for a compiled binary and strong service ergonomics. It was
not chosen because the current MCP TypeScript server package and Zod validation
provide a more direct path for the first MCP implementation.

HTTP transport was considered for future remote use. It was not chosen for v1
because local Codex MCP usage is the first target, and HTTP would require
additional session, authentication, and deployment decisions.

## 7. Implementation Notes

The initial `deno.json` should include tasks equivalent to:

- `run`: run `src/main.ts` with explicit permissions.
- `check`: type-check the project, including npm package types.
- `test`: run Deno tests.
- `lint`: run Deno lint.
- `fmt`: check formatting or format files, depending on the task convention
  chosen during implementation.

Runtime permissions should start minimal. Before durable storage is selected,
the stdio server should not need broad filesystem, network, or environment
access. When local catalog storage is added, permissions should be narrowed to
the required read/write path.

Source files should use import aliases from `deno.json` instead of direct npm
specifier strings scattered through the codebase. The MCP SDK and Zod imports
should be centralized through those aliases.

The first code scaffold must verify that the selected MCP TypeScript server
package works through Deno npm compatibility before building catalog features
on top of it.

## 8. Risks and Tradeoffs

- Deno npm compatibility may expose MCP SDK edge cases that are not visible in
  Node-oriented examples.
- stdio-only keeps local setup simple but defers remote and hosted deployment
  concerns.
- Deno-first tooling avoids Node package boilerplate but may require extra care
  when following MCP SDK examples.
- Keeping domain logic transport-independent adds a small structure cost but
  should make future HTTP support easier.

## 9. Verification Plan

When this tech spec is implemented as code, verification should include:

- Deno task discovery through `deno task`.
- Type checking with the configured check task.
- Deno tests for any domain modules added in the implementation.
- A stdio smoke check that starts the MCP server without catalog tools failing
  during registration.
- A permission review confirming the run task does not grant unnecessary
  filesystem, network, or environment access.

For this documentation change, verification is limited to reading back the
spec, checking the docs tree, running `git diff --check`, and checking git
status.

## 10. Open Questions

- Which exact Deno permission set will the first runnable server need before
  storage exists?
- Should the format task check formatting only or rewrite formatting?
- Should the first scaffold include a minimal diagnostic tool, or wait until
  catalog tools are implemented?

## 11. Decision Log

- 2026-07-12: Use Deno with TypeScript as the v1 runtime.
- 2026-07-12: Use stdio as the only v1 MCP transport.
- 2026-07-12: Use a Deno-first `deno.json` for tasks and import aliases.
- 2026-07-12: Use the current MCP TypeScript server package through Deno npm
  compatibility.
- 2026-07-12: Use Zod schemas for MCP tool input validation.
- 2026-07-12: Defer storage, matching, exact tool schemas, authentication, and
  deployment to separate specs.
