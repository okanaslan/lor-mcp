# Workspace Memory Primitives

## 1. Summary

Implemented. This feature adds small workspace-scoped memory notes for branch
plans, review summaries, reapply notes, and other durable coordination context
that is not a catalog entry.

## 2. Goals

- Let agents store concise workspace notes.
- Let agents list and retrieve notes later.
- Keep notes scoped to a resolved workspace.
- Avoid mixing general memory with catalog routing metadata.

## 3. Non-Goals

- Replace catalog entries.
- Store secrets or credentials.
- Add vector search or embeddings.
- Sync notes across machines.
- Build a full project management system.

## 4. Functional Requirements

- The server must expose `remember_workspace_note`.
- The server must expose `list_workspace_notes`.
- The server must expose `get_workspace_note`.
- The server must expose `remove_workspace_note`.
- Notes must require `workspace`, `title`, and `body`.
- Notes may include tags such as `branch-plan`, `review-summary`, or
  `reapply-note`.
- Notes must be scoped to the requested workspace.
- Notes must be durable.
- Notes must not be returned by catalog matching.

## 5. User Stories / Use Cases

- [Remember Workspace Note](../use-cases/remember-workspace-note.md)

## 6. Data Model

Conceptual `WorkspaceNote` fields:

- `noteId`
- `workspace`
- `title`
- `body`
- `tags`
- `createdAt`
- `updatedAt`

## 7. Error Handling

- Missing title or body must return `validation_error`.
- Missing notes must return `not_found`.
- Storage failures must return `storage_error`.

## 8. Security and Permissions

- Notes must not cross workspace boundaries.
- Notes must not be used for hidden access control.
- Callers remain responsible for not storing secrets.
- Raw note bodies should not be written to operational logs.

## 9. Open Questions

- Should notes support update, or should remove plus remember be enough?
- Should notes have a maximum size in v1?
- Should matching later consider workspace notes as optional context?

## 10. Decision Log

- 2026-08-06: Implement workspace memory as explicit durable notes with
  remember, list, get, and remove tools. List returns summaries; get returns the
  note body.
- 2026-08-06: Plan workspace memory as small scoped notes, separate from catalog
  entries and delegated task messages.
