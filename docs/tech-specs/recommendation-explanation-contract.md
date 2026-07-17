# Recommendation Explanation Contract

## 1. Summary

Draft. This tech spec defines the v1 recommendation explanation contract for
Local Orchestration Router (LOR).

Recommendation explanations are deterministic inline objects attached to
returned match candidates from `find_matching_catalog_entry`. They expose why a
returned agent or skill matched without using model-generated prose or exposing
hidden catalog entries.

## 2. Context

Catalog matching v1 returns separate ranked `agents` and `skills` lists.
Matching already produces deterministic score, matched fields, and matched
tokens or signals. The MCP tool surface v1 returns structured response envelopes
through `structuredContent`.

The recommendation explanation contract defines how matching evidence is exposed
to callers. The matching algorithm owns score calculation. This contract owns
how score evidence, confidence, and concise explanation text are represented in
returned candidates.

## 3. Goals

- Make recommendations understandable and auditable.
- Keep explanations deterministic and testable.
- Provide enough signal data for Codex agents to summarize decisions to users.
- Avoid leaking non-returned catalog entries.
- Avoid leaking entries from other workspaces.
- Keep explanation behavior inline with `find_matching_catalog_entry`.

## 4. Non-Goals

- Generate model-written prose.
- Explain rejected candidates.
- Store explanation history or analytics.
- Add a separate recommendation explanation MCP tool in v1.
- Prepare agent handoff prompts; that belongs to `prepare_agent_handoff`.
- Define the full matching algorithm.

## 5. Proposed Design

Each returned agent or skill candidate from `find_matching_catalog_entry` should
include an `explanation` object.

The explanation object should include:

- `summary`: concise human-readable reason for the recommendation.
- `confidence`: confidence label for the returned candidate.
- `matchedFields`: fields that contributed to the match.
- `matchedSignals`: matched tokens or signal labels from the matcher.
- `score`: deterministic numeric score from the matching algorithm.

The v1 confidence labels are:

- `low`
- `medium`
- `high`

Low-confidence candidates should be filtered out instead of returned with a
warning. Therefore, returned candidate explanations should normally use `medium`
or `high`. The `low` label is reserved for future fallback behavior or internal
threshold decisions if that behavior is added later.

Explanation summaries should be generated from deterministic templates using
only visible candidate data and matched signals. Summary text must not mention:

- Rejected candidates.
- Hidden candidates.
- Entries from other workspaces.
- Private storage or session identifiers.
- Internal DB paths or configuration values.

`no_match` responses should not include candidate explanations because there are
no returned candidates. Ambiguous top agents should each include their own
explanation, and the match result should mark the agent list as ambiguous.
Multiple returned skills should each include their own explanation.

## 6. Alternatives Considered

A separate explanation tool was considered. It was not chosen for v1 because
matching already has the evidence needed to explain returned candidates, and a
second tool call would make the basic routing workflow less ergonomic.

Structured signals without summary text were considered. They were not chosen
because Codex agents and users benefit from concise readable summaries.

Model-generated explanation prose was considered. It was not chosen because v1
explanations should be deterministic, local, and directly tied to matching
signals.

Explaining rejected candidates was considered. It was not chosen because it can
clutter results and risks revealing unnecessary catalog information.

Returning low-confidence candidates with warnings was considered. It was not
chosen because v1 should keep returned recommendations actionable and use
`no_match` when confidence is too low.

## 7. Implementation Notes

The explanation builder should be a deterministic function over a returned match
candidate and its matching metadata. It should not query storage, inspect other
candidates, or call external services.

Template text should stay short. A useful summary can mention the strongest
matched field, such as primary specialty or specialty tags, and the task or hint
token that caused the match.

`matchedFields` should use stable field names such as:

- `primarySpecialty`
- `specialtyTags`
- `displayName`
- `projectName`

`matchedSignals` should use normalized tokens or short signal labels from the
matching algorithm. The explanation builder should not invent signals that the
matcher did not provide.

Confidence thresholds should be derived from deterministic match scores during
implementation. Exact thresholds remain open, but returned candidates must not
use confidence to hide cross-workspace data or rejected candidate details.

## 8. Risks and Tradeoffs

- Deterministic template summaries may sound less natural than model-generated
  prose.
- Filtering low-confidence candidates can produce `no_match` more often with
  sparse catalogs.
- Exposing numeric score helps auditability but may imply more precision than
  the lightweight matcher provides.
- Keeping explanations inline increases match response size when several skills
  are returned.

## 9. Verification Plan

When this tech spec is implemented as code, verification should include:

- Returned agents include explanation objects.
- Returned skills include explanation objects.
- No-match responses include no candidate explanations.
- Low-score candidates are filtered out.
- Explanation summaries are deterministic for the same inputs.
- Explanations only reference matched fields and signals from visible returned
  candidates.
- Cross-workspace entries never appear in summaries, fields, signals, or
  candidate explanation metadata.

For this documentation change, verification is limited to reading back the spec,
checking the docs tree, running `git diff --check`, and checking git status.

## 10. Open Questions

- What exact score thresholds should map to `medium` and `high`?
- Should later versions expose low-confidence fallback candidates?
- Should a separate explanation tool be added after update, remove, import, and
  export tools exist?
- Should numeric score be hidden from end-user summaries while remaining in
  structured data?

## 11. Decision Log

- 2026-07-12: Include explanations inline with returned matching agents and
  skills.
- 2026-07-12: Generate explanations from deterministic templates and matching
  signals.
- 2026-07-12: Do not use model-generated explanation text in v1.
- 2026-07-12: Explain only returned candidates.
- 2026-07-12: Filter low-confidence candidates instead of returning them with
  warnings.
- 2026-07-12: Use `low`, `medium`, and `high` as confidence labels.
- 2026-07-12: Include summary text plus structured matched fields, matched
  signals, and score.
