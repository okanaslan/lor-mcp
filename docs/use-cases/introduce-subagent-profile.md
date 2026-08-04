# Introduce Subagent Profile

## 1. Summary

A Codex user introduces a reusable subagent profile so LOR can suggest it later
for focused delegated work.

## 2. Actor

Codex user.

## 3. Scenario

The user wants a reusable prompt profile for a narrow helper, such as an API
test writer, migration safety reviewer, or accessibility checker. The profile
defines the subagent's purpose, limited scope, expected output, constraints, and
optional references to agents or skills that may help the subagent work.

## 4. Flow

1. The user identifies a focused subagent role worth reusing.
2. The user asks the current Codex agent to introduce the subagent through LOR.
3. The current agent supplies required metadata and optional references.
4. LOR stores the subagent in workspace or global scope.
5. LOR returns the stored profile, rendered prompt, and unresolved reference
   metadata when references cannot be resolved.

## 5. Expected Outcome

The subagent profile is available for future list, detail, match, export,
import, sync, and removal workflows. Duplicate names are rejected only within
the same scope.

## 6. Related Feature Specs

- [Subagent Suggestions](../feature-specs/subagent-suggestions.md)
- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)
- [List Catalog Entries](../feature-specs/list-catalog-entries.md)
- [Get Catalog Entry Detail](../feature-specs/get-catalog-entry-detail.md)

## 7. Open Questions

- Should future versions support subagent prompt presets?
