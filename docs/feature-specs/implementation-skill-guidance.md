# Implementation Skill Guidance

## 1. Summary

Implemented for V2. This feature adds optional, detail-loaded implementation
guidance to registered skill context so a matched skill can guide real feature
work without bloating list or match responses.

## 2. Goals

- Let skill authors store practical implementation guidance alongside compact
  routing metadata.
- Keep matching deterministic and driven only by routing-specific fields.
- Keep `list_skills` and `find_matching_skill` responses compact.
- Preserve full guidance through detail reads, export/import, workspace sync,
  and approved local skill sync.
- Support approval-gated proposal and apply flows for substantial guidance
  changes.

## 3. Non-Goals

- Add a new MCP tool for skill guidance.
- Score implementation guidance during matching.
- Replace `whenToUse`, `usageNotes`, `constraints`, `examplePrompts`, or
  `negativeRouting`.
- Add a separate `negativeKeywords` field.
- Write local `SKILL.md` files outside the existing preview/apply sync flow.

## 4. Functional Requirements

- Skill entries may include optional `skillContext.implementationGuidance`.
- `implementationGuidance` may include:
  - `firstInspect`
  - `implementationRules`
  - `commonFixPatterns`
  - `testsToAdd`
  - `verification`
  - `handoffChecklist`
- `commonFixPatterns` entries must include `problem` and `approach`; they may
  include `antiPattern`.
- Empty implementation guidance objects must be rejected.
- `introduce_skill` may create a skill with implementation guidance.
- `propose_skill_update` and `apply_skill_update` may create, replace, or clear
  implementation guidance.
- `get_skill_detail`, export/import, and workspace catalog sync must preserve
  full implementation guidance.
- `list_skills` and `find_matching_skill` must not include full implementation
  guidance.
- Matching must not score implementation guidance.
- Local skill sync must render implementation guidance only inside the
  LOR-managed section and only through the existing confirmation-gated apply
  flow.

## 5. Use Cases

- [Use Implementation Skill Guidance For Feature Work](../use-cases/use-implementation-skill-guidance-for-feature-work.md)

## 6. Data Model

Conceptual shape:

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

The field is stored under `skillContext.implementationGuidance` in the existing
skill context JSON.

## 7. Error Handling

- Empty guidance objects return `validation_error`.
- Empty or blank section items return `validation_error`.
- Missing `problem` or `approach` in a common fix pattern returns
  `validation_error`.
- `implementationGuidance: null` is accepted only in approval-gated skill update
  proposals to clear existing guidance.

## 8. Security and Permissions

- Guidance is normal catalog metadata and follows the owning skill scope.
- Local skill file writes remain limited to configured skill roots and require
  `apply_skill_file_sync` with `confirm: true`.
- Match responses avoid returning large guidance blocks by default.

## 9. Decision Log

- 2026-08-21: Store guidance under `skillContext.implementationGuidance` instead
  of adding a new table or column.
- 2026-08-21: Keep guidance out of matching and compact responses; callers use
  `get_skill_detail` for full operational instructions.
- 2026-08-21: Render guidance in local skill sync because it remains inside the
  existing preview/apply approval gate.
