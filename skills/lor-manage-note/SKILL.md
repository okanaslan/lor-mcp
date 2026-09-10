---
name: lor-manage-note
description: Save or remove an explicitly requested durable workspace note in LOR, with duplicate checks, evidence, and read-back. Use for project decisions or reusable context, not skill instructions or automatic conversation archiving.
metadata:
  version: "1.0.0"
---

# Manage A LOR Note

Keep notes workspace-scoped. Use the repository selected by the user, and honor
the requested save, delete, or preview operation. Do not infer permission to
store a whole conversation from a request to remember one decision.

## Check Existing Context

Search with `find_matching_workspace_note`; inspect likely duplicates with
`get_workspace_note`. For inventory, paginate `list_workspace_notes` with stable
filters. A similar title is not proof of duplicate content.

Separate verified facts, decisions, assumptions, and unresolved questions. Keep
the note concise, with source paths or references, verification date, applicable
scope, and any conditions that invalidate it. Do not store secrets, credentials,
private transcripts, or unrelated personal information. Store environment
variable names rather than values.

## Save Or Replace

Call `remember_workspace_note` with title, body and a few discriminating tags.
Reuse one `idempotencyKey` for retries of the exact same logical write. Retrieve
the returned `noteId` and compare the stored content before claiming success.

There is no note-update tool in this release. Do not pretend a second create is
an update. When replacement is explicitly requested, save and verify the new
note first, include the superseded note ID in its body, and remove the old note
only when deletion is authorized. This is not an atomic replacement; report both
IDs if cleanup fails. An unchanged note needs no new write.

Before deletion, read the exact workspace/note ID and confirm it is the intended
target. Use `remove_workspace_note`, then verify absence. Never broadly clear
notes to resolve a duplicate.

## Handle Uncertainty

On an uncertain create, query `get_operation` using the same workspace and key.
Replay an identical completed request to retrieve its stored outcome. A pending
receipt requires read-back and reconciliation, not a fresh key or blind retry.
Access denial is a host policy boundary, not a prompt problem to work around.

Report saved, unchanged, removed, preview-only, or blocked, with workspace, note
ID and actual verification. Do not create reviewer replies, commit changes, or
publish globally as a side effect.
