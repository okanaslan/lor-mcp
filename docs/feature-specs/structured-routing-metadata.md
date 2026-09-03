# Structured Routing Metadata

## 1. Summary

Implemented for skills and subagent prompt profiles. Structured routing
metadata lets callers and catalog entries describe intent, positive signals,
required signals, exclusion signals, domain, and desired output shape without
depending on long free-text prompt phrasing.

## 2. Goals

- Reduce false positive skill and subagent matches.
- Make task routing deterministic and inspectable.
- Preserve compact match responses while exposing richer debug evidence when
  requested.
- Keep matching local and catalog-driven.

## 3. Non-Goals

- Add embedding search or LLM-based routing judgment.
- Add structured routing metadata to registered-agent compatibility rows.
- Replace existing `skillContext.whenToUse`, `usageNotes`, or `examplePrompts`.

## 4. Functional Requirements

- Skills and subagents may store optional `routing` metadata.
- `routing` must include at least one meaningful field when supplied.
- `find_matching_skill` and `find_matching_subagent` accept optional structured
  request fields:
  - `intent`
  - `positiveKeywords`
  - `negativeKeywords`
  - `requiredAny`
  - `requiredAll`
  - `excludedSkills`
  - `preferredSkills`
  - `domain`
  - `outputNeed`
  - `debug`
- Matching must normalize aliases such as PR/pull request and review comments.
- Matching must ignore common stop words as positive evidence.
- Hard filters must run before ranking for verification status, preferred type,
  project name, explicit exclusions, excluded intents, required signals, and
  request negative keywords.
- Positive scoring must weight structured routing fields above broad fallback
  text fields.
- Negative routing must remain separate from positive evidence.
- `debug: true` must expose query signals, ignored signals, excluded
  candidates, weighted signal breakdowns, negative signals, and final score
  breakdowns.

## 5. Data Model

Entry-level `routing` fields:

- `intents`: task intents this entry is meant to satisfy.
- `excludedIntents`: task intents that should hard-exclude this entry.
- `positiveKeywords`: compact positive routing signals.
- `negativeKeywords`: compact negative routing signals.
- `requiredAny`: at least one listed signal must be present.
- `requiredAll`: every listed signal must be present.
- `domain`: product, stack, platform, or workspace domain signals.
- `outputNeed`: expected output shape, such as triage, plan, patch, or review.
- `softNegativeExamples`: example phrases that demote but do not necessarily
  hard-exclude.
- `fieldWeights`: optional per-source score overrides.

Stored routing metadata is persisted in SQLite schema version 12 and preserved
through introduction, updates, skill update proposals, detail reads, export,
import, and workspace sync.

## 6. Matching Behavior

The matcher builds normalized positive and negative query signals from the
task, specialty hints, and structured request fields. Structured entry metadata
is evaluated before legacy text fields, and candidate explanations keep the
existing `matchedFields`, `matchedSignals`, and `score` surface.

When `debug` is omitted or false, results remain compact. When `debug: true`,
callers receive enough evidence to explain why one entry won and why excluded
entries were filtered before ranking.

## 7. Decision Log

- 2026-09-03: Implement broad structured routing metadata for skills and
  subagents, backed by SQLite schema version 12.
- 2026-09-03: Keep matching deterministic and local; do not add LLM or embedding
  routing for this feature.
- 2026-09-03: Keep legacy negative routing as a supported compatibility field,
  but prevent negative text from contributing to positive scoring.
