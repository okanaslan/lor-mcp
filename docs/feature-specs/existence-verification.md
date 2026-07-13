# Skill / Agent Existence Verification

## 1. Summary

Deferred. This feature defines how Agentic Router may report whether an
introduced Codex agent or Codex skill appears usable after it has already been
registered in the workspace catalog.

## 2. Goals

- Reduce stale or invalid catalog entries.
- Check introduced agents and skills through defined health evidence sources.
- Keep health reporting separate from normal introduction.

## 3. Non-Goals

- Create missing agents or skills.
- Install missing skills.
- Repair invalid Codex sessions.
- Choose final storage technology for verification results.

## 4. Functional Requirements

- The server must define health evidence sources for agents and skills.
- Agent health checks may report whether the Codex session ID can be recognized
  by an approved source.
- Skill health checks may report whether the skill name can be recognized by an
  approved source.
- Verification must produce a clear verified, unverified, or unknown result.
- Introduction features must not require health evidence before accepting
  entries in v1.
- Matching and routing features may use verification status to avoid
  recommending invalid entries.
- Verification failures must not expose entries or filesystem paths from other
  sessions.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user introduces a
skill or agent and Agentic Router later reports whether it still appears
usable before recommending it.

## 6. Data Model

Conceptual `VerificationResult` fields:

- `entryType`: identifies `agent` or `skill`.
- `entryKey`: identifies the checked entry.
- `status`: identifies `verified`, `unverified`, or `unknown`.
- `source`: names the verification source.
- `checkedAt`: records when verification ran.

## 7. Error Handling

- Missing entry type or identifier must return a validation error.
- Missing or invalid MCP readiness context must return a session error.
- Unavailable verification sources must return an unknown result.
- Verification source failures must not be reported as successful verification.

## 8. Security and Permissions

- Verification must not disclose private filesystem paths, unrelated session
  data, or hidden catalog entries.
- Health evidence sources must be limited to approved local or configured
  sources.

## 9. Open Questions

- What source reports Codex session health?
- Should skill health reporting inspect local user skills, repo-vendored
  skills, or both?
- Should future health results update catalog verification metadata or only
  return transient report data?

## 10. Decision Log

- 2026-07-11: Treat verification as a separate feature from introduction.
- 2026-07-11: Support verified, unverified, and unknown outcomes.
- 2026-07-13: Keep v1 introduction non-blocking; future health reporting must
  not be required for registration.
