import * as z from "zod/v4";
import {
  importCatalogInputSchema,
  introduceSkillInputSchema,
  introduceSubagentInputSchema,
} from "@src/tools/schemas.ts";

const text = z.string();
const count = z.number().int().nonnegative();
const jsonObject = z.record(text, z.json());
const base = {
  revision: text.optional(),
  workspace: text,
  scope: z.enum(["workspace", "global"]),
  entryKey: text,
  createdAt: text,
  updatedAt: text,
};
const verification = {
  verificationStatus: z.enum(["verified", "unverified", "unknown"]),
  verificationSource: text,
  verifiedAt: text,
  verificationMessage: text.optional(),
};
const skill = z.object({
  ...introduceSkillInputSchema.shape,
  ...base,
  ...verification,
  entryType: z.literal("skill"),
});
const subagent = z.object({
  ...introduceSubagentInputSchema.shape,
  constraints: z.array(text),
  ...base,
  ...verification,
  entryType: z.literal("subagent"),
  prompt: text,
  unresolvedReferences: z.array(jsonObject),
});
const summary = z.object({
  scope: base.scope,
  entryType: z.enum(["skill", "subagent", "agent"]),
  entryKey: text,
  displayName: text,
  projectName: text,
  primarySpecialty: text,
  specialtyTags: z.array(text),
}).catchall(z.json());
const note = z.object({
  noteId: text,
  workspace: text,
  title: text,
  body: text,
  tags: z.array(text),
  createdAt: text,
  updatedAt: text,
});
const noteSummary = note.omit({ body: true }).catchall(z.json());
const notes = z.object({
  workspace: text,
  filters: jsonObject,
  notes: z.array(noteSummary),
}).catchall(z.json());
const proposal = z.object({
  proposalId: text,
  workspace: text,
  scope: base.scope,
  skillName: text,
  reason: text,
  status: z.enum(["pending", "applied"]),
  createdAt: text,
}).catchall(z.json());
const proposalResult = z.object({ proposal, before: skill, after: skill });
const sync = z.object({
  workspace: text,
  skillName: text,
  proposalId: text,
  targetFile: z.literal("SKILL.md"),
  sectionName: text,
  sectionExists: z.boolean(),
  wouldChange: z.boolean(),
  renderedSection: text,
}).catchall(z.json());
const matches = z.object({
  agents: z.array(summary),
  skills: z.array(summary),
  subagents: z.array(summary),
  agentsAmbiguous: z.boolean(),
}).catchall(z.json());
const removed = z.object({
  workspace: text,
  entryType: z.enum(["skill", "subagent"]),
  entryKey: text,
  scope: base.scope.optional(),
  removed: z.literal(true),
});
const report = z.object({ workspace: text, summary: jsonObject }).catchall(
  z.json(),
);

const outputs: Record<string, z.ZodType> = {
  get_operation: z.object({
    operationKey: text,
    status: z.enum(["pending", "completed"]),
    createdAt: text,
  }),
  introduce_skill: skill,
  get_skill_detail: skill,
  update_skill: skill,
  introduce_subagent: subagent,
  get_subagent_detail: subagent,
  update_subagent: subagent,
  list_skills: z.object({ skills: z.array(summary) }).catchall(z.json()),
  list_subagents: z.object({ subagents: z.array(summary) }).catchall(z.json()),
  clear_workspace_skills: z.object({ workspace: text, deletedSkills: count })
    .catchall(z.json()),
  clear_workspace_subagents: z.object({
    workspace: text,
    deletedSubagents: count,
  }).catchall(z.json()),
  register_workspace_alias: z.object({
    workspace: text,
    alias: text,
    created: z.boolean(),
    reassigned: z.boolean(),
  }),
  promote_skill_to_global: z.object({
    workspace: text,
    sourceSkill: skill,
    globalSkill: skill,
    promoted: z.literal(true),
  }),
  propose_skill_update: proposalResult,
  apply_skill_update: proposalResult,
  preview_skill_file_sync: sync,
  apply_skill_file_sync: sync.extend({ written: z.boolean() }),
  remove_skill: removed,
  remove_subagent: removed,
  export_catalog: importCatalogInputSchema.shape.catalog,
  import_catalog: z.object({
    workspace: text,
    version: z.literal(1),
    conflictStrategy: z.enum(["skip", "fail"]),
    importedCount: count,
    skippedCount: count,
    failedCount: count,
    errors: z.array(
      z.object({ index: count, code: text, message: text }).catchall(z.json()),
    ),
  }),
  preview_workspace_catalog_sync: z.object({
    sourceWorkspace: text,
    targetWorkspace: text,
    summary: jsonObject,
  }).catchall(z.json()),
  apply_workspace_catalog_sync: z.object({
    sourceWorkspace: text,
    targetWorkspace: text,
    summary: jsonObject,
  }).catchall(z.json()),
  check_catalog_health: report,
  get_workspace_diagnostics: z.object({
    inputWorkspace: text,
    resolvedWorkspace: text,
    aliases: z.array(text),
    catalogCounts: jsonObject,
    storageStatus: jsonObject,
    runtimeStatus: jsonObject,
    localContext: jsonObject,
    checkedAt: text,
  }),
  get_usage_analytics: report,
  remember_workspace_note: note,
  get_workspace_note: note,
  list_workspace_notes: notes,
  find_matching_workspace_note: notes,
  remove_workspace_note: z.object({
    workspace: text,
    noteId: text,
    removed: z.boolean(),
  }),
  generate_agent_prompt: z.object({ role: text, prompt: text }).catchall(
    z.json(),
  ),
  find_matching_skill: matches,
  find_matching_subagent: matches,
};

export function outputSchemaFor(name: string) {
  const data = outputs[name];
  if (!data) throw new Error(`Missing output schema for ${name}`);
  return z.object({
    status: z.enum(["ok", "no_match", "conflict", "error"]),
    data: data.optional(),
    error: z.object({
      code: text,
      message: text,
      details: jsonObject.optional(),
    }).catchall(z.json()).optional(),
  }).catchall(z.json()).superRefine((result, ctx) => {
    if (
      result.status === "error"
        ? !result.error || result.data !== undefined
        : result.data === undefined || result.error !== undefined
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Result must contain either successful data or an execution error.",
      });
    }
  });
}
