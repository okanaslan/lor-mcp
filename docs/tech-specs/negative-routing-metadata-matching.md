# Negative Routing Metadata Matching

## 1. Summary

Implemented. This tech spec defines how LOR stores and evaluates structured
negative routing metadata for skills and subagents.

## 2. Context

Current matching uses deterministic token scoring over positive metadata such as
specialty, tags, display names, skill context, and subagent purpose. Some local
Codex skills include "do not use for" text inside positive fields. That text can
accidentally increase a candidate's score for tasks it explicitly should avoid.

V2 public matching is skill/subagent-focused through `find_matching_skill` and
`find_matching_subagent`.

## 3. Goals

- Separate positive routing evidence from negative routing evidence.
- Reduce false positives for overlapping skills and subagents.
- Preserve deterministic local matching with testable scoring.
- Keep existing update, detail, export, import, and sync flows compatible.

## 4. Non-Goals

- LLM-based classification.
- Usage-based learning.
- Negative routing for hidden registered-agent compatibility paths.
- Breaking existing catalog rows that do not have negative metadata.

## 5. Implemented Design

Add optional negative metadata to catalog entries:

- skills: `skillContext.negativeRouting`
- subagents: `negativeRouting`

Use this shape:

- `doNotUseWhen`: non-empty array of short strings.
- `insteadUse`: optional array of alternative entry references or names.
- `notes`: optional maintainer-facing string.

The matcher should tokenize negative metadata separately from positive fields.
For each candidate:

1. Compute the existing positive score.
2. Compute a negative score from `doNotUseWhen`.
3. If negative score is at or above the strong threshold, exclude the candidate.
4. If negative score is moderate, apply a deterministic penalty.
5. Return negative evidence in explanations only for candidates that remain
   visible in the result.

Implemented v1 scoring:

- Exact token match in `doNotUseWhen`: high negative signal.
- Prefix or substring match: lower negative signal.
- A negative match should never add to the positive score.
- `insteadUse` and `notes` are metadata only and do not affect matching score.
- Negative metadata uses the same deterministic token field scoring helper as
  positive metadata, with a `doNotUseWhen` field weight of `6`.
- Negative scores at or above `10` are strong matches and suppress the
  candidate.
- Negative scores below `10` are moderate matches and are subtracted from the
  positive score.

Implemented v1 behavior:

- Strong negative match: suppress the candidate from normal results.
- Moderate negative match: reduce score and include `negativeSignals` in the
  explanation.
- If all candidates are suppressed, return `no_match` with next-action guidance
  to broaden the task or inspect list results manually.

## 6. Alternatives Considered

- Continue embedding "do not use" text in `whenToUse`: rejected because it
  creates false positive token matches.
- Add only lower weights to constraints: rejected because constraints are not
  clearly equivalent to routing exclusions.
- Require exact alternative references: rejected for v1 because users may want
  lightweight free-form guidance before the target entry exists.

## 7. Implementation Notes

- Add Zod schemas for reusable negative routing metadata.
- Reuse the schema from introduce/update/proposal flows where possible.
- Preserve negative metadata in export/import and workspace catalog sync.
- Keep SQLite storage as JSON text if the surrounding entry context is already
  JSON-backed.
- Update explanation types with optional:
  - `negativeMatchedFields`
  - `negativeMatchedSignals`
  - `negativeScore`
  - `demotedByNegativeRouting`
- Add recommended next actions to `no_match` when all otherwise relevant entries
  were suppressed.
- Keep local skill file sync separate. A later change may render a managed "Do
  not use when" section after preview and approval.

## 8. Risks and Tradeoffs

- Aggressive exclusion can hide a useful fallback if metadata is too broad.
- Free-form exclusion text can still match common words unless stop-word
  handling is careful.
- Structured alternatives are more precise, but stricter references add
  maintenance overhead.
- Explanation output must avoid leaking suppressed workspace-local entries.

## 9. Verification Plan

- Skill matching tests:
  - positive specialty match is returned when no negative rule matches
  - strong `doNotUseWhen` match suppresses an otherwise matching skill
  - moderate negative match demotes a skill and returns negative explanation
    evidence
  - negative text does not increase positive score
- Subagent matching tests:
  - strong `doNotUseWhen` match suppresses an otherwise matching subagent
  - `insteadUse` does not affect score
- Persistence tests:
  - negative metadata round-trips through SQLite
  - export/import preserves negative metadata
  - workspace catalog sync preserves negative metadata
- Schema tests:
  - update flows accept valid negative metadata
  - empty negative metadata is rejected or normalized away
- Full verification:
  - `mise x deno@latest -- deno task check`
  - `mise x deno@latest -- deno task test`
  - `mise x deno@latest -- deno task lint`
  - `mise x deno@latest -- deno task fmt`
  - `mise x deno@latest -- deno fmt --check README.md CHANGELOG.md docs`
  - `git diff --check`

## 10. Open Questions

- Should suppressed candidate counts be returned without candidate identity?
- Should `insteadUse` become structured references after the first
  implementation?

## 11. Decision Log

- 2026-08-19: Add structured negative routing metadata rather than relying on
  free-text "do not use" wording inside positive fields.
- 2026-08-19: Scope matching behavior to public V2 skills and subagents.
- 2026-08-19: Keep alternatives as guidance-only metadata for v1.
- 2026-08-19: Use `10` as the strong negative threshold; suppress candidates at
  or above that score and demote visible candidates below it.
