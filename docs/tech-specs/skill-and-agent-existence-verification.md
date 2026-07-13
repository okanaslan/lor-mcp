# Skill And Agent Existence Verification

## 1. Summary

Draft. This tech spec records the v1 decision not to block agent or skill
introduction on local existence verification. Introduction is the registration
step for Agentic Router.

## 2. Context

Agentic Router v1 runs as a Deno TypeScript MCP server over local Streamable
HTTP, with stdio retained as a fallback. Users and agents connect through MCP
and should not need filesystem access to the server's local state in order to
introduce a catalog entry.

Earlier drafts required `introduce_agent` and `introduce_skill` to prove the
target already existed in server-local registry files or skill roots. That
creates a circular setup problem: users must manually pre-register the same
thing they are trying to introduce.

## 3. Goals

- Let `introduce_agent` register a supplied Codex session ID directly.
- Let `introduce_skill` register a supplied skill name directly.
- Keep introduction deterministic, local, and durable.
- Preserve verification metadata fields for future health workflows.
- Avoid requiring users to edit server-local registry files.

## 4. Non-Goals

- Prove that a Codex session is currently active.
- Prove that a skill folder exists on disk during introduction.
- Add a standalone verification MCP tool.
- Install missing skills.
- Create missing Codex agents.
- Query remote Codex or OpenAI APIs.

## 5. Proposed Design

V1 introduction tools should validate request shape and store the submitted
metadata. They should not read an agent registry file, scan skill roots, or
reject entries because server-local evidence is missing.

Accepted agent and skill records should keep the existing verification metadata
shape for compatibility:

- `verificationStatus`: `verified`
- `verificationSource`: `mcp_introduction`
- `verifiedAt`: timestamp of the accepted introduction

For v1, `verified` means the entry was accepted through an explicit MCP
introduction request, not that the server independently proved external
existence.

Future health or verification workflows may re-check catalog entries and update
or report verification metadata. Those workflows must be separate from
introduction and must not make normal registration depend on editing
server-local files.

## 6. Alternatives Considered

Blocking introduction on an agent registry file was considered. It was rejected
because normal users and agents should not need access to server-local files
before they can introduce a new agent.

Blocking skill introduction on configured skill roots was considered. It was
rejected for the same reason: introduction should capture routing metadata,
while later health checks can report missing local assets.

Accepting entries with `verificationStatus: unverified` was considered. It was
not chosen for v1 because the current matching flow only routes accepted
entries, and introduction itself is the user's explicit registration action.

## 7. Implementation Notes

`CatalogService.introduceAgent` and `CatalogService.introduceSkill` should call
the existing validation functions, attach `mcp_introduction` verification
metadata, and write through the repository.

The runtime config should not require:

- `AGENTIC_ROUTER_AGENT_REGISTRY_PATH`
- `AGENTIC_ROUTER_SKILL_ROOTS`

The local `.agentic-router/` directory remains the default SQLite catalog data
directory, not an introduction pre-registration directory.

## 8. Risks and Tradeoffs

- Invalid or stale agent/session IDs can be introduced.
- Missing or misspelled skill names can be introduced.
- The catalog becomes easier to populate, but correctness depends on user or
  agent-provided metadata until future health checks exist.
- Future verification must be additive and non-blocking unless the user
  explicitly opts into strict policy.

## 9. Verification Plan

When this tech spec is implemented as code, verification should include:

- `introduce_agent` accepts a valid request without an agent registry file.
- `introduce_skill` accepts a valid request without a matching skill folder.
- Introduced agents and skills are stored with
  `verificationSource:
  mcp_introduction`.
- Missing required fields still return validation errors.
- Duplicate checks remain namespace-local.
- Matching can recommend introduced entries.
- Runtime startup does not require agent registry or skill root env vars.

## 10. Open Questions

- Should a future health tool mark missing entries as `unverified` or only
  report health status without changing catalog records?
- Should projects be able to opt into strict verification for private
  deployments?

## 11. Decision Log

- 2026-07-12: Earlier drafts required strict local existence verification for
  agent and skill introduction.
- 2026-07-13: Remove blocking local existence verification from both
  `introduce_agent` and `introduce_skill`; introduction is the registration
  step.
- 2026-07-13: Keep verification metadata fields and use
  `verificationSource: mcp_introduction` for accepted introductions.
