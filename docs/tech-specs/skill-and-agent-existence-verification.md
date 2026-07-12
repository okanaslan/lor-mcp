# Skill And Agent Existence Verification

## 1. Summary

Draft. This tech spec defines blocking v1 existence checks for introduced
Codex agents and Codex skills. Verification is internal to the existing
catalog flows and uses configured local sources instead of adding a standalone
MCP verification tool.

## 2. Context

Agentic Router v1 runs as a Deno TypeScript MCP server over stdio. Catalog
scope comes from `AGENTIC_ROUTER_CATALOG_NAMESPACE`, and durable storage uses
SQLite through `AGENTIC_ROUTER_DB_PATH`.

The v1 MCP tool surface includes introduction, listing, detail lookup, and
matching tools. It intentionally excludes a standalone verification or catalog
health tool. Existence verification should therefore run inside the catalog
domain layer before accepted records are stored or recommended.

Feature specs require introduced agents and skills to already exist. The
technical design needs explicit local evidence sources so Agentic Router can
reject invalid entries without querying remote Codex APIs.

## 3. Goals

- Prevent invalid Codex agents and skills from entering the catalog.
- Keep existence checks deterministic, local, and testable.
- Store verification metadata with accepted catalog records.
- Keep verification behavior namespace-safe and free from cross-session data
  leakage.
- Provide a reusable verifier module for future health, import, and update
  workflows.

## 4. Non-Goals

- Add a standalone verification MCP tool.
- Add a catalog health MCP tool.
- Install missing skills.
- Create missing Codex agents.
- Repair invalid Codex sessions.
- Query remote Codex or OpenAI APIs.
- Define a complete catalog health report.

## 5. Proposed Design

V1 should use strict local verification for both introduced agents and
introduced skills. `introduce_agent` and `introduce_skill` must verify the
target before writing to durable storage. If verification cannot prove the
target exists, the introduction must fail.

Agent verification uses `AGENTIC_ROUTER_AGENT_REGISTRY_PATH`, which points to a
local JSON file. The registry contains valid Codex session IDs:

```json
{
  "agents": [
    {
      "codexSessionId": "example-session-id"
    }
  ]
}
```

The verifier only requires `codexSessionId`. Extra descriptive fields in the
registry may be ignored.

Skill verification uses `AGENTIC_ROUTER_SKILL_ROOTS`, an OS path-delimited
list of local skill root directories. A skill exists when at least one
configured root contains `<skillName>/SKILL.md`. Skill folders whose names
start with `_` are private or template folders and must not be accepted as
introducible skills.

Accepted agent and skill records should store verification metadata:

- `verificationStatus`: `verified`, `unverified`, or `unknown`.
- `verificationSource`: `agent_registry_json` or `skill_roots`.
- `verifiedAt`: records when verification succeeded.
- `verificationMessage`: optional concise diagnostic text.

For v1, all accepted entries should be stored with
`verificationStatus: verified`. The additional statuses exist so future health
and import/update workflows can represent stale, unchecked, or migrated records
without changing the record shape.

`list_catalog_entries`, `get_catalog_entry_detail`, and
`find_matching_catalog_entry` should return stored verification metadata where
it is useful to callers. Matching must only recommend verified entries in v1.

Verification errors should use the existing structured MCP response envelope.
Missing verifier configuration or unreadable verifier sources should return
`setup_error`. A valid verifier source that does not contain the requested
agent or skill should return `verification_failed`.

Verification must not expose absolute registry paths, skill root paths,
entries from other namespaces, or hidden catalog data in tool errors,
recommendation explanations, or text responses.

## 6. Alternatives Considered

Adding a standalone verification MCP tool was considered. It was not chosen
because the v1 tool surface intentionally keeps verification and health checks
out of the public MCP surface.

Accepting unverified entries with `unknown` status was considered. It was not
chosen for v1 because strict introduction keeps the catalog reliable before
matching and handoff workflows depend on it.

Using only the repo-vendored `.temp/skills` inventory was considered. It was
not chosen because the running MCP server should verify the user's configured
Codex skill roots, not only this repository's reference skill library.

Querying a remote Codex or OpenAI API for agent existence was considered. It
was not chosen because v1 is designed around deterministic local configuration
and does not depend on remote service access.

## 7. Implementation Notes

Verifier logic should live behind a small catalog or domain interface. MCP tool
handlers should call catalog services and should not directly read registry
files, scan skill roots, or parse verifier configuration.

The agent registry should be parsed as JSON and validated enough to reject
malformed files as setup errors. The verifier should compare the requested
`codexSessionId` against the registry's `agents[*].codexSessionId` values.

The skill verifier should split `AGENTIC_ROUTER_SKILL_ROOTS` using the
platform path delimiter. It should check for `SKILL.md` under each candidate
skill folder and avoid leaking which absolute root was checked.

Deno run permissions should include env access for:

- `AGENTIC_ROUTER_AGENT_REGISTRY_PATH`
- `AGENTIC_ROUTER_SKILL_ROOTS`

Deno read permissions should be limited to the configured agent registry file
and configured skill root paths.

Future import and update flows should reuse the same verifier before writing
new or changed references. Future catalog health flows can reuse the verifier
to refresh stored verification metadata and report stale records.

## 8. Risks and Tradeoffs

- The agent registry becomes a manually maintained source of truth.
- Skill root configuration can drift from the actual Codex runtime inventory.
- Strict verification improves catalog quality but adds setup requirements.
- Local filesystem verification is deterministic but does not prove a target
  agent session is currently active or reachable.
- Returning verification metadata helps callers reason about entries but adds
  fields that future migrations must preserve.

## 9. Verification Plan

When this tech spec is implemented as code, verification should include:

- Missing `AGENTIC_ROUTER_AGENT_REGISTRY_PATH` blocks `introduce_agent`.
- Unreadable or malformed agent registry returns `setup_error`.
- Unknown Codex session ID is rejected with `verification_failed`.
- Known Codex session ID is accepted and stored as verified.
- Missing `AGENTIC_ROUTER_SKILL_ROOTS` blocks `introduce_skill`.
- Skill name with a matching `SKILL.md` is accepted and stored as verified.
- Missing skill is rejected with `verification_failed`.
- Private or template skill folder names starting with `_` are rejected.
- List and detail responses expose stored verification metadata without
  leaking local filesystem paths.
- Matching excludes unverified or unknown entries.
- Verification failures do not reveal entries or data from other catalog
  namespaces.

For this documentation change, verification is limited to reading back the
spec, checking the docs tree, running `git diff --check`, and checking git
status.

## 10. Open Questions

- Should future catalog health refresh stored `verificationStatus` values
  automatically, or only report them?
- Should future imports fail the entire batch on one verification failure or
  allow partial import with rejected-entry reporting?
- Should the agent registry eventually include optional reachability or
  handoff metadata beyond `codexSessionId`?

## 11. Decision Log

- 2026-07-12: Keep verification internal and do not add a v1 verification MCP
  tool.
- 2026-07-12: Require `AGENTIC_ROUTER_AGENT_REGISTRY_PATH` for Codex agent
  verification.
- 2026-07-12: Use a local JSON agent registry with `agents[*].codexSessionId`.
- 2026-07-12: Require `AGENTIC_ROUTER_SKILL_ROOTS` for Codex skill
  verification.
- 2026-07-12: Verify skills by checking for `<skillRoot>/<skillName>/SKILL.md`.
- 2026-07-12: Reject unverified agents and skills during introduction.
- 2026-07-12: Store verification metadata on accepted catalog records.
