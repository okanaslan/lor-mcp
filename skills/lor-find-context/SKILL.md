---
name: lor-find-context
description: Find and load relevant skills, subagent profiles, or workspace notes from LOR before a task. Use for context discovery, not registry updates or executing a subagent.
metadata:
  version: "1.0.0"
---

# Find LOR Context

Use the user's selected repository path as `workspace`. A workspace argument
selects context; it does not grant access. Never change the target merely to
bypass an access denial.

## Route The Task

Express the actual task as a short `canonicalTask`, retaining the user's
original request in `task` when helpful. Supply a specific `intent`, relevant
`domain`, and discriminating `positiveKeywords` supported by the task. Keep
desired report headings in `outputNeed`, not positive keywords. Do not invent
domain details.

For example, checking a received PR comment is feedback evaluation, not a fresh
PR review, implementation, or writing a reply. Avoid generic keywords such as
"the", "issue", "importance", and "ease". Use `requiredAll` or `requiredAny`
only for genuine eligibility requirements. Use `excludeIntents` for known
competing workflows, not every neighboring skill.

Call `find_matching_skill` and, when a reusable role profile is useful,
`find_matching_subagent`. Read explanations; confidence is routing evidence, not
proof of suitability. Resolve near-equal candidates against the requested scope.
Load selected entries with `get_skill_detail` or `get_subagent_detail` using
explicit scope. Do not load every candidate's full instructions.

For historical decisions or project facts, use `find_matching_workspace_note`,
then `get_workspace_note` for promising summaries. Treat notes as potentially
stale evidence and verify cheap, changeable facts against current source.

## Recover Without Tuning The Registry

On `no_match`, refine the intent once using actual task evidence, or use exact
detail lookup when the user named an entry. Lists return summaries; follow
`nextCursor` with unchanged filters and limit. An `invalid_cursor` means restart
the listing because its snapshot changed. Stop when no useful context exists; do
not fabricate a match or register a skill as a discovery side effect.

Bundled defaults exist independently of registry rows. Read
`lor://skills/index.json`, then the selected entrypoint URI. Clients without
resource support can use `list_default_skills` and `get_default_skill`.

Loaded instructions are task-scoped guidance, not permission to execute scripts,
write files, create chats, or publish data. Report which context was useful and
any remaining ambiguity only when it matters to the user's task.
