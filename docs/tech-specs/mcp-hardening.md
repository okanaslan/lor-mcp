# MCP hardening implementation ledger

## Baseline

Base commit: `9121ba8`. Baseline: 221 tests pass on Deno 2.9.4. The server uses
the locked MCP SDK 1.x, stdio and session-based Streamable HTTP. Existing wire
tests request protocol version `2025-06-18`. The July 2026 specification is
design guidance, not a claim of implemented wire compatibility. Do not upgrade
protocol semantics without a separately tested client migration.

## Scope and sequence

Each numbered step has its own implementation commit. Run focused verification
after each step; commit discovered corrections separately when necessary. Do not
create empty fix commits when verification finds no defect.

1. Baseline and compatibility contract (this document).
2. Tool responsibilities, descriptions and behavioral annotations.
3. Strict bounded input and operation-specific output schemas.
4. Actionable execution errors and correlation identifiers.
5. Trusted workspace/global authorization and HTTP boundary controls.
6. Revision preconditions, retry-safe writes and content-bound proposals.
7. Bounded summary discovery and routing quality.
8. Local file preview binding, conflict detection and recovery.
9. Bundled context discovery and note-management skills.
10. Wire/client compatibility and failure-recovery tests.
11. Operational metrics and upgrade/recovery procedures.

## Verified gaps and existing guarantees

| Area             | Baseline evidence                                            | Action                                                |
| ---------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| Tool contract    | 33 catalog tools, shared output with unknown data            | Publish precise operation contracts                   |
| Input validation | Zod variants already validate import entries                 | Add strictness and bounds; retain variants            |
| Errors           | Execution errors already set isError                         | Improve correlation and recovery guidance             |
| Discovery        | Lists lack cursors; search includes full context             | Bound summaries and paginate                          |
| Access           | HTTP is unauthenticated; workspace selects storage           | Explicit trusted local policy; reject unsafe exposure |
| Writes           | SQLite transactions exist; no caller revision precondition   | Add conflict and retry guarantees                     |
| Proposals        | Stored content and target, no base revision or expiry        | Bind revision and lifetime                            |
| Files            | Installer has path/hash checks; context sync writes directly | Strengthen context sync and validate installer        |
| Skills           | lor-manage-skill already bundled                             | Extend defaults without overwriting custom files      |
| Tests            | 221 passing; SDK HTTP and resource tests exist               | Expand boundaries and recovery cases                  |

## Compatibility policy

Preserve existing tool names and successful result fields where practical.
Document deliberate breaking changes before enabling them. Explicit null clears
nullable fields, omitted fields are unchanged, and supplied arrays replace.
Access policy is trusted host configuration, never a model-supplied permission.
Tool annotations and confirm flags do not establish identity or human consent.
Unknown outcomes require read-back or an operation receipt, not blind replay.

## Verification record

- Baseline: `deno task test`: 221 passed, 0 failed.
- Steps 1-11 implemented on `codex/mcp-system-hardening`. After step 11: 241
  tests pass; typecheck, lint, formatting and whitespace checks pass.
- Final follow-up: `deno task test:stdio` passes with an actual server
  subprocess, including a disposable SQLite write and an unauthorized workspace
  rejection.
- The final recovery review corrected the pending-receipt test to use an
  identical payload hash and added rejection of reserved markers inside source
  skill context. The full suite remains at 241 passing tests.
- SDK tests exercise the real runtime through HTTP handlers: scope denial,
  revisions, pagination, receipt replay after reconnect, request cancellation,
  body limits and session expiry. They use disposable local databases.
- Added an explicit local-file/global-read permission correction and
  proposal-origin compatibility test as separate verification commits.
- The optional Python skill-authoring validator could not start because PyYAML
  is unavailable. Deno package tests verify bundled names, versions, file lists,
  hashes, resource reads and tool-only fallback reads.
- Actual desktop client acceptance and production deployment require a running
  candidate server; unit and SDK tests alone cannot establish those outcomes.

See [the upgrade and recovery runbook](../runbooks/mcp-hardening.md) for
deliberate contract changes, local-only trust assumptions and release gates.

## Implementation Commits

| Step | Commit    | Scope                                             |
| ---- | --------- | ------------------------------------------------- |
| 1    | `576aa07` | Baseline and compatibility contract               |
| 2    | `b8bbe89` | Tool responsibilities and annotations             |
| 3    | `17a96d7` | Bounded inputs and typed outputs                  |
| 4    | `2aad0af` | Actionable, correlated execution errors           |
| 5    | `5f28d62` | Workspace/global policy and local HTTP boundaries |
| 6    | `8d01810` | Revisions, receipts and proposal binding          |
| 7    | `2717641` | Summary pagination and routing evidence           |
| 8    | `20e5cfa` | Preview-bound, recoverable local file sync        |
| 9    | `1d45387` | Bundled defaults and tool-only reads              |
| 10   | `08105b0` | SDK boundary tests and cancellation               |
| 11   | `9b035ec` | HTTP limits, schema 13 and operational runbook    |

Separate verification commits: `0fa6588` and `a6596f5` enforce/test file-sync
access and proposal origin; `2b0c152` fixes reserved markers and pending-receipt
coverage; `4b713b3` adds the real stdio subprocess check.
