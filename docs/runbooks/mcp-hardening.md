# MCP Hardening And Recovery

## Compatibility And Trust

The candidate keeps the locked MCP SDK 1.x and session-based Streamable HTTP,
tested with protocol `2025-06-18`. Do not claim July 2026 protocol compatibility
or the draft Skills Extension. Both stdio and HTTP register the same tools and
resources. Actual desktop client acceptance is a separate release check.

The shipped server is a **trusted local, single-operator application**, not a
remote multi-tenant service. HTTP binds only to loopback and rejects non-local
hosts and cross-origin browser requests. Other local processes can still reach
the port; an Origin check is not identity authentication. Do not expose it via a
reverse proxy or tunnel. A remote deployment needs authenticated identity and
per-principal authorization before it is supported.

`LOR_ALLOWED_WORKSPACES` is host-owned policy, defaulting to server cwd. Supply
canonical identifiers, not caller-controlled aliases; aliases are resolved
without creating them during authorization. Both sync endpoints are checked.
Alias creation/reassignment needs its own flag and both identifiers allowed.
Global reads default on; global writes, alias administration and local file sync
default off. New registrations still default to global scope, so clients should
send explicit scope. Prompt generation and bundled default reads use no private
catalog state. Custom in-process runtime factories are trusted integration code
and must supply their own authorization hook; tool arguments cannot select one.

## Client Contract Changes

- Unknown input fields, malformed nested metadata and oversized values fail
  validation. Imports accept at most 128 entries per request.
- Lists and exports default to 20 entries, maximum 100. Follow `nextCursor` with
  identical filters and limit until absent. Cursors bind the snapshot and
  filters; catalog changes invalidate them. Each exported page is independently
  importable; a single page is not a complete backup. Pause catalog writes for a
  consistent multi-page export. SQLite queries currently materialize candidates
  before paging, so response bounds are not a database-scale optimization.
- Lists/matches return summaries. Fetch full context through detail tools.
  `outputNeed` alone cannot establish a relevant match. Query `requiredAll` and
  `requiredAny` are eligibility constraints, not score boosts.
- Updates/deletes require `expectedRevision` from a detail read. Reconcile on
  conflict. Omitted fields stay unchanged; arrays/routing objects replace;
  explicit null clears only nullable fields.
- Sync apply requires the reviewed `previewDigest`. Proposals bind exact stored
  content, source revision, originating workspace and a 24-hour expiry. Legacy
  unbound proposals cannot be applied; recreate and review them.
- Bundled defaults are independent of catalog rows: `lor://skills/index.json`,
  or `list_default_skills` / `get_default_skill` for tool-only clients.

## Upgrade Procedure

1. Stop all writers and the old server. Record its build and trusted env
   settings.
2. Make an owner-readable SQLite backup while the server is stopped. Preserve
   the database and any remaining WAL/SHM files together, or use SQLite's backup
   API. A paginated catalog export omits proposals, receipts and usage counters
   and is not a full operational backup.
3. Test the candidate against a **copy** of the database and an isolated skill
   root. Initialization atomically applies additive schema 13: proposal bindings
   and operation receipts. A newer unknown schema is rejected before migration.
4. Configure canonical workspaces and least-privilege flags explicitly. Keep the
   server local. Do not reuse a broad publisher configuration for an untrusted
   client. Refresh tools after reconnecting so clients see the new schemas.
5. Run `deno task check`, `deno task lint`, `deno task fmt`, `deno task test`
   and the opt-in subprocess check `deno task test:stdio`, then verify the
   actual supported desktop clients can initialize, list tools, load defaults,
   page lists and handle a rejected write. Confirm a workspace-scoped write and
   read-back on test data.
6. Start the candidate with the real database only after accepting those checks.
   Do not run old and new binaries concurrently against the same database.

## Unknown Write Outcomes

Use one `idempotencyKey` for one logical write on tools that expose it. Receipts
are durable across sessions/restarts and scoped to workspace. Reusing a key with
different input is an error. A completed request can be replayed identically to
retrieve its original result, not the target's latest state. Read the target
separately to inspect subsequent changes.

The receipt is reserved before mutation and completed afterwards. These are not
one atomic transaction. A crash can leave a **pending** receipt even when the
mutation happened. `get_operation` reports status without disclosing the stored
result. Inspect the target and logs; never switch to a fresh key merely to
bypass pending status. An operator must reconcile the actual outcome before
authorizing another logical operation. No automatic pending-receipt expiry
exists.

Multi-entry import/sync is not atomic; earlier entries may have been saved
before failure. Re-preview and inspect actual entries. Never infer that failure
means zero writes. Cancellation before dispatch prevents mutation; cancellation
after dispatch does not promise rollback. Read back before retrying.

Receipts contain original results and may duplicate catalog/note content.
Protect the database like the registry itself. No automatic retention deletion
is enabled: deleting receipts can allow old retries to execute again. Establish
a retry horizon and archive/cleanup policy with operators before pruning
completed receipts; never prune unresolved pending receipts as routine cleanup.

## Filesystem Recovery

The package installer validates manifest paths, file hashes, file count, 1 MiB
per-file and 4 MiB package limits. It stages files, refuses locally modified or
unmanaged destinations, and does not execute bundled scripts. Checksums
establish integrity, not publisher trust. Verify the source before installation.

Managed context sync accepts only existing regular SKILL.md files under
configured roots. It rejects symlink roots/directories/files, duplicate section
markers and files above 1 MiB. Apply binds destination, original text and
proposed content. It uses an exclusive local lock, a same-directory staged
replacement, a final change check, and a `.lor-context-backup-*.md` recovery
copy. The copy remains after success; inspect it before deleting. A lost
response requires reading the file or previewing again, not blindly reusing the
old digest.

For a stale lock, first verify that no installer/sync process is running.
Inspect the target, staged data and backups. Restore a selected backup only
after checking for later user edits. These locks coordinate LOR processes;
path-based APIs are not a sandbox against a hostile process that can
rename/write the same root. Use owner-controlled directories and avoid
concurrent manual edits. Whole-system power-loss durability of filesystem
replacements has not been proven.

## Monitoring And Resource Limits

Structured stderr logs include tool name, request ID, outcome/error code,
duration and selected identifiers; they omit raw prompt, note body and catalog
payloads. Workspace paths and entry names remain operational metadata, so
restrict log access. Do not use them as unbounded metric labels. Aggregate by
tool, status and error code for latency/error-rate monitoring; there is no
separate metrics HTTP endpoint. Watch access denials, revision/idempotency
conflicts, pending receipts, storage errors and sustained HTTP 503s. Expected
OAuth discovery 404s stay debug.

HTTP defaults: 64 sessions, 30-minute idle expiry, 4 MiB request body and a
15-second body-read timeout. Idle sessions are collected on incoming requests;
active tool calls are not evicted. Expired sessions return 404 and require a new
initialize. Over-capacity returns 503, oversized bodies 413, stalled bodies 408,
malformed JSON a parse error. Trusted embedders may override the limits through
`HttpMcpOptions`. These limits do not replace a remote authentication/rate-limit
gateway. Large diagnostic/detail responses remain bounded by stored content, not
a global response-byte cap.

## Rollback And Remaining Release Gates

If the candidate fails, stop writers and preserve the failed database for
diagnosis. Prefer fixing forward. To roll back the binary, restore the complete
pre-upgrade database snapshot and old trusted configuration together. This loses
post-backup writes; reconcile them before discarding the failed database. Do not
assume old code enforces new authorization, revisions or receipt semantics just
because schema changes are additive.

Automated SDK tests are not proof of desktop-client UX, production deployment,
remote multi-user authorization, or power-loss recovery. Complete those
applicable acceptance checks before release. No production database, registry or
client configuration is modified by this implementation's tests.
