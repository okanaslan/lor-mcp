# Implementation Skill Guidance Structure

## 1. Summary

Implemented as a backward-compatible extension to LOR skill metadata so
registered skills remain useful for routing while also carrying practical
implementation guidance for agents working on real feature requests. The design
adds optional detail-loaded `implementationGuidance` under `skillContext`, keeps
matching responses compact, and clarifies that current negative routing is
represented by `negativeRouting.doNotUseWhen`, not a separate `negativeKeywords`
field.

## 2. Goals

- Support implementation-oriented skill guidance.
- Keep routing metadata compact for list and match responses.
- Support and clarify negative keywords through existing negative routing
  metadata.
- Preserve backward compatibility for existing skill rows and imports.
- Update docs and tests so skill authors understand the difference between
  routing metadata and operational guidance.

## 3. Non-Goals

- Do not redesign the whole router.
- Do not rename stable `skillName`, `entryKey`, or `projectName` semantics.
- Do not make this app-specific or Toddy-specific.
- Do not overfit the schema to React Native; React Native may appear only as an
  example domain.
- Do not require all existing skills to be rewritten immediately.
- Do not change unrelated subagent behavior unless needed to keep routing
  contracts coherent.
- Do not make implementation guidance affect matching in v1.

## 4. Current Model Findings

Files inspected:

- `src/catalog/types.ts`
- `src/tools/schemas.ts`
- `src/catalog/validation.ts`
- `src/catalog/matcher.ts`
- `src/catalog/service.ts`
- `src/catalog/sqlite_repository.ts`
- `src/skills/local_skill_sync.ts`
- `test/catalog/matcher_test.ts`
- `test/catalog/service_test.ts`
- `test/catalog/sqlite_repository_test.ts`
- `test/tools/schemas_test.ts`
- `test/skills/local_skill_sync_test.ts`
- `docs/feature-specs/registered-skill-context-updates.md`
- `docs/feature-specs/negative-routing-metadata.md`
- `docs/feature-specs/local-skill-sync.md`
- `docs/tech-specs/negative-routing-metadata-matching.md`
- `docs/tech-specs/usage-analytics-counters.md`

Current skill schema:

- `SkillCatalogEntry` has stable identity fields through `skillName`,
  `entryKey`, `projectName`, `displayName`, `primarySpecialty`, and
  `specialtyTags`.
- `SkillContext` currently supports `whenToUse`, `usageNotes`, `constraints`,
  `examplePrompts`, and `negativeRouting`.
- `SkillContext` is stored as JSON text in the `introduced_skills.skillContext`
  column.

Current negative routing and negative keywords support:

- There is first-class `NegativeRoutingMetadata`.
- The implemented field is `skillContext.negativeRouting.doNotUseWhen` for
  skills and `negativeRouting.doNotUseWhen` for subagents.
- There is no separate `negativeKeywords` field in `src/`, `test/`, or `docs/`.
- `insteadUse` and `notes` exist as guidance metadata and do not affect score.
- Matching scores negative routing separately in `src/catalog/matcher.ts`.
  Strong negative scores suppress candidates; moderate negative scores demote
  returned candidates and add negative evidence to explanations.
- Negative match evidence is exposed through explanation fields such as
  `negativeMatchedFields`, `negativeMatchedSignals`, `negativeScore`, and
  `demotedByNegativeRouting`.

Current MCP exposed shape:

- `introduce_skill` accepts optional `skillContext.negativeRouting`.
- `update_skill` accepts top-level nullable `negativeRouting`; repository code
  writes it into `skillContext.negativeRouting`.
- `propose_skill_update` / `apply_skill_update` accept nullable
  `skillContext.negativeRouting`.
- `get_skill_detail`, `export_catalog`, `import_catalog`, and workspace sync
  preserve `skillContext`.
- `find_matching_skill` returns compact match candidates with `skillContext`
  currently present on returned candidates; this should not be expanded with
  large implementation guidance.

Current docs gaps:

- Current docs explain stored skill context and negative routing, but they do
  not define a reusable implementation-oriented skill structure.
- There is no doc that tells skill authors where to put "first inspect",
  implementation rules, common fix patterns, test expectations, verification,
  and handoff checklist.
- There is no explicit doc statement that "negative keywords" should be modeled
  through `negativeRouting.doNotUseWhen` instead of a separate field.

Current import/export/sync behavior:

- Export/import schemas preserve `skillContext`.
- Workspace catalog sync copies skill metadata including `skillContext`.
- Local skill sync renders LOR managed context fields and now includes
  implementation guidance after the stored proposal has been applied.
- Local skill sync does not render `negativeRouting`; negative routing remains
  matching metadata.

## 5. Implemented Skill Data Shape

Extend `SkillContext` with optional `implementationGuidance`.

Implemented conceptual shape:

```ts
interface SkillImplementationGuidance {
  firstInspect?: readonly string[];
  implementationRules?: readonly string[];
  commonFixPatterns?: readonly SkillFixPattern[];
  testsToAdd?: readonly string[];
  verification?: readonly string[];
  handoffChecklist?: readonly string[];
}

interface SkillFixPattern {
  problem: string;
  approach: string;
  antiPattern?: string;
}
```

Field requirements:

- `implementationGuidance` is optional.
- Every nested section is optional.
- At least one nested section must be present when `implementationGuidance` is
  supplied.
- List values should be trimmed, non-empty strings with bounded length.
- `commonFixPatterns` entries must include `problem` and `approach`;
  `antiPattern` is optional.
- Existing skills without the field continue working unchanged.

Detail versus compact responses:

- `get_skill_detail`, export, import, and sync previews expose the full
  `implementationGuidance`.
- `find_matching_skill` should not include full implementation guidance.
- Match responses do not include full implementation guidance.
- `list_skills` should stay compact and should not include full guidance.

## 6. API / MCP Changes

`introduce_skill`:

- Accept optional `skillContext.implementationGuidance`.
- Preserve existing required identity and routing fields.
- Keep omitted `scope` behavior unchanged.

`update_skill`:

- Keep stable `skillName` immutable.
- Continue allowing metadata updates and top-level `negativeRouting` updates.
- Preferred API path: use `propose_skill_update` and `apply_skill_update` for
  implementation guidance because it is substantial metadata and benefits from
  approval.

`propose_skill_update` / `apply_skill_update`:

- Accept `skillContext.implementationGuidance`.
- Preserve current preview-before-apply behavior.
- Implemented clear behavior: allow `skillContext.implementationGuidance: null`
  in update proposal schemas, not in `introduce_skill`.

`get_skill_detail`:

- Return full `skillContext.implementationGuidance`.
- This is the main progressive-loading path for agents that need operational
  instructions.

`list_skills` and `find_matching_skill`:

- Keep routing outputs compact.
- Do not score implementation guidance.
- Do not include large guidance arrays in match responses.

Validation and null/clear semantics:

- Preserve `negativeRouting: null` behavior for clearing negative routing.
- Reject empty implementation guidance objects.
- Reject extremely broad or contradictory negative keywords by validating
  `negativeRouting.doNotUseWhen` length and by adding tests for empty or
  whitespace-only items. Existing validation already trims and bounds
  `doNotUseWhen` entries.

Backward-compatible behavior:

- Existing imports without `implementationGuidance` continue to validate.
- Existing `skillContext` JSON rows need no backfill.
- Existing detail/list/match callers continue to receive current fields.

## 7. Router / Ranking Changes

Positive matching:

- Keep current positive matching unchanged.
- Continue scoring `primarySpecialty`, `specialtyTags`,
  `skillContext.whenToUse`, `skillContext.examplePrompts`,
  `skillContext.usageNotes`, `displayName`, and `projectName`.
- Do not score `implementationGuidance` in v1.

Negative keywords and negative routing:

- Treat "negative keywords" as author-facing shorthand for
  `negativeRouting.doNotUseWhen`.
- Do not add a separate `negativeKeywords` field unless a future version needs a
  distinct exact-keyword-only matcher.
- Continue using `negativeRouting.doNotUseWhen` for suppress/demote behavior.
- Continue exposing negative evidence on returned demoted candidates.
- Keep `insteadUse` and `notes` metadata-only.

Thresholds and deterministic behavior:

- Preserve the current implemented strong negative threshold of `10` unless
  backend tests prove a safer constant is needed.
- Preserve the current negative field weight of `6`.
- A negative match must never add positive score.

## 8. Migration And Backward Compatibility

Existing skills:

- Existing rows without `implementationGuidance` remain valid.
- Existing rows with only routing context continue to match exactly as they do
  today.

Backfill:

- No automatic backfill is required.
- Skill authors can gradually add implementation guidance through
  `propose_skill_update` / `apply_skill_update`.

Schema version:

- If guidance stays inside the existing `skillContext` JSON column, no SQLite
  column migration is required.
- Repository schema version may not need to change unless the project tracks
  JSON-shape changes as explicit migrations.
- If a separate column is chosen, add a migration and preserve old imports.

Import/export/sync:

- Export/import should preserve `implementationGuidance` because it lives inside
  `skillContext`.
- Workspace catalog sync should preserve it with the rest of skill context.
- Local skill sync renders implementation guidance in the managed `SKILL.md`
  section because it stays inside the existing preview/apply approval gate.

Rollback:

- If implementation guidance is stored in JSON and ignored by older code, older
  servers may drop it when rewriting `skillContext`. Document this as a normal
  forward-compatibility risk.

## 9. Docs Updates

Add or update these docs:

- `docs/feature-specs/implementation-skill-guidance.md`: product behavior for
  implementation-oriented skill guidance.
- `docs/use-cases/use-implementation-skill-guidance-for-feature-work.md`:
  scenario where an agent matches a skill, fetches detail, inspects required
  files, follows rules, adds tests, verifies, and reports handoff details.
- `docs/tech-specs/implementation-skill-guidance-structure.md`: this plan, then
  update status after implementation.
- `docs/feature-specs/registered-skill-context-updates.md`: add
  `implementationGuidance` to stored skill context and proposal behavior.
- `docs/feature-specs/local-skill-sync.md`: document that managed sections
  render implementation guidance.
- `docs/feature-specs/negative-routing-metadata.md`: clarify that
  `negativeKeywords` maps to `negativeRouting.doNotUseWhen`; no separate field
  exists today.
- `docs/tech-specs/done/catalog-matching-algorithm.md`: explicitly say
  implementation guidance is not scored in v1.
- `docs/readme.md`, `docs/v2/readme.md`, and `docs/roadmap.md`: add roadmap and
  operating-model references.

Docs should explain compact routing metadata versus detail-loaded implementation
guidance, include the generic skill authoring template, and show negative
keyword examples using `negativeRouting.doNotUseWhen`.

## 10. Test Plan

Unit tests:

- Validate `implementationGuidance` accepts each section.
- Validate empty implementation guidance is rejected.
- Validate blank list values are rejected.
- Validate `commonFixPatterns` require `problem` and `approach`.
- Validate `negativeRouting.doNotUseWhen` remains the negative keyword path.

Integration tests:

- Introduce skill with implementation guidance.
- Propose and apply skill update with implementation guidance.
- Clear or replace implementation guidance according to the chosen semantics.
- `get_skill_detail` returns full implementation guidance.
- `list_skills` and `find_matching_skill` stay compact.

MCP schema/tool tests:

- `introduceSkillInputSchema` accepts valid implementation guidance.
- `proposeSkillUpdateInputSchema` accepts valid implementation guidance.
- Invalid guidance returns `validation_error`.
- `tools/list` remains unchanged unless a new tool is added, which is not
  recommended.

Import/export/sync tests:

- Export/import preserves implementation guidance.
- Workspace catalog sync preserves implementation guidance.
- Local skill sync preview renders implementation guidance in the managed
  section.

Matching/ranking tests:

- Implementation guidance does not affect score.
- Negative routing still suppresses/demotes using `doNotUseWhen`.
- Negative text does not create positive matched signals.
- Match evidence remains compact and does not include large guidance content.

Backward compatibility tests:

- Existing skill rows with no `implementationGuidance` still parse.
- Existing catalog imports without the field still validate.
- Existing skill update proposals without the field still apply.

Full implementation verification:

- `mise x deno@latest -- deno task check`
- `mise x deno@latest -- deno task test`
- `mise x deno@latest -- deno task lint`
- `mise x deno@latest -- deno task fmt`
- `mise x deno@latest -- deno fmt --check README.md CHANGELOG.md docs`
- `git diff --check`

## 11. Backend Agent Handoff

Implementation owner: LOR MCP Backend Implementation Agent.

Exact implementation tasks:

1. Read this plan and current source files before editing.
2. Add `SkillImplementationGuidance` and related types in
   `src/catalog/types.ts`.
3. Extend validation in `src/catalog/validation.ts`.
4. Extend Zod schemas in `src/tools/schemas.ts`.
5. Preserve persistence through existing `skillContext` JSON in
   `src/catalog/sqlite_repository.ts`.
6. Ensure `src/catalog/service.ts` merge/proposal/apply/detail/list/match flows
   preserve guidance correctly.
7. Keep `src/catalog/matcher.ts` from scoring implementation guidance.
8. Decide and implement local skill sync rendering in
   `src/skills/local_skill_sync.ts` only if aligned with docs.
9. Update tests in:
   - `test/tools/schemas_test.ts`
   - `test/catalog/service_test.ts`
   - `test/catalog/sqlite_repository_test.ts`
   - `test/catalog/matcher_test.ts`
   - `test/skills/local_skill_sync_test.ts` if rendering changes
10. Add or update product/docs files listed in section 9.
11. Run the full verification commands from section 10.
12. Commit locally with a concise Conventional Commit message if files change.
    Do not push.

Expected backend output:

- Changed files.
- Behavior changed or preserved.
- Negative keywords versus `negativeRouting.doNotUseWhen` decision.
- Migration/backward compatibility notes.
- Verification commands and exact results.
- Commit SHA and final git status if committed.
- Any unresolved product decisions.

Sequencing requirements:

- Implement schema/types/validation first.
- Add persistence and service merge behavior second.
- Add tests for round-trip and compact matching third.
- Update docs last to match actual behavior.

## 12. Decision Log

- 2026-08-21: Choose `skillContext.implementationGuidance` over reusing
  `usageNotes`, `constraints`, or `examplePrompts` because operational guidance
  is larger and structurally different from routing metadata.
- 2026-08-21: Keep implementation guidance detail-loaded through
  `get_skill_detail`; do not expand match responses with large guidance blocks.
- 2026-08-21: Treat "negative keywords" as author-facing wording for
  `negativeRouting.doNotUseWhen`; do not add a separate `negativeKeywords` field
  now.
- 2026-08-21: Keep implementation guidance out of matching/ranking in v1 so
  routing remains compact, deterministic, and driven by routing-specific fields.
- 2026-08-21: Prefer `propose_skill_update` / `apply_skill_update` for changing
  implementation guidance because those flows already provide approval-gated
  skill context updates.
- 2026-08-21: Implement local skill sync rendering for implementation guidance
  inside the existing LOR-managed section.
