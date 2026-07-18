# Skill / Agent Existence Verification

## 1. Summary

Implemented for v1 metadata-only catalog health reporting. This feature defines
how Local Orchestration Router (LOR) reports stored verification metadata for
introduced Codex agents and Codex skills after they have already been registered
in the workspace catalog.

## 2. Goals

- Reduce stale or invalid catalog entries.
- Report introduced agent and skill health from stored verification metadata.
- Keep health reporting separate from normal introduction.

## 3. Non-Goals

- Create missing agents or skills.
- Install missing skills.
- Repair invalid Codex sessions.
- Probe external Codex sessions, skill roots, filesystems, registries, or remote
  APIs in v1.
- Update stored verification metadata during health checks.

## 4. Functional Requirements

- The server must expose `check_catalog_health`.
- The server must report catalog health scoped to the requested workspace.
- The caller may filter health by entry type, project name, or one entry key
  when an entry type is provided.
- Verification must produce a clear verified, unverified, or unknown result.
- V1 health must derive those results from stored verification metadata only.
- Introduction features must not require health evidence before accepting
  entries in v1.
- Health checks must not mutate stored verification metadata.
- Health reporting must not expose entries from other workspaces.

## 5. User Stories / Use Cases

The initial use case is that a user asks whether the current workspace catalog
contains entries marked unverified or unknown before relying on recommendations.

## 6. Data Model

Conceptual `VerificationResult` fields:

- `entryType`: identifies `agent` or `skill`.
- `entryKey`: identifies the checked entry.
- `status`: identifies `verified`, `unverified`, or `unknown`.
- `source`: names the verification source.
- `checkedAt`: records when verification ran.
- `issues`: lists metadata-derived health warnings.

## 7. Error Handling

- Missing entry type or identifier must return a validation error.
- Missing or invalid MCP readiness context must return a session error.
- Missing workspace must return a validation error.
- `entryKey` without `entryType` must return a validation error.
- Storage failures must return a storage error.

## 8. Security and Permissions

- Verification must not disclose unrelated workspace data or hidden catalog
  entries.
- V1 health uses stored metadata only, so it must not inspect or expose local
  filesystem paths.

## 9. Open Questions

- What future source should report Codex session health?
- Should future skill health inspect local user skills, repo-vendored skills, or
  both?
- Should a future explicit refresh tool update stored verification metadata?

## 10. Decision Log

- 2026-07-11: Treat verification as a separate feature from introduction.
- 2026-07-11: Support verified, unverified, and unknown outcomes.
- 2026-07-13: Keep v1 introduction non-blocking; future health reporting must
  not be required for registration.
- 2026-07-17: Implement v1 as read-only `check_catalog_health` reporting from
  stored verification metadata only.
