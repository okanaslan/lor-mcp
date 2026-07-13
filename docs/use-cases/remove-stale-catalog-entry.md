# Remove Stale Catalog Entry

## 1. Summary

A Codex user removes an introduced agent or skill that should no longer be
recommended.

## 2. Actor

Codex user.

## 3. Scenario

The user notices that an introduced agent or skill is stale, unavailable, or no
longer appropriate for the current project. The user asks the current Codex
agent to remove it from Agentic Router.

## 4. Flow

1. The Codex user identifies a stale catalog entry.
2. The user asks the current Codex agent to remove the entry.
3. The current agent calls Agentic Router MCP with the entry type and
   identifier.
4. Agentic Router removes the entry from the requested workspace.
5. The removed entry no longer appears in list, detail, or matching results.
6. The current agent confirms removal to the user.

## 5. Expected Outcome

The stale entry is removed from the workspace catalog without deleting the
underlying Codex agent or skill.

## 6. Related Feature Specs

- [Remove Catalog Entry](../feature-specs/remove-catalog-entry.md)
- [List Catalog Entries](../feature-specs/list-catalog-entries.md)
- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)

## 7. Open Questions

- Should removal be soft-delete or permanent for the requested workspace?
- Should users be able to undo removal?
