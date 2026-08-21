# Negative Routing Metadata

## 1. Summary

Implemented for V2. This feature adds structured "do not use when" routing
metadata for skills and subagents so LOR can reduce false matches between
overlapping catalog entries.

## 2. Goals

- Let registered skills and subagents describe tasks where they should not be
  used.
- Prevent negative routing text from being scored as positive match evidence.
- Demote or exclude entries when task text strongly matches negative metadata.
- Keep matching deterministic, local, and explainable.
- Support metadata updates through existing skill and subagent update flows.

## 3. Non-Goals

- Add LLM-based routing judgment.
- Replace positive `whenToUse`, `purpose`, or specialty metadata.
- Add negative routing metadata for hidden registered-agent compatibility
  behavior.
- Automatically edit local `SKILL.md` files without the existing skill sync
  preview and approval flow.
- Learn negative routing rules automatically from user feedback in v1.

## 4. Functional Requirements

- Skill entries must support optional structured negative routing metadata.
- Subagent entries must support optional structured negative routing metadata.
- The metadata must include a concise `doNotUseWhen` list.
- The metadata may include optional `insteadUse` guidance for better
  alternatives.
- Existing update flows must be able to create, replace, or clear negative
  routing metadata.
- Existing detail tools must return negative routing metadata.
- Existing export/import and workspace catalog sync flows must preserve negative
  routing metadata.
- Matching must score positive and negative metadata separately.
- Strong negative matches must exclude the entry from returned recommendations.
- Moderate negative matches must demote the entry below better candidates when
  possible.
- Negative matches must not create positive score by token overlap.
- Candidate explanations must include negative routing evidence when an entry is
  returned after demotion.
- No-match responses should not reveal hidden entries from other workspaces.

## 5. User Stories / Use Cases

- [Reduce False Skill And Subagent Matches](../use-cases/reduce-false-skill-and-subagent-matches.md)

## 6. Data Model

Conceptual `NegativeRoutingMetadata` fields:

- `doNotUseWhen`: list of short exclusion rules.
- `insteadUse`: optional list of suggested alternative skill or subagent names.
- `notes`: optional short explanation for maintainers.

Skill entries may store this under `skillContext.negativeRouting`.

Subagent entries may store this under `negativeRouting`.

Author-facing "negative keywords" should be modeled as
`negativeRouting.doNotUseWhen`. LOR does not expose a separate
`negativeKeywords` field in V2.

## 7. Error Handling

- Empty negative routing objects must be rejected or normalized away.
- Invalid `insteadUse` references must not block storage; they are guidance
  only.
- Oversized exclusion text must return `validation_error`.
- Storage failures must return `storage_error`.
- Matching must continue if an entry has no negative routing metadata.

## 8. Security and Permissions

- Negative routing metadata must follow the same workspace/global visibility
  rules as the owning skill or subagent.
- Explanations must not reveal workspace-local alternatives from another
  workspace.
- Local skill-file updates must still use `preview_skill_file_sync` and
  `apply_skill_file_sync` with explicit confirmation.

## 9. Open Questions

- Should `insteadUse` accept only names, or structured references with
  `entryType`, `scope`, and `entryKey`?
- Should local `SKILL.md` sync write a managed "Do not use when" section from
  approved negative metadata?

## 10. Decision Log

- 2026-08-19: Plan structured negative routing metadata because free-text "do
  not use" wording inside positive fields can create false positive matches.
- 2026-08-19: Scope v1 to skills and subagents, matching the public V2 surface.
- 2026-08-19: Keep negative routing deterministic and local; no LLM routing
  judgment.
- 2026-08-19: Implement strong negative matches as suppression and moderate
  matches as score demotion with visible explanation evidence.
- 2026-08-21: Keep "negative keywords" as author-facing wording for
  `negativeRouting.doNotUseWhen`; do not add a separate field.
