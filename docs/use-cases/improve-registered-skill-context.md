# Improve Registered Skill Context

## 1. Summary

A Codex agent improves the LOR context for a registered skill after learning how
that skill should be used in the current workspace.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

The current agent uses or inspects a registered skill and notices that its LOR
metadata lacks useful project-specific guidance. The agent proposes better
stored context so future matching and detail lookups are more useful.

## 4. Flow

1. The current agent identifies a registered skill that needs better context.
2. The agent calls `propose_skill_update` with a reason and proposed context or
   metadata.
3. LOR returns a persisted proposal with before and after preview data.
4. The agent presents the proposed change to the user or approval workflow.
5. After approval, the agent calls `apply_skill_update` with `confirm: true`.
6. LOR applies the proposal to the registered skill entry.
7. Future catalog detail, matching, import, and export flows include the
   improved skill context.

## 5. Expected Outcome

The registered skill becomes more useful for future routing without editing the
local `SKILL.md` file.

## 6. Related Feature Specs

- [Registered Skill Context Updates](../feature-specs/registered-skill-context-updates.md)
- [Introducing Skill](../feature-specs/introducing-skill.md)
- [Update Catalog Entry](../feature-specs/update-catalog-entry.md)

## 7. Open Questions

- Should pending proposals expire after a configurable period?
- Should future versions offer local skill file sync as a separate approved
  workflow?
