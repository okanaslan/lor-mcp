# Reduce False Skill And Subagent Matches

## 1. Summary

A Codex user wants LOR to avoid recommending overlapping skills or subagents
when their metadata explicitly says they are a poor fit for the current task.

## 2. Actor

Codex user.

## 3. Scenario

The workspace has several similar registered entries, such as React Native
performance audit, Expo memory profiling, profiling triage, and production
performance QA skills. A task contains broad performance language, so multiple
entries match. Some entries are wrong for the task, but their current "do not
use when" wording lives inside positive context text and can accidentally
increase their score.

## 4. Flow

1. The user or current Codex agent improves an overlapping skill or subagent
   with structured negative routing metadata.
2. The metadata captures situations where the entry should not be recommended.
3. A future task asks LOR to find matching skills or subagents.
4. LOR scores positive routing metadata and separately evaluates negative
   routing metadata.
5. Entries with strong negative matches are demoted or excluded from the result.
6. LOR returns better recommendations and exposes the negative routing evidence
   in the candidate explanation when relevant.

## 5. Expected Outcome

LOR produces fewer false-positive recommendations for overlapping skills and
subagents, while users can still inspect why an entry was demoted or excluded.

## 6. Related Feature Specs

- [Negative Routing Metadata](../feature-specs/negative-routing-metadata.md)
- [Registered Skill Context Updates](../feature-specs/registered-skill-context-updates.md)
- [Subagent Suggestions](../feature-specs/subagent-suggestions.md)
- [Routing Recommendation Explanation](../feature-specs/routing-recommendation-explanation.md)

## 7. Open Questions

- Should excluded entries appear in analytics as suppressed recommendations?
