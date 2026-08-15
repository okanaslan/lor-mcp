# Remove Stale Catalog Entry

## 1. Summary

A Codex user removes an introduced skill or subagent that should no longer be
recommended.

## 2. Actor

Codex user.

## 3. Scenario

The user notices that an introduced skill or subagent is stale, unavailable, or
no longer appropriate for the current project. The user asks the current Codex
agent to remove it from Local Orchestration Router (LOR).

## 4. Flow

1. The Codex user identifies a stale catalog entry.
2. The user asks the current Codex agent to remove the entry.
3. The current agent calls `remove_skill` or `remove_subagent` with the stable
   identifier and scope when needed.
4. Local Orchestration Router (LOR) removes the entry from the requested
   workspace.
5. The removed entry no longer appears in list, detail, or matching results.
6. The current agent confirms removal to the user.

## 5. Expected Outcome

The stale entry is removed from the catalog without deleting any local skill
file or Codex task.

## 6. Related Feature Specs

- [Remove Catalog Entry](../feature-specs/remove-catalog-entry.md)
- [List Catalog Entries](../feature-specs/list-catalog-entries.md)
- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)

## 7. Open Questions

- Should removal be soft-delete or permanent for the requested scope?
- Should users be able to undo removal?
