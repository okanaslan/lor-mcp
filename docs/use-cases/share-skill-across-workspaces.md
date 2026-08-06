# Share Skill Across Workspaces

## 1. Summary

A Codex user makes a useful skill available to every LOR workspace by creating
or promoting it as a global skill.

## 2. Actor

Codex user.

## 3. Scenario

The user has a skill that is useful across projects, such as code review,
backend API implementation, or local skill sync guidance. Instead of
reintroducing it separately in every workspace, the user registers it once in
global scope so each workspace can list, match, inspect, update, and sync it.

## 4. Flow

1. The user starts in a workspace where LOR MCP is available.
2. The user either introduces a skill with `scope: "global"` or asks LOR to
   promote an existing workspace skill to global scope.
3. LOR stores the global skill with its metadata, verification metadata, and
   optional `skillContext`.
4. The user switches to another workspace.
5. The current Codex agent calls `list_skills` or `find_matching_skill`.
6. LOR returns workspace-local entries plus matching global skills by default.
7. The current agent may inspect, use, update, health-check, or sync the global
   skill through the same skill workflows used for workspace skills.

## 5. Expected Outcome

The user can maintain shared skills once and have them available across
workspaces, while agents remain workspace-specific and are never shared
globally.

## 6. Related Feature Specs

- [Global Skill Scope](../feature-specs/global-skill-scope.md)
- [Introducing Skill](../feature-specs/introducing-skill.md)
- [Find Matching Catalog Entry](../feature-specs/find-matching-catalog-entry.md)
- [List Catalog Entries](../feature-specs/list-catalog-entries.md)
- [Registered Skill Context Updates](../feature-specs/registered-skill-context-updates.md)
- [Local Skill Sync](../feature-specs/local-skill-sync.md)

## 7. V1 Decisions

- Global skill removal uses explicit `scope: "global"`; no extra confirmation
  flag is added in v1.
- Duplicate global promotion fails with the standard `duplicate_entry` error.
