# Suggest Subagents For Scoped Work

## 1. Summary

A Codex agent asks LOR for matching catalog entries and receives focused
subagent suggestions for a small delegated portion of the work.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

The current agent receives a larger task. No registered agent is a strong fit,
or a focused part of the task would benefit from a temporary helper. The current
agent asks LOR for matching catalog entries and receives agents, skills, and up
to three matching subagent profiles.

## 4. Flow

1. The current agent receives a task from the user.
2. The current agent calls `find_matching_catalog_entry`.
3. LOR matches workspace agents, workspace/global skills, and workspace/global
   subagents.
4. LOR returns ranked agents, skills, and subagents.
5. Each subagent suggestion includes a rendered prompt, explanation, delegation
   scope, references, and unresolved reference metadata.
6. The current agent decides whether to use Codex-native subagent/task tooling
   for one or more suggested subagents.
7. The current agent continues with the results or proceeds alone if no useful
   subagent exists.

## 5. Expected Outcome

The current agent can delegate scoped work to temporary helpers without
inventing unavailable registered agents or writing one-off subagent prompts from
scratch.

## 6. Related Feature Specs

- [Subagent Suggestions](../feature-specs/subagent-suggestions.md)
- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)
- [Conflict Handling](../feature-specs/conflict-handling.md)
- [Global Skill Scope](../feature-specs/global-skill-scope.md)

## 7. Open Questions

- Should a later dedicated `suggest_subagents` tool be added if combined
  matching becomes too broad?
