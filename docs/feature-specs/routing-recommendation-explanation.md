# Routing Recommendation Explanation

## 1. Summary

Draft. This feature makes Agentic Router explain why a specific agent or skill
was recommended for a user request.

## 2. Goals

- Make routing recommendations understandable.
- Expose the main matching signals used for a recommendation.
- Help users correct catalog metadata when recommendations are weak.

## 3. Non-Goals

- Define the full matching algorithm.
- Guarantee exhaustive reasoning traces.
- Explain recommendations for entries outside the active initialized MCP
  session.
- Modify catalog entries automatically.

## 4. Functional Requirements

- The server must include a short explanation when returning a routing
  recommendation.
- The explanation must identify the recommended entry type and display name.
- The explanation must list the strongest matching signals, such as project,
  primary specialty, or specialty tags.
- The explanation must state when confidence is low or when the recommendation
  is a fallback.
- The explanation must not include hidden entries from conflict resolution.
- The explanation must not expose entries from other initialized MCP sessions.

## 5. User Stories / Use Cases

Optional for later expansion. The initial use case is that a user receives an
agent or skill recommendation and wants to know why it was selected.

## 6. Data Model

Conceptual `RecommendationExplanation` fields:

- `recommendedEntry`: identifies the selected entry.
- `matchedSignals`: lists fields that contributed to the recommendation.
- `confidence`: describes the recommendation strength.
- `summary`: provides a short human-readable reason.

## 7. Error Handling

- Missing recommendation context must return a validation error.
- Missing or invalid initialized MCP session context must return a session
  error.
- Explanation generation failures must not change the selected recommendation.

## 8. Security and Permissions

- Explanations must only mention entries visible in the active initialized MCP
  session.
- Explanations must not reveal rejected candidates from other sessions.

## 9. Open Questions

- Should explanations be deterministic templates or model-generated text?
- What confidence labels should be exposed?
- Should explanations include rejected candidates from the same session?

## 10. Decision Log

- 2026-07-11: Keep explanations short and tied to explicit matching signals.
- 2026-07-11: Treat detailed ranking policy as part of matching and conflict
  features.
