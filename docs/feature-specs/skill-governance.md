# Skill ownership, provenance and lifecycle

Implemented in the current source. This does not update a running server or
change any existing live skill's instructions, relationships or lifecycle.

## Contract

Skills have optional `governance` metadata with independent sections:

- `responsibility`: `summary`, `owns`, `excludes`, and `relationships`.
- `provenance`: source `kind`, optional `locator`, `version`, `sourceHash`,
  `capturedAt`, and `assurance` (`claimed` or `captured`).
- `review`: `contentFingerprint`, `reviewedAt`, `method`, `evidence`, `outcome`
  (`passed` or `needs-attention`), and optional `intervalDays` (1–3650).
- `lifecycle`: `{status: "active"}` or
  `{status: "deprecated", reason,
  deprecatedAt, replacement?}`.

Use `introduce_skill` for a new entry and the existing `propose_skill_update` →
inspect preview → `apply_skill_update` flow for changes. No additional mutation
tools are needed. Omitted sections are preserved; a supplied section replaces
that entire section. Set responsibility, provenance or review to `null` to clear
it. Reactivate explicitly with `lifecycle: {status: "active"}`. Ordinary
metadata edits and repeated imports never reactivate entries.

MCP callers may omit capture, review and deprecation timestamps on introduction
or proposals. Server preparation supplies time; supplied timestamps cannot
backdate a new review. Application uses the timestamp shown in the proposal.
`assurance` on caller-supplied provenance is always `claimed`, even if the
caller supplies `captured`. An imported catalog snapshot with no prior source
gets server-captured `catalog-import` provenance and a fingerprint of that
snapshot. This proves capture, not technical correctness. Imported pre-existing
provenance is retained as a claim. LOR does not crawl sources or fetch locators.
Do not store credentials, sensitive URLs or private source contents in evidence.

Registration `verificationStatus: verified` remains a legacy
existence/registration signal. It is not an instruction review. A review's
method and evidence are operator-supplied assertions, not an independent
certification by LOR.

## Ownership and references

Each relationship has `kind`, `target`, and `reason`. Supported kinds:

- `complements`: guidance that is useful alongside this skill.
- `delegatesTo`: a neighboring responsibility belongs to that skill.
- `specializes`: a narrower workflow derived from that skill.

Targets are explicit: `{scope: "global", skillName}` or
`{scope: "workspace", workspace, skillName}`. Workspace references use the
canonical workspace identifier returned by LOR. Global skills can reference only
global skills; workspace skills can reference their own workspace or global
skills. Display names and keyword aliases are never reference identities.

New references require existing targets. Self references, duplicate edges,
specialization cycles and replacement cycles are rejected. Complementary and
delegation links may be reciprocal. Specialization/replacement paths are bounded
at 32 hops. Relationship declarations do not dispatch agents, load skills,
rewrite routing fields or force ranking. Exact overlap in related ownership
claims is advisory, not proof of a defect.

Proposals retain revisions for referenced dependencies. Apply checks the source
revision, dependency revisions and graph again inside the write transaction.
Concurrent changes require a new preview; do not blindly retry.

## Freshness

`get_skill_detail` returns a `contentFingerprint` for instructions, specialty,
tags, routing and responsibility. The fingerprint excludes names, timestamps,
usage, lifecycle and review metadata. Submit that fingerprint with an explicit
review, or review the proposed content and use its matching fingerprint.

Derived freshness states are `unreviewed`, `current`, `changed-since-review`,
`review-due`, and `needs-attention`. Time is evaluated at read time. A future
imported review timestamp needs attention. A substantive change invalidates the
old review's applicability; renaming a display label does not. No review
interval is imposed by default. Freshness informs the client; it does not hide
or automatically demote skills.

Lists and matching expose ownership/lifecycle/freshness information. Details,
health checks and workspace diagnostics report reference and review issues.
Subagent details report missing, ambiguous or deprecated skill references
without rewriting the stored prompt.

## Deprecation and redirects

Deprecate through a normal update proposal, for example:

```json
{
  "workspace": "/work/project",
  "scope": "global",
  "skillName": "old-review",
  "reason": "Consolidate duplicate review guidance",
  "governance": {
    "lifecycle": {
      "status": "deprecated",
      "reason": "Use the canonical reviewer",
      "replacement": { "scope": "global", "skillName": "review" }
    }
  }
}
```

Normal recommendations exclude deprecated skills. `list_skills` defaults to
`lifecycle: "active"`; use `deprecated` or `all` to inspect other entries.
Pagination binds the lifecycle filter just like scope and project filters.
Export includes deprecated entries.

Exact lookup returns the requested entry, including its deprecation metadata.
`get_skill_detail` with `followReplacement: true` follows up to 32 hops and
returns `resolution.requested`, `resolution.resolved`, and the chain. A
deprecated entry without a replacement returns itself, visibly deprecated. A
missing target fails explicitly. Following requires host global-read permission,
including when the initial lookup is workspace-scoped, because chains can cross
into global scope. No identity substitution happens unless the caller asks for
it.

A new replacement must be active. Later deprecation of that target is supported
through the explicit chain. Local file sync refuses deprecated source entries;
select and preview the replacement separately.

Removal reports structured inbound relationships, replacements and subagent
references and refuses to break them. Bulk clear allows references inside the
set being cleared but rejects surviving consumers. Free-text references are not
parsed or guaranteed. Introduction refuses duplicate keys, including deprecated
ones; imports skip/fail duplicates rather than overwriting them.

## Compatibility, storage and rollout

SQLite schema 18 adds nullable governance and proposal dependency columns.
Legacy entries remain active and unreviewed, with instructions preserved. Old
pending proposals can become revision-stale after migration; regenerate them.
Migration is transactional and future schema versions are rejected.

Exports now use format 2; imports accept formats 1 and 2. Older servers cannot
consume format-2 exports. Skills in an import are inserted and graph-validated
as one transaction, allowing references in either order and reciprocal links.
Any invalid skill graph rolls back the skill batch. The pre-existing mixed
agent/subagent import flow remains incremental: the entire mixed catalog is not
an all-or-nothing operation. Preserve its result and inspect state on failure.

Workspace import/sync remaps references inside the exported source workspace to
the destination, retains global references, and rejects foreign workspace
references. Remapping responsibilities can invalidate an old review fingerprint.
Promotion preserves metadata but rejects workspace-bound relationships; first
prepare an explicitly global version of those relationships.

Before deploying, back up the database and run type, lint, formatting, test and
stdio checks. An older binary refuses schema 18; rollback needs the database
backup as well as a compatible binary. This change does not publish a release or
restart the local MCP process. Start adoption with a small
review/feedback/repair family before editing a whole registry. No background
auditing, automatic retirement, ranking rewrite or local file installation is
included.
