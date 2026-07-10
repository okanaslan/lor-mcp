# Skill / Agent Existence Verification

## 1. Summary

Draft. This feature defines how Agentic Router verifies that an introduced
Codex agent or Codex skill exists before accepting or recommending it.

## 2. Goals

- Reduce stale or invalid catalog entries.
- Verify introduced agents and skills through defined evidence sources.
- Keep verification behavior consistent for introduction and later routing.

## 3. Non-Goals

- Create missing agents or skills.
- Install missing skills.
- Repair invalid Codex sessions.
- Choose final storage technology for verification results.

## 4. Functional Requirements

- The server must define verification sources for agents and skills.
- Agent verification must check whether the Codex session ID can be recognized
  by an approved source.
- Skill verification must check whether the skill name can be recognized by an
  approved skill inventory source.
- Verification must produce a clear verified, unverified, or unknown result.
- Introduction features may use verification before accepting entries once the
  verification source is available.
- Matching and routing features may use verification status to avoid
  recommending invalid entries.
- Verification failures must not expose entries or filesystem paths from other
  sessions.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user introduces a
skill or agent and Agentic Router confirms it refers to something available
before storing or recommending it.

## 6. Data Model

Conceptual `VerificationResult` fields:

- `entryType`: identifies `agent` or `skill`.
- `entryKey`: identifies the checked entry.
- `status`: identifies `verified`, `unverified`, or `unknown`.
- `source`: names the verification source.
- `checkedAt`: records when verification ran.

## 7. Error Handling

- Missing entry type or identifier must return a validation error.
- Missing or invalid initialized MCP session context must return a session
  error.
- Unavailable verification sources must return an unknown result.
- Verification source failures must not be reported as successful verification.

## 8. Security and Permissions

- Verification must not disclose private filesystem paths, unrelated session
  data, or hidden catalog entries.
- Verification sources must be limited to approved local or configured sources.

## 9. Open Questions

- What source verifies Codex session IDs?
- Should skill verification use local `.codex/skills`, repo-vendored skills, or
  both?
- Should introduction reject unverified entries or store them with unknown
  status?

## 10. Decision Log

- 2026-07-11: Treat verification as a separate feature from introduction.
- 2026-07-11: Support verified, unverified, and unknown outcomes.
