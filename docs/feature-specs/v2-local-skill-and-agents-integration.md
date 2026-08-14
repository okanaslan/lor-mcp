# V2 Local Skill And AGENTS.md Integration

## 1. Summary

Planned for V2. This feature clarifies how LOR should work with local Codex
skills and local `AGENTS.md` instructions. The goal is a clean division between
filesystem-based Codex guidance and LOR's workspace catalog metadata.

## 2. Goals

- Distinguish local Codex skills from LOR-registered skill metadata.
- Explain when LOR should recommend a local skill.
- Explain when LOR should suggest registering or improving a skill.
- Decide whether LOR should update, generate, or only reference local
  `AGENTS.md`.
- Reduce duplicated guidance between LOR and local instruction files.

## 3. Non-Goals

- Delete local `AGENTS.md` automatically.
- Rewrite local skills without explicit approval.
- Treat LOR metadata as a replacement for skill files.
- Store secrets or private local instruction content in LOR.

## 4. Functional Requirements

- V2 documentation must define local skill versus LOR skill:
  - local skill: filesystem instruction package available to Codex.
  - LOR skill: catalog metadata that helps route, explain, and initialize work.
- LOR must be able to report when a relevant local skill is not registered.
- LOR must be able to report when a registered LOR skill has no matching local
  skill file.
- LOR should recommend registration or metadata improvement when coverage is
  weak.
- Any local file writes must remain previewed and approval-gated.
- V2 must decide whether `AGENTS.md` is:
  - manually maintained only
  - generated from LOR recommendations
  - augmented with a LOR-managed section
  - reduced because LOR carries more workspace guidance

## 5. User Stories / Use Cases

Optional. The main use case is a new Codex agent asking which local instructions
and skills it should use before starting work.

## 6. Data Model

No mandatory new data model is required in the first pass. Later implementations
may add local inventory snapshots or AGENTS.md sync proposals.

## 7. Error Handling

- Missing local skill files should produce actionable guidance, not vague
  failures.
- Missing `AGENTS.md` should produce setup guidance.
- File inspection failures must not expose private paths beyond safe workspace
  context.

## 8. Security and Permissions

- LOR must not write local files without explicit preview and confirmation.
- LOR must not store full local instruction files unless a later feature
  explicitly defines that behavior.

## 9. Open Questions

- Should LOR manage a section inside `AGENTS.md`, similar to local skill sync?
- Should local skill inventory be scanned on demand or cached?
- Should unregistered local skills appear in health results?
- Should `AGENTS.md` become mostly a bootstrap instruction that tells agents to
  use LOR?

## 10. Decision Log

- 2026-08-14: Plan V2 to clarify local skills, LOR skill metadata, and
  `AGENTS.md` responsibilities.
