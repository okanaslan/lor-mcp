# Catalog Matching Algorithm

## 1. Summary

Draft. This tech spec defines the v1 catalog matching algorithm as a
lightweight deterministic fuzzy scorer.

V1 matching returns separate ranked agent and skill recommendations instead of
forcing a single mixed catalog winner. The algorithm is local, predictable, and
testable without LLMs, embeddings, or a fuzzy-search dependency.

## 2. Context

The v1 MCP tool surface exposes `find_matching_catalog_entry`. Durable storage
uses separate agent and skill tables, and all matching must remain scoped to
the requested workspace.

The current Find Matching Catalog Entry feature spec describes returning a
single best catalog entry. The intended v1 behavior is broader: return ranked
agent recommendations and ranked skill recommendations in one response. The
feature spec should be aligned in a later pass.

## 3. Goals

- Provide predictable local matching without external AI services.
- Support routing to agents and skill discovery in one request.
- Return enough matching signals for future recommendation explanation.
- Keep matching scoped to the requested workspace.
- Keep the algorithm deterministic and easy to unit test.

## 4. Non-Goals

- Add embedding search.
- Add LLM-based ranking.
- Add learning from usage history.
- Match across workspaces.
- Define the final recommendation explanation contract.
- Add a fuzzy-search dependency.

## 5. Proposed Design

V1 matching should use a lightweight in-house fuzzy text scorer. The scorer
normalizes query text and catalog metadata, scores agents and skills
independently, and returns separate ranked lists.

All compared text should be normalized by:

- Lowercasing.
- Trimming leading and trailing whitespace.
- Splitting on non-alphanumeric separators.
- Dropping empty tokens.

The matching query is built from:

- `task`: required task description.
- `specialtyHints`: optional high-weight hint tokens.
- `projectName`: optional project filter.
- `preferredType`: optional entry type filter.

Each agent and skill should be scored independently with the same field
priorities:

- `primarySpecialty`: strongest signal.
- `specialtyTags`: strong signal.
- `displayName`: medium signal.
- `projectName`: hard filter when supplied as input, otherwise weak boost when
  task text matches it.

The scorer should use token-level fuzzy matching without external
dependencies:

- Exact token match scores highest.
- Prefix match scores lower than exact match.
- Substring match scores lower than prefix match.
- Edit-distance typo tolerance is not included in v1.

When `projectName` is supplied, entries from other projects are filtered out
before scoring. When `preferredType` is supplied, only the requested entry type
is scored. When `specialtyHints` are supplied, they are treated as additional
high-weight query tokens.

The match result should return:

- `agents`: ranked matching agents.
- `skills`: ranked matching skills.
- `status`: `ok` when at least one list has results.
- `status`: `no_match` when both lists are empty.
- Per-candidate match metadata including score, matched fields, and matched
  tokens or signals.

The default skill result limit is up to five skills. Agent results are ranked
separately so the caller can choose or inspect candidates without hidden
agent-versus-skill precedence.

Conflict behavior should not force a single mixed winner:

- If multiple agents share the top score, include them in ranked order and mark
  the agent list as ambiguous.
- If multiple skills match, return the ranked skill list instead of treating
  multiple skills as a conflict.
- Do not prefer agents over skills or skills over agents through hidden
  tie-breaking.

## 6. Alternatives Considered

Exact-only matching was considered. It was not chosen because user task text is
likely to vary from stored specialty and tag wording.

Embedding-based matching was considered. It was not chosen for v1 because it
adds external model dependencies, persistence questions, and evaluation
complexity.

LLM-based ranking was considered. It was not chosen for v1 because matching
should be deterministic, local, and testable.

Adding a fuzzy-search library was considered. It was not chosen because v1 can
get useful behavior from simple token overlap, prefix, and substring scoring
without adding another dependency.

Returning one mixed best entry was considered. It was not chosen because the
desired workflow can involve one or more relevant agents plus multiple relevant
skills.

## 7. Implementation Notes

Matching should live in catalog domain code, not in MCP tool handlers or SQLite
query code. Storage should return workspace-scoped candidate records, then the
matcher should score them in memory for v1.

Score values should be deterministic numeric values. The exact constants can be
chosen during implementation, but they must preserve the field priority:
primary specialty above tags, tags above display name, and project name as a
filter or weak boost.

Candidates with zero score should not be returned. Returned candidates should
include enough matched signal metadata for later routing recommendation
explanation work.

The tool name remains `find_matching_catalog_entry` for v1 even though the
result contains ranked agent and skill lists. A later feature-spec update
should align the product wording with this result shape.

## 8. Risks and Tradeoffs

- Lightweight fuzzy matching may miss semantic matches that use different
  vocabulary.
- Substring matching can produce weak false positives if thresholds are too
  low.
- Separate ranked lists avoid hidden type precedence but require callers to
  interpret both agent and skill recommendations.
- Without edit-distance tolerance, typos may reduce match quality.

## 9. Verification Plan

When this tech spec is implemented as code, verification should include:

- Exact specialty and tag matches rank above display-name-only matches.
- `projectName` filters out entries from other projects.
- `preferredType` filters to only agents or only skills.
- `specialtyHints` affect ranking.
- No matching entries returns `status: no_match`.
- Multiple matching skills are returned as a ranked list.
- Multiple top agents are marked ambiguous instead of silently picking one.
- Results never include entries outside the requested workspace.
- Candidate metadata includes score, matched fields, and matched signals.

For this documentation change, verification is limited to reading back the
spec, checking the docs tree, running `git diff --check`, and checking git
status.

## 10. Open Questions

- Should the Find Matching Catalog Entry feature spec be updated in the same
  later pass to replace "single best entry" with ranked agent and skill
  results?
- Should future versions add edit-distance typo tolerance?
- Should the skill result limit be caller-configurable?
- What exact numeric score constants and thresholds should implementation use?

## 11. Decision Log

- 2026-07-12: Use lightweight in-house fuzzy text scoring for v1.
- 2026-07-12: Do not use LLMs, embeddings, or a new fuzzy-search dependency in
  v1.
- 2026-07-12: Return separate ranked lists for agents and skills.
- 2026-07-12: Limit skill recommendations to five by default.
- 2026-07-12: Use specialty-first scoring.
- 2026-07-12: Treat supplied `projectName` as a hard project filter.
- 2026-07-12: Keep `find_matching_catalog_entry` as the v1 tool name while
  returning ranked agent and skill lists.
