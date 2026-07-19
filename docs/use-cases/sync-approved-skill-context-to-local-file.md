# Sync Approved Skill Context To Local File

## 1. Summary

A Codex agent syncs approved LOR skill context into the local skill's `SKILL.md`
file after the user approves the catalog update.

## 2. Actor

Codex agent acting on behalf of a Codex user.

## 3. Scenario

An agent has proposed and applied a registered skill context update. The user
now wants that approved context reflected in the local skill file so future
Codex sessions can read it directly from `SKILL.md`.

## 4. Flow

1. The agent confirms the skill update proposal has already been applied.
2. The agent calls `preview_skill_file_sync` with `workspace`, `skillName`, and
   `proposalId`.
3. LOR resolves the skill file from configured skill roots and renders the
   LOR-managed section without writing.
4. The agent presents the preview to the user or approval workflow.
5. After approval, the agent calls `apply_skill_file_sync` with the same inputs
   and `confirm: true`.
6. LOR writes or replaces only the LOR-managed section in `SKILL.md`.
7. Future skill readers can inspect the synced LOR context in the local file.

## 5. Expected Outcome

Approved catalog skill context is written into a local `SKILL.md` managed
section without modifying unrelated file content.

## 6. Related Feature Specs

- [Local Skill Sync](../feature-specs/local-skill-sync.md)
- [Registered Skill Context Updates](../feature-specs/registered-skill-context-updates.md)
- [Introducing Skill](../feature-specs/introducing-skill.md)
