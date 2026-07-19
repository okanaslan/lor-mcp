# Explain Recommendation

## 1. Summary

A Codex agent explains why Local Orchestration Router (LOR) recommended a
specific agent or skill for a task.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

The current Codex agent receives a recommendation from Local Orchestration
Router (LOR) and needs to explain the choice to the user before using the
recommended entry.

## 4. Flow

1. The current Codex agent asks LOR MCP to find a matching catalog entry for a
   task.
2. Local Orchestration Router (LOR) returns a recommended agent or skill.
3. Local Orchestration Router (LOR) includes an inline recommendation
   explanation on each returned candidate.
4. The current agent reviews the matched project, primary specialty, tags, and
   confidence.
5. The current agent explains the recommendation to the user in concise terms.
6. The current agent proceeds with the recommended entry when appropriate.

## 5. Expected Outcome

The user understands why the agent or skill was recommended and can trust,
reject, or refine the routing decision.

## 6. Related Feature Specs

- [Routing Recommendation Explanation](../feature-specs/routing-recommendation-explanation.md)
- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)
- [Get Catalog Entry Detail](../feature-specs/get-catalog-entry-detail.md)

## 7. Open Questions

None for v1.

## 8. Decisions

- V1 explanations only describe returned candidates, not rejected candidates.
- Recommendation explanations remain inline on `find_matching_catalog_entry`
  results.
- A standalone explanation tool is deferred until there is a clear need beyond
  inline candidate explanations.
