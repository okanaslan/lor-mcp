# Catalog Matching Algorithm

## 1. Summary

Implemented. This tech spec defines the catalog matching algorithm as a
lightweight deterministic fuzzy scorer.

The public V2 surface returns separate ranked skill and subagent recommendations
instead of forcing a single mixed catalog winner. Historical/internal
registered-agent matching still uses the same deterministic scorer, but
registered-agent matching is no longer part of the normal public V2 surface.

## 2. Context

The public MCP tool surface exposes typed matching tools: `find_matching_skill`
and `find_matching_subagent`. Durable storage uses separate agent, skill, and
subagent tables, and all matching must remain scoped to the requested workspace
or intentionally shared global scope.

The historical matcher supported agent, skill, and subagent candidates. The
current public V2 contract exposes skill and subagent matching only.

## 3. Goals

- Provide predictable local matching without external AI services.
- Support skill discovery and subagent prompt-profile discovery.
- Return enough matching signals for future recommendation explanation.
- Keep matching scoped to the requested workspace.
- Keep the algorithm deterministic and easy to unit test.

## 4. Non-Goals

- Add embedding search.
- Add LLM-based ranking.
- Add learning from usage history.
- Match workspace-local entries from unrelated workspaces.
- Define the final recommendation explanation contract.
- Add a fuzzy-search dependency.

## 5. Proposed Design

Matching should use a lightweight in-house fuzzy text scorer. The scorer
normalizes query text and catalog metadata, scores visible skills and subagents
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

Each skill and subagent should be scored independently with these shared field
priorities:

- `primarySpecialty`: strongest signal.
- `specialtyTags`: strong signal.
- `displayName`: medium signal.
- `projectName`: hard filter when supplied as input, otherwise weak boost when
  task text matches it.

Registered skill entries also score optional stored skill context. The v1
weights are:

- `primarySpecialty`: 10.
- `specialtyTags`: 8.
- `skillContext.whenToUse`: 7.
- `displayName`: 5.
- `skillContext.examplePrompts`: 5.
- `skillContext.usageNotes`: 3.
- `projectName`: 2 when it is not supplied as a hard filter.

This means stored skill context follows the same field priority rules:

- `skillContext.whenToUse`: strong signal below `specialtyTags`.
- `skillContext.examplePrompts`: medium signal near `displayName`.
- `skillContext.usageNotes`: weak signal.
- `skillContext.constraints`: not scored in v1.

The scorer should use token-level fuzzy matching without external dependencies:

- Exact token match scores highest.
- Prefix match scores lower than exact match.
- Substring match scores lower than prefix match.
- Edit-distance typo tolerance is not included in v1.

When `projectName` is supplied, entries from other projects are filtered out
before scoring. When `preferredType` is supplied, only the requested entry type
is scored. When `specialtyHints` are supplied, they are treated as additional
high-weight query tokens.

The public V2 match result should return:

- `skills`: ranked matching skills.
- `subagents`: ranked matching subagent prompt profiles.
- `status`: `ok` when at least one list has results.
- `status`: `no_match` when both lists are empty.
- Per-candidate match metadata including score, matched fields, and matched
  tokens or signals.

The default skill result limit is up to five skills. The default subagent result
limit is up to three subagents.

Historical/internal agent conflict behavior should not affect the public V2
skill/subagent surface:

- If historical/internal multiple top agents are within 10 percent of the
  highest agent score, include them in ranked order and mark the agent list as
  ambiguous unless deterministic auto-selection has stronger evidence.
- Deterministic auto-selection is allowed when the top agent has a meaningful
  stronger signal than other near-equal agents. V1 supports exact project-name
  match from task text and strictly stronger `primarySpecialty` score.
- Conflict payloads include ambiguous agent candidates, each candidate's normal
  explanation, matched signals across candidates, differentiating fields,
  differentiating signals, a suggested clarification question, and a recommended
  next action.
- If multiple skills or subagents match, return ranked lists instead of treating
  multiple candidates as a conflict.

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

Score values must stay deterministic and preserve the field priority: primary
specialty above tags, tags above skill usage guidance, usage guidance above
display name and examples, display name and examples above usage notes, and
project name as a filter or weak boost.

Candidates with zero score should not be returned. Returned candidates should
include enough matched signal metadata for later routing recommendation
explanation work.

The underlying matcher remains shared even though public MCP calls use
type-specific matching tool names.

## 8. Risks and Tradeoffs

- Lightweight fuzzy matching may miss semantic matches that use different
  vocabulary.
- Substring matching can produce weak false positives if thresholds are too low.
- Separate ranked lists avoid hidden type precedence but require callers to
  interpret both skill and subagent recommendations.
- Without edit-distance tolerance, typos may reduce match quality.

## 9. Verification Plan

When this tech spec is implemented as code, verification should include:

- Exact specialty and tag matches rank above display-name-only matches.
- `projectName` filters out entries from other projects.
- Typed public tools filter to only skills or only subagents.
- `specialtyHints` affect ranking.
- No matching entries returns `status: no_match`.
- Multiple matching skills are returned as a ranked list.
- Multiple matching subagents are returned as a ranked list.
- Historical/internal near-equal top agents are marked ambiguous instead of
  silently picking one.
- Exact project-name and stronger primary-specialty evidence allow deterministic
  auto-selection.
- Conflict payloads include differentiating fields/signals, a clarification
  question, and recommended next action.
- Results never include entries outside the requested workspace.
- Candidate metadata includes score, matched fields, and matched signals.
- Skill context can influence skill ranking when `whenToUse`, `examplePrompts`,
  or `usageNotes` match the task.
- Skill context constraints do not create matches by themselves.

For this documentation change, verification is limited to reading back the spec,
checking the docs tree, running `git diff --check`, and checking git status.

## 10. Open Questions

- Should future versions add edit-distance typo tolerance?
- Should the skill result limit be caller-configurable?

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
- 2026-07-19: Include registered skill context in skill scoring, while keeping
  constraints unscored.
- 2026-07-26: Treat top agent scores within 10 percent as conflict candidates
  unless exact project-name or stronger primary-specialty evidence allows safe
  deterministic selection.
- 2026-08-15: Remove registered-agent matching from the normal public V2
  surface; keep public matching focused on skills and subagents.
