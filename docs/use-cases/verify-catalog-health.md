# Verify Catalog Health

## 1. Summary

A Codex user asks Local Orchestration Router (LOR) to identify catalog entries that may be
invalid, stale, duplicate, or missing useful metadata.

## 2. Actor

Codex user.

## 3. Scenario

The user wants confidence that the current Local Orchestration Router (LOR) catalog is usable
before relying on recommendations. The current Codex agent asks Local Orchestration Router (LOR)
to verify agent and skill records.

## 4. Flow

1. The Codex user asks the current Codex agent to check catalog health.
2. The current agent asks LOR MCP to verify catalog entries.
3. Local Orchestration Router (LOR) checks introduced agents and skills using approved evidence
   sources.
4. Local Orchestration Router (LOR) reports verified, unverified, or unknown entries.
5. Local Orchestration Router (LOR) highlights duplicates, stale entries, or entries with missing
   metadata when that information is available.
6. The current agent summarizes health issues and possible cleanup actions for
   the user.

## 5. Expected Outcome

The user receives a clear health summary and can decide whether to update,
remove, or reintroduce catalog entries before relying on routing.

## 6. Related Feature Specs

- [Skill / Agent Existence Verification](../feature-specs/existence-verification.md)
- [List Catalog Entries](../feature-specs/list-catalog-entries.md)
- [Update Catalog Entry](../feature-specs/update-catalog-entry.md)
- [Remove Catalog Entry](../feature-specs/remove-catalog-entry.md)

## 7. Open Questions

- What evidence source should verify Codex agent sessions?
- Should health checks fail on unknown verification status or report warnings?
- Should catalog health be a separate feature spec from existence verification?
