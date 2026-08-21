# Use Implementation Skill Guidance For Feature Work

## 1. Scenario

A Codex agent is assigned a feature request and uses LOR to find the most
relevant skill. The matching response identifies a skill, but the agent needs
more operational detail before editing files.

## 2. Flow

1. The agent calls `find_matching_skill` with the current workspace and task.
2. LOR returns compact matching metadata without large implementation guidance.
3. The agent calls `get_skill_detail` for the selected skill.
4. The agent reads `skillContext.implementationGuidance`.
5. The agent inspects the listed files or areas from `firstInspect`.
6. The agent follows `implementationRules` and avoids listed anti-patterns.
7. The agent uses `commonFixPatterns` when a matching problem appears.
8. The agent adds or updates tests from `testsToAdd`.
9. The agent runs the commands listed under `verification`.
10. The agent reports completion using `handoffChecklist`.

## 3. Expected Result

The agent gets practical implementation guidance without increasing match noise
or turning large operational text into positive routing evidence.

## 4. Failure Handling

- If no skill matches, continue from repository instructions and report that LOR
  had no useful skill match.
- If the selected skill has no implementation guidance, use the existing routing
  metadata and repository instructions.
- If guidance conflicts with repository instructions, repository instructions
  and the user's current request take precedence.

## 5. Related Specs

- [Implementation Skill Guidance](../feature-specs/implementation-skill-guidance.md)
- [Registered Skill Context Updates](../feature-specs/registered-skill-context-updates.md)
- [Local Skill Sync](../feature-specs/local-skill-sync.md)
