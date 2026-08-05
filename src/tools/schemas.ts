import * as z from "zod/v4";

export const entryTypeSchema = z.enum(["agent", "skill", "subagent"]);
const clearEntryTypeSchema = z.enum(["agent", "skill"]);
const healthEntryTypeSchema = z.enum(["agent", "skill"]);
export const catalogScopeSchema = z.enum(["workspace", "global"]);
export const agentStatusSchema = z.enum(["active", "retired"]);

export const handoffSchema = z.object({
  whenToUse: z.string().trim().min(1),
  handoffPromptTemplate: z.string().trim().min(1),
  requiredContext: z.array(z.string().trim().min(1)),
  expectedOutput: z.string().trim().min(1),
  constraints: z.array(z.string().trim().min(1)),
});

export const workspaceSchema = z.string().trim().min(1);

export const introduceAgentInputSchema = z.object({
  workspace: workspaceSchema,
  scope: z.literal("workspace").optional(),
  codexSessionId: z.string().trim().min(1),
  projectName: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  primarySpecialty: z.string().trim().min(1),
  specialtyTags: z.array(z.string().trim().min(1)).min(1),
  replacesAgentEntryKey: z.string().trim().min(1).optional(),
  handoff: handoffSchema.optional(),
});

export const introduceSkillInputSchema = z.object({
  workspace: workspaceSchema,
  scope: catalogScopeSchema.optional(),
  skillName: z.string().trim().min(1),
  projectName: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  primarySpecialty: z.string().trim().min(1),
  specialtyTags: z.array(z.string().trim().min(1)).min(1),
  skillContext: z.object({
    whenToUse: z.string().trim().min(1).optional(),
    usageNotes: z.string().trim().min(1).optional(),
    constraints: z.array(z.string().trim().min(1)).min(1).optional(),
    examplePrompts: z.array(z.string().trim().min(1)).min(1).optional(),
  }).refine(
    (context) =>
      context.whenToUse !== undefined ||
      context.usageNotes !== undefined ||
      context.constraints !== undefined ||
      context.examplePrompts !== undefined,
    {
      message: "skillContext must include at least one field.",
      path: ["skillContext"],
    },
  ).optional(),
});

const catalogReferenceSchema = z.object({
  entryType: z.enum(["agent", "skill"]),
  name: z.string().trim().min(1),
  scope: catalogScopeSchema.optional(),
  entryKey: z.string().trim().min(1).optional(),
  required: z.boolean().optional(),
}).refine(
  (input) => !(input.entryType === "agent" && input.scope === "global"),
  {
    message: "Agent references only support workspace scope.",
    path: ["scope"],
  },
);

export const introduceSubagentInputSchema = z.object({
  workspace: workspaceSchema,
  scope: catalogScopeSchema.optional(),
  name: z.string().trim().min(1),
  projectName: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  purpose: z.string().trim().min(1),
  limitedScope: z.string().trim().min(1),
  primarySpecialty: z.string().trim().min(1),
  specialtyTags: z.array(z.string().trim().min(1)).min(1),
  agentReferences: z.array(
    catalogReferenceSchema.refine((input) => input.entryType === "agent", {
      message: "agentReferences must contain agent references.",
      path: ["entryType"],
    }),
  ).optional(),
  skillReferences: z.array(
    catalogReferenceSchema.refine((input) => input.entryType === "skill", {
      message: "skillReferences must contain skill references.",
      path: ["entryType"],
    }),
  ).optional(),
  promptTemplate: z.string().trim().min(1).optional(),
  constraints: z.array(z.string().trim().min(1)).min(1).optional(),
  expectedOutput: z.string().trim().min(1).optional(),
});

export const listCatalogEntriesInputSchema = z.object({
  workspace: workspaceSchema,
  entryType: entryTypeSchema.optional(),
  projectName: z.string().trim().min(1).optional(),
  scope: catalogScopeSchema.optional(),
}).refine(
  (input) => !(input.entryType === "agent" && input.scope === "global"),
  {
    message: "Agents only support workspace scope.",
    path: ["scope"],
  },
);

export const clearWorkspaceCatalogInputSchema = z.object({
  workspace: workspaceSchema,
  confirm: z.literal(true),
  entryType: clearEntryTypeSchema.optional(),
});

export const registerWorkspaceAliasInputSchema = z.object({
  workspace: workspaceSchema,
  alias: workspaceSchema,
  confirm: z.literal(true).optional(),
});

export const getCatalogEntryDetailInputSchema = z.object({
  workspace: workspaceSchema,
  entryType: entryTypeSchema,
  entryKey: z.string().trim().min(1),
  scope: catalogScopeSchema.optional(),
}).refine(
  (input) => !(input.entryType === "agent" && input.scope === "global"),
  {
    message: "Agents only support workspace scope.",
    path: ["scope"],
  },
);

export const updateCatalogEntryInputSchema = z.object({
  workspace: workspaceSchema,
  entryType: entryTypeSchema,
  entryKey: z.string().trim().min(1),
  scope: catalogScopeSchema.optional(),
  projectName: z.string().trim().min(1).optional(),
  displayName: z.string().trim().min(1).optional(),
  primarySpecialty: z.string().trim().min(1).optional(),
  specialtyTags: z.array(z.string().trim().min(1)).min(1).optional(),
}).refine(
  (input) => !(input.entryType === "agent" && input.scope === "global"),
  {
    message: "Agents only support workspace scope.",
    path: ["scope"],
  },
).refine(
  (input) =>
    input.projectName !== undefined ||
    input.displayName !== undefined ||
    input.primarySpecialty !== undefined ||
    input.specialtyTags !== undefined,
  {
    message: "At least one editable field is required.",
    path: ["update"],
  },
);

export const promoteSkillToGlobalInputSchema = z.object({
  workspace: workspaceSchema,
  skillName: z.string().trim().min(1),
});

export const retireAgentInputSchema = z.object({
  workspace: workspaceSchema,
  agentEntryKey: z.string().trim().min(1),
  reason: z.string().trim().min(1).optional(),
  replacedByAgentEntryKey: z.string().trim().min(1).optional(),
  confirm: z.literal(true),
});

const skillContextSchema = z.object({
  whenToUse: z.string().trim().min(1).optional(),
  usageNotes: z.string().trim().min(1).optional(),
  constraints: z.array(z.string().trim().min(1)).min(1).optional(),
  examplePrompts: z.array(z.string().trim().min(1)).min(1).optional(),
}).refine(
  (context) =>
    context.whenToUse !== undefined ||
    context.usageNotes !== undefined ||
    context.constraints !== undefined ||
    context.examplePrompts !== undefined,
  {
    message: "skillContext must include at least one field.",
    path: ["skillContext"],
  },
);

const skillMetadataUpdateSchema = z.object({
  projectName: z.string().trim().min(1).optional(),
  displayName: z.string().trim().min(1).optional(),
  primarySpecialty: z.string().trim().min(1).optional(),
  specialtyTags: z.array(z.string().trim().min(1)).min(1).optional(),
}).refine(
  (metadata) =>
    metadata.projectName !== undefined ||
    metadata.displayName !== undefined ||
    metadata.primarySpecialty !== undefined ||
    metadata.specialtyTags !== undefined,
  {
    message: "metadata must include at least one field.",
    path: ["metadata"],
  },
);

export const proposeSkillUpdateInputSchema = z.object({
  workspace: workspaceSchema,
  scope: catalogScopeSchema.optional(),
  skillName: z.string().trim().min(1),
  reason: z.string().trim().min(1),
  skillContext: skillContextSchema.optional(),
  metadata: skillMetadataUpdateSchema.optional(),
}).refine(
  (input) => input.skillContext !== undefined || input.metadata !== undefined,
  {
    message: "At least one skillContext or metadata field is required.",
    path: ["update"],
  },
);

export const applySkillUpdateInputSchema = z.object({
  workspace: workspaceSchema,
  scope: catalogScopeSchema.optional(),
  proposalId: z.string().trim().min(1),
  confirm: z.literal(true),
});

export const previewSkillFileSyncInputSchema = z.object({
  workspace: workspaceSchema,
  scope: catalogScopeSchema.optional(),
  skillName: z.string().trim().min(1),
  proposalId: z.string().trim().min(1),
});

export const applySkillFileSyncInputSchema = previewSkillFileSyncInputSchema
  .extend({
    confirm: z.literal(true),
  });

export const removeCatalogEntryInputSchema = z.object({
  workspace: workspaceSchema,
  entryType: entryTypeSchema,
  entryKey: z.string().trim().min(1),
  scope: catalogScopeSchema.optional(),
}).refine(
  (input) => !(input.entryType === "agent" && input.scope === "global"),
  {
    message: "Agents only support workspace scope.",
    path: ["scope"],
  },
);

export const exportCatalogInputSchema = z.object({
  workspace: workspaceSchema,
  entryType: entryTypeSchema.optional(),
  projectName: z.string().trim().min(1).optional(),
});

const verificationStatusSchema = z.enum(["verified", "unverified", "unknown"]);

const exportAgentEntrySchema = z.object({
  entryType: z.literal("agent"),
  codexSessionId: z.string().trim().min(1),
  agentStatus: agentStatusSchema.optional(),
  retiredAt: z.string().trim().min(1).optional(),
  retirementReason: z.string().trim().min(1).optional(),
  replacedByAgentEntryKey: z.string().trim().min(1).optional(),
  replacesAgentEntryKey: z.string().trim().min(1).optional(),
  projectName: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  primarySpecialty: z.string().trim().min(1),
  specialtyTags: z.array(z.string().trim().min(1)).min(1),
  handoff: handoffSchema.optional(),
  verificationStatus: verificationStatusSchema,
  verificationSource: z.string().trim().min(1),
  verifiedAt: z.string().trim().min(1),
  verificationMessage: z.string().trim().min(1).optional(),
});

const exportSkillEntrySchema = z.object({
  entryType: z.literal("skill"),
  skillName: z.string().trim().min(1),
  projectName: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  primarySpecialty: z.string().trim().min(1),
  specialtyTags: z.array(z.string().trim().min(1)).min(1),
  verificationStatus: verificationStatusSchema,
  verificationSource: z.string().trim().min(1),
  verifiedAt: z.string().trim().min(1),
  verificationMessage: z.string().trim().min(1).optional(),
  skillContext: skillContextSchema.optional(),
});

const exportSubagentEntrySchema = z.object({
  entryType: z.literal("subagent"),
  name: z.string().trim().min(1),
  projectName: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  purpose: z.string().trim().min(1),
  limitedScope: z.string().trim().min(1),
  primarySpecialty: z.string().trim().min(1),
  specialtyTags: z.array(z.string().trim().min(1)).min(1),
  agentReferences: z.array(catalogReferenceSchema),
  skillReferences: z.array(catalogReferenceSchema),
  unresolvedReferences: z.array(catalogReferenceSchema),
  promptTemplate: z.string().trim().min(1).optional(),
  constraints: z.array(z.string().trim().min(1)),
  expectedOutput: z.string().trim().min(1),
  verificationStatus: verificationStatusSchema,
  verificationSource: z.string().trim().min(1),
  verifiedAt: z.string().trim().min(1),
  verificationMessage: z.string().trim().min(1).optional(),
});

export const importCatalogInputSchema = z.object({
  workspace: workspaceSchema,
  conflictStrategy: z.enum(["skip", "fail"]).optional(),
  catalog: z.object({
    version: z.literal(1),
    exportedAt: z.string().trim().min(1),
    workspace: z.string().trim().min(1),
    filters: z.object({
      entryType: entryTypeSchema.optional(),
      projectName: z.string().trim().min(1).optional(),
    }),
    entries: z.array(z.discriminatedUnion("entryType", [
      exportAgentEntrySchema,
      exportSkillEntrySchema,
      exportSubagentEntrySchema,
    ])),
  }),
});

const workspaceCatalogSyncBaseInputSchema = z.object({
  sourceWorkspace: workspaceSchema,
  targetWorkspace: workspaceSchema,
  projectName: z.string().trim().min(1).optional(),
  skillNames: z.array(z.string().trim().min(1)).min(1).optional(),
  subagentNames: z.array(z.string().trim().min(1)).min(1).optional(),
  agentPromptRoles: z.array(z.string().trim().min(1)).min(1).optional(),
});

export const previewWorkspaceCatalogSyncInputSchema =
  workspaceCatalogSyncBaseInputSchema;

export const applyWorkspaceCatalogSyncInputSchema =
  workspaceCatalogSyncBaseInputSchema.extend({
    confirm: z.literal(true),
  });

export const checkCatalogHealthInputSchema = z.object({
  workspace: workspaceSchema,
  entryType: healthEntryTypeSchema.optional(),
  projectName: z.string().trim().min(1).optional(),
  entryKey: z.string().trim().min(1).optional(),
  scope: catalogScopeSchema.optional(),
}).refine(
  (input) => input.entryKey === undefined || input.entryType !== undefined,
  {
    message: "entryType is required when entryKey is provided.",
    path: ["entryType"],
  },
).refine(
  (input) => !(input.entryType === "agent" && input.scope === "global"),
  {
    message: "Agents only support workspace scope.",
    path: ["scope"],
  },
);

export const prepareAgentHandoffInputSchema = z.object({
  workspace: workspaceSchema,
  agentEntryKey: z.string().trim().min(1),
  task: z.string().trim().min(1),
  context: z.string().trim().min(1).optional(),
});

export const sendAgentTaskInputSchema = z.object({
  workspace: workspaceSchema,
  agentEntryKey: z.string().trim().min(1),
  task: z.string().trim().min(1),
  context: z.string().trim().min(1).optional(),
});

export const getAgentTaskStatusInputSchema = z.object({
  workspace: workspaceSchema,
  taskId: z.string().trim().min(1),
});

export const listActiveTasksInputSchema = z.object({
  workspace: workspaceSchema,
  agentEntryKey: z.string().trim().min(1).optional(),
});

export const appendAgentContextInputSchema = z.object({
  workspace: workspaceSchema,
  taskId: z.string().trim().min(1),
  message: z.string().trim().min(1),
});

export const getAgentTaskResultInputSchema = z.object({
  workspace: workspaceSchema,
  taskId: z.string().trim().min(1),
});

export const prepareAgentRegenerationInputSchema = z.object({
  workspace: workspaceSchema,
  agentEntryKey: z.string().trim().min(1),
  reason: z.string().trim().min(1).optional(),
  carryForwardContext: z.string().trim().min(1).optional(),
  replacementTask: z.string().trim().min(1).optional(),
  includeRegistrationInstructions: z.boolean().optional(),
});

export const generateAgentPromptInputSchema = z.object({
  workspace: workspaceSchema,
  role: z.string().trim().min(1),
  projectName: z.string().trim().min(1).optional(),
  task: z.string().trim().min(1).optional(),
  context: z.string().trim().min(1).optional(),
  constraints: z.string().trim().min(1).optional(),
});

export const findMatchingCatalogEntryInputSchema = z.object({
  workspace: workspaceSchema,
  task: z.string().trim().min(1),
  projectName: z.string().trim().min(1).optional(),
  preferredType: entryTypeSchema.optional(),
  specialtyHints: z.array(z.string().trim().min(1)).optional(),
});

export type IntroduceAgentToolInput = z.infer<typeof introduceAgentInputSchema>;
export type IntroduceSkillToolInput = z.infer<typeof introduceSkillInputSchema>;
export type IntroduceSubagentToolInput = z.infer<
  typeof introduceSubagentInputSchema
>;
export type ListCatalogEntriesToolInput = z.infer<
  typeof listCatalogEntriesInputSchema
>;
export type ClearWorkspaceCatalogToolInput = z.infer<
  typeof clearWorkspaceCatalogInputSchema
>;
export type RegisterWorkspaceAliasToolInput = z.infer<
  typeof registerWorkspaceAliasInputSchema
>;
export type PromoteSkillToGlobalToolInput = z.infer<
  typeof promoteSkillToGlobalInputSchema
>;
export type GetCatalogEntryDetailToolInput = z.infer<
  typeof getCatalogEntryDetailInputSchema
>;
export type UpdateCatalogEntryToolInput = z.infer<
  typeof updateCatalogEntryInputSchema
>;
export type RetireAgentToolInput = z.infer<typeof retireAgentInputSchema>;
export type ProposeSkillUpdateToolInput = z.infer<
  typeof proposeSkillUpdateInputSchema
>;
export type ApplySkillUpdateToolInput = z.infer<
  typeof applySkillUpdateInputSchema
>;
export type PreviewSkillFileSyncToolInput = z.infer<
  typeof previewSkillFileSyncInputSchema
>;
export type ApplySkillFileSyncToolInput = z.infer<
  typeof applySkillFileSyncInputSchema
>;
export type RemoveCatalogEntryToolInput = z.infer<
  typeof removeCatalogEntryInputSchema
>;
export type ExportCatalogToolInput = z.infer<typeof exportCatalogInputSchema>;
export type ImportCatalogToolInput = z.infer<typeof importCatalogInputSchema>;
export type PreviewWorkspaceCatalogSyncToolInput = z.infer<
  typeof previewWorkspaceCatalogSyncInputSchema
>;
export type ApplyWorkspaceCatalogSyncToolInput = z.infer<
  typeof applyWorkspaceCatalogSyncInputSchema
>;
export type CheckCatalogHealthToolInput = z.infer<
  typeof checkCatalogHealthInputSchema
>;
export type PrepareAgentHandoffToolInput = z.infer<
  typeof prepareAgentHandoffInputSchema
>;
export type SendAgentTaskToolInput = z.infer<typeof sendAgentTaskInputSchema>;
export type GetAgentTaskStatusToolInput = z.infer<
  typeof getAgentTaskStatusInputSchema
>;
export type ListActiveTasksToolInput = z.infer<
  typeof listActiveTasksInputSchema
>;
export type AppendAgentContextToolInput = z.infer<
  typeof appendAgentContextInputSchema
>;
export type GetAgentTaskResultToolInput = z.infer<
  typeof getAgentTaskResultInputSchema
>;
export type PrepareAgentRegenerationToolInput = z.infer<
  typeof prepareAgentRegenerationInputSchema
>;
export type GenerateAgentPromptToolInput = z.infer<
  typeof generateAgentPromptInputSchema
>;
export type FindMatchingCatalogEntryToolInput = z.infer<
  typeof findMatchingCatalogEntryInputSchema
>;

export const toolOutputSchema = {
  status: z.enum(["ok", "no_match", "conflict", "error"]),
  data: z.unknown().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
};
