# Update Incorrect Catalog Metadata

## 1. Summary

A Codex user corrects inaccurate display or routing metadata for an introduced
agent or skill.

## 2. Actor

Codex user.

## 3. Scenario

The user notices that a catalog entry has the wrong project name, display name,
primary specialty, or specialty tags. The user asks the current Codex agent to
update the entry through Agentic Router MCP.

## 4. Flow

1. The Codex user identifies an introduced agent or skill with incorrect
   metadata.
2. The user provides the corrected metadata.
3. The current Codex agent calls Agentic Router MCP to update the catalog entry.
4. Agentic Router validates the update.
5. Agentic Router updates only editable metadata in the requested workspace
   workspace.
6. The current Codex agent reports the updated catalog entry to the user.

## 5. Expected Outcome

The catalog entry keeps its stable identity while its display and routing
metadata are corrected for future recommendations.

## 6. Related Feature Specs

- [Update Catalog Entry](../feature-specs/update-catalog-entry.md)
- [Get Catalog Entry Detail](../feature-specs/get-catalog-entry-detail.md)
- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)

## 7. Open Questions

- Should updates require the full metadata object or allow partial patches?
- Should update history be visible to users?
