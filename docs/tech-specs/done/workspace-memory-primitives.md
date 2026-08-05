# Workspace Memory Primitives

## 1. Summary

Implemented. This tech spec defines lightweight durable workspace notes that are
separate from catalog entries and delegated task messages.

## 2. Context

Users want LOR to remember branch plans, review summaries, and reapply notes
across Codex sessions. This data should not be forced into agent/skill/subagent
metadata because it is workspace context rather than routing catalog data.

## 3. Proposed Design

Add a `workspace_notes` table:

- `noteId`
- `workspace`
- `title`
- `body`
- `tagsJson`
- `createdAt`
- `updatedAt`

Tools:

- `remember_workspace_note`
- `list_workspace_notes`
- `get_workspace_note`
- `remove_workspace_note`

Notes are not indexed by the matcher in v1. They are retrieved explicitly.

The current implementation stores notes in SQLite under the resolved canonical
workspace. `list_workspace_notes` returns note summaries without `body`;
`get_workspace_note` returns the full note body by ID. Operational tool logs use
workspace and note IDs only and do not log raw note bodies.

## 4. Verification Plan

- Notes are scoped by resolved workspace.
- Notes round-trip title, body, tags, and timestamps.
- Listing supports optional tag filters.
- Removal does not affect catalog entries.
- Operational logs do not include note bodies.

## 5. Decision Log

- 2026-08-06: Implement `remember_workspace_note`, `list_workspace_notes`,
  `get_workspace_note`, and `remove_workspace_note` with workspace alias
  resolution, tag filtering, and explicit retrieval.
- 2026-08-06: Plan workspace notes as explicit durable records, not catalog
  entries.
