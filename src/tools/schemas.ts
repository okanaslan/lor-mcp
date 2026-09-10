import * as z from "zod/v4";
const boundedArray = <T extends z.ZodType>(schema: T) =>
  z.array(schema).max(128);

export const entryTypeSchema = z.enum(["agent", "skill", "subagent"]);
const healthEntryTypeSchema = z.enum(["agent", "skill"]);
const usageEntryTypeSchema = z.enum(["skill", "subagent", "note"]);
export const catalogScopeSchema = z.enum(["workspace", "global"]);
export const agentStatusSchema = z.enum(["active", "retired"]);

const routingSignalSources = [
  "aliases",
  "skillName",
  "subagentName",
  "displayName",
  "projectName",
  "primarySpecialty",
  "specialtyTags",
  "intent",
  "intentFamily",
  "positiveIntents",
  "excludedIntents",
  "positiveKeywords",
  "negativeIntents",
  "domain",
  "outputNeed",
  "requiredAny",
  "requiredAll",
  "examplePrompts",
  "usageNotes",
  "bodyText",
] as const;
const routingStringListSchema = boundedArray(
  z.string().max(16000).trim().min(1).max(120),
).min(1);
const routingFieldWeightsSchema = z.strictObject(
  Object.fromEntries(
    routingSignalSources.map((source) => [
      source,
      z.number().int().min(0).max(100).optional(),
    ]),
  ) as Record<typeof routingSignalSources[number], z.ZodOptional<z.ZodNumber>>,
).partial().refine((weights) => Object.keys(weights).length > 0, {
  message: "fieldWeights must include at least one source.",
  path: ["fieldWeights"],
});
const routingMetadataSchema = z.strictObject({
  intentFamily: z.string().max(16000).trim().min(1).max(120).optional(),
  intents: routingStringListSchema.optional(),
  positiveIntents: routingStringListSchema.optional(),
  excludedIntents: routingStringListSchema.optional(),
  negativeIntents: routingStringListSchema.optional(),
  aliases: routingStringListSchema.optional(),
  positiveKeywords: routingStringListSchema.optional(),
  negativeKeywords: routingStringListSchema.optional(),
  requiredAny: routingStringListSchema.optional(),
  requiredAll: routingStringListSchema.optional(),
  domain: routingStringListSchema.optional(),
  outputNeed: routingStringListSchema.optional(),
  softNegativeExamples: routingStringListSchema.optional(),
  fieldWeights: routingFieldWeightsSchema.optional(),
}).refine(
  (routing) =>
    routing.intentFamily !== undefined ||
    routing.intents !== undefined ||
    routing.positiveIntents !== undefined ||
    routing.excludedIntents !== undefined ||
    routing.negativeIntents !== undefined ||
    routing.aliases !== undefined ||
    routing.positiveKeywords !== undefined ||
    routing.negativeKeywords !== undefined ||
    routing.requiredAny !== undefined ||
    routing.requiredAll !== undefined ||
    routing.domain !== undefined ||
    routing.outputNeed !== undefined ||
    routing.softNegativeExamples !== undefined ||
    routing.fieldWeights !== undefined,
  {
    message: "routing must include at least one field.",
    path: ["routing"],
  },
);

export const handoffSchema = z.strictObject({
  whenToUse: z.string().max(16000).trim().min(1),
  handoffPromptTemplate: z.string().max(16000).trim().min(1),
  requiredContext: boundedArray(z.string().max(16000).trim().min(1)),
  expectedOutput: z.string().max(16000).trim().min(1),
  constraints: boundedArray(z.string().max(16000).trim().min(1)),
});

export const workspaceSchema = z.string().max(16000).trim().min(1);

const negativeRoutingSchema = z.strictObject({
  doNotUseWhen: boundedArray(z.string().max(16000).trim().min(1).max(240)).min(
    1,
  ),
  insteadUse: boundedArray(z.string().max(16000).trim().min(1)).min(1)
    .optional(),
  notes: z.string().max(16000).trim().min(1).max(1000).optional(),
});

const implementationGuidanceSchema = z.strictObject({
  firstInspect: boundedArray(z.string().max(16000).trim().min(1).max(500)).min(
    1,
  ).optional(),
  implementationRules: boundedArray(
    z.string().max(16000).trim().min(1).max(500),
  ).min(1)
    .optional(),
  commonFixPatterns: boundedArray(z.strictObject({
    problem: z.string().max(16000).trim().min(1).max(500),
    approach: z.string().max(16000).trim().min(1).max(500),
    antiPattern: z.string().max(16000).trim().min(1).max(500).optional(),
  })).min(1).optional(),
  testsToAdd: boundedArray(z.string().max(16000).trim().min(1).max(500)).min(1)
    .optional(),
  verification: boundedArray(z.string().max(16000).trim().min(1).max(500)).min(
    1,
  ).optional(),
  handoffChecklist: boundedArray(z.string().max(16000).trim().min(1).max(500))
    .min(1)
    .optional(),
}).refine(
  (guidance) =>
    guidance.firstInspect !== undefined ||
    guidance.implementationRules !== undefined ||
    guidance.commonFixPatterns !== undefined ||
    guidance.testsToAdd !== undefined ||
    guidance.verification !== undefined ||
    guidance.handoffChecklist !== undefined,
  {
    message: "implementationGuidance must include at least one section.",
    path: ["implementationGuidance"],
  },
);

export const introduceSkillInputSchema = z.strictObject({
  idempotencyKey: z.string().min(1).max(120).optional(),
  workspace: workspaceSchema,
  scope: catalogScopeSchema.optional(),
  skillName: z.string().max(16000).trim().min(1),
  projectName: z.string().max(16000).trim().min(1),
  displayName: z.string().max(16000).trim().min(1),
  primarySpecialty: z.string().max(16000).trim().min(1),
  specialtyTags: boundedArray(z.string().max(16000).trim().min(1)).min(1),
  routing: routingMetadataSchema.optional(),
  skillContext: z.strictObject({
    whenToUse: z.string().max(16000).trim().min(1).optional(),
    usageNotes: z.string().max(16000).trim().min(1).optional(),
    constraints: boundedArray(z.string().max(16000).trim().min(1)).min(1)
      .optional(),
    examplePrompts: boundedArray(z.string().max(16000).trim().min(1)).min(1)
      .optional(),
    negativeRouting: negativeRoutingSchema.optional(),
    implementationGuidance: implementationGuidanceSchema.optional(),
  }).refine(
    (context) =>
      context.whenToUse !== undefined ||
      context.usageNotes !== undefined ||
      context.constraints !== undefined ||
      context.examplePrompts !== undefined ||
      context.negativeRouting !== undefined ||
      context.implementationGuidance !== undefined,
    {
      message: "skillContext must include at least one field.",
      path: ["skillContext"],
    },
  ).optional(),
});

const catalogReferenceSchema = z.strictObject({
  entryType: z.enum(["agent", "skill"]),
  name: z.string().max(16000).trim().min(1),
  scope: catalogScopeSchema.optional(),
  entryKey: z.string().max(16000).trim().min(1).optional(),
  required: z.boolean().optional(),
}).refine(
  (input) => !(input.entryType === "agent" && input.scope === "global"),
  {
    message: "Agent references only support workspace scope.",
    path: ["scope"],
  },
);

export const introduceSubagentInputSchema = z.strictObject({
  idempotencyKey: z.string().min(1).max(120).optional(),
  workspace: workspaceSchema,
  scope: catalogScopeSchema.optional(),
  name: z.string().max(16000).trim().min(1),
  projectName: z.string().max(16000).trim().min(1),
  displayName: z.string().max(16000).trim().min(1),
  purpose: z.string().max(16000).trim().min(1),
  limitedScope: z.string().max(16000).trim().min(1),
  primarySpecialty: z.string().max(16000).trim().min(1),
  specialtyTags: boundedArray(z.string().max(16000).trim().min(1)).min(1),
  agentReferences: boundedArray(
    catalogReferenceSchema.refine((input) => input.entryType === "agent", {
      message: "agentReferences must contain agent references.",
      path: ["entryType"],
    }),
  ).optional(),
  skillReferences: boundedArray(
    catalogReferenceSchema.refine((input) => input.entryType === "skill", {
      message: "skillReferences must contain skill references.",
      path: ["entryType"],
    }),
  ).optional(),
  promptTemplate: z.string().max(16000).trim().min(1).optional(),
  constraints: boundedArray(z.string().max(16000).trim().min(1)).min(1)
    .optional(),
  expectedOutput: z.string().max(16000).trim().min(1).optional(),
  negativeRouting: negativeRoutingSchema.optional(),
  routing: routingMetadataSchema.optional(),
});

export const listSkillsInputSchema = z.strictObject({
  cursor: z.string().max(512).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  workspace: workspaceSchema,
  projectName: z.string().max(16000).trim().min(1).optional(),
  scope: catalogScopeSchema.optional(),
});

export const listSubagentsInputSchema = z.strictObject({
  cursor: z.string().max(512).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  workspace: workspaceSchema,
  projectName: z.string().max(16000).trim().min(1).optional(),
  scope: catalogScopeSchema.optional(),
});

export const clearWorkspaceSkillsInputSchema = z.strictObject({
  workspace: workspaceSchema,
  confirm: z.literal(true),
});

export const clearWorkspaceSubagentsInputSchema = z.strictObject({
  workspace: workspaceSchema,
  confirm: z.literal(true),
});

export const registerWorkspaceAliasInputSchema = z.strictObject({
  workspace: workspaceSchema,
  alias: workspaceSchema,
  confirm: z.literal(true).optional(),
});

export const getSkillDetailInputSchema = z.strictObject({
  workspace: workspaceSchema,
  skillName: z.string().max(16000).trim().min(1),
  scope: catalogScopeSchema.optional(),
});

export const getSubagentDetailInputSchema = z.strictObject({
  workspace: workspaceSchema,
  subagentName: z.string().max(16000).trim().min(1),
  scope: catalogScopeSchema.optional(),
});

const commonMetadataUpdateFields = {
  projectName: z.string().max(16000).trim().min(1).optional(),
  displayName: z.string().max(16000).trim().min(1).optional(),
  primarySpecialty: z.string().max(16000).trim().min(1).optional(),
  specialtyTags: boundedArray(z.string().max(16000).trim().min(1)).min(1)
    .optional(),
  negativeRouting: negativeRoutingSchema.nullable().optional(),
  routing: routingMetadataSchema.nullable().optional(),
};

function hasCommonMetadataUpdate(
  input: {
    projectName?: unknown;
    displayName?: unknown;
    primarySpecialty?: unknown;
    specialtyTags?: unknown;
    negativeRouting?: unknown;
    routing?: unknown;
  },
): boolean {
  return input.projectName !== undefined ||
    input.displayName !== undefined ||
    input.primarySpecialty !== undefined ||
    input.specialtyTags !== undefined ||
    input.negativeRouting !== undefined ||
    input.routing !== undefined;
}

export const updateSkillInputSchema = z.strictObject({
  idempotencyKey: z.string().min(1).max(120).optional(),
  expectedRevision: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  workspace: workspaceSchema,
  skillName: z.string().max(16000).trim().min(1),
  scope: catalogScopeSchema.optional(),
  ...commonMetadataUpdateFields,
}).refine(hasCommonMetadataUpdate, {
  message: "At least one editable field is required.",
  path: ["update"],
});

export const updateSubagentInputSchema = z.strictObject({
  idempotencyKey: z.string().min(1).max(120).optional(),
  expectedRevision: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  workspace: workspaceSchema,
  subagentName: z.string().max(16000).trim().min(1),
  scope: catalogScopeSchema.optional(),
  ...commonMetadataUpdateFields,
}).refine(hasCommonMetadataUpdate, {
  message: "At least one editable field is required.",
  path: ["update"],
});

export const promoteSkillToGlobalInputSchema = z.strictObject({
  workspace: workspaceSchema,
  skillName: z.string().max(16000).trim().min(1),
});

const skillContextSchema = z.strictObject({
  whenToUse: z.string().max(16000).trim().min(1).optional(),
  usageNotes: z.string().max(16000).trim().min(1).optional(),
  constraints: boundedArray(z.string().max(16000).trim().min(1)).min(1)
    .optional(),
  examplePrompts: boundedArray(z.string().max(16000).trim().min(1)).min(1)
    .optional(),
  negativeRouting: negativeRoutingSchema.nullable().optional(),
  implementationGuidance: implementationGuidanceSchema.nullable().optional(),
}).refine(
  (context) =>
    context.whenToUse !== undefined ||
    context.usageNotes !== undefined ||
    context.constraints !== undefined ||
    context.examplePrompts !== undefined ||
    context.negativeRouting !== undefined ||
    context.implementationGuidance !== undefined,
  {
    message: "skillContext must include at least one field.",
    path: ["skillContext"],
  },
);

const skillMetadataUpdateSchema = z.strictObject({
  projectName: z.string().max(16000).trim().min(1).optional(),
  displayName: z.string().max(16000).trim().min(1).optional(),
  primarySpecialty: z.string().max(16000).trim().min(1).optional(),
  specialtyTags: boundedArray(z.string().max(16000).trim().min(1)).min(1)
    .optional(),
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

export const proposeSkillUpdateInputSchema = z.strictObject({
  workspace: workspaceSchema,
  scope: catalogScopeSchema.optional(),
  skillName: z.string().max(16000).trim().min(1),
  reason: z.string().max(16000).trim().min(1),
  skillContext: skillContextSchema.optional(),
  metadata: skillMetadataUpdateSchema.optional(),
  routing: routingMetadataSchema.nullable().optional(),
}).refine(
  (input) =>
    input.skillContext !== undefined ||
    input.metadata !== undefined ||
    input.routing !== undefined,
  {
    message:
      "At least one skillContext, metadata, or routing field is required.",
    path: ["update"],
  },
);

export const applySkillUpdateInputSchema = z.strictObject({
  idempotencyKey: z.string().min(1).max(120).optional(),
  workspace: workspaceSchema,
  scope: catalogScopeSchema.optional(),
  proposalId: z.string().max(16000).trim().min(1),
  confirm: z.literal(true),
});

export const previewSkillFileSyncInputSchema = z.strictObject({
  workspace: workspaceSchema,
  scope: catalogScopeSchema.optional(),
  skillName: z.string().max(16000).trim().min(1),
  proposalId: z.string().max(16000).trim().min(1),
});

export const applySkillFileSyncInputSchema = previewSkillFileSyncInputSchema
  .extend({
    previewDigest: z.string().length(64).optional().describe(
      "Required by the server: digest from the reviewed file-sync preview.",
    ),
    confirm: z.literal(true),
  });

export const removeSkillInputSchema = z.strictObject({
  idempotencyKey: z.string().min(1).max(120).optional(),
  expectedRevision: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  workspace: workspaceSchema,
  skillName: z.string().max(16000).trim().min(1),
  scope: catalogScopeSchema.optional(),
});

export const removeSubagentInputSchema = z.strictObject({
  idempotencyKey: z.string().min(1).max(120).optional(),
  expectedRevision: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  workspace: workspaceSchema,
  subagentName: z.string().max(16000).trim().min(1),
  scope: catalogScopeSchema.optional(),
});

export const exportCatalogInputSchema = z.strictObject({
  workspace: workspaceSchema,
  entryType: entryTypeSchema.optional(),
  projectName: z.string().max(16000).trim().min(1).optional(),
});

const verificationStatusSchema = z.enum(["verified", "unverified", "unknown"]);

const exportAgentEntrySchema = z.strictObject({
  entryType: z.literal("agent"),
  codexSessionId: z.string().max(16000).trim().min(1),
  agentStatus: agentStatusSchema.optional(),
  retiredAt: z.string().max(16000).trim().min(1).optional(),
  retirementReason: z.string().max(16000).trim().min(1).optional(),
  replacedByAgentEntryKey: z.string().max(16000).trim().min(1).optional(),
  replacesAgentEntryKey: z.string().max(16000).trim().min(1).optional(),
  projectName: z.string().max(16000).trim().min(1),
  displayName: z.string().max(16000).trim().min(1),
  primarySpecialty: z.string().max(16000).trim().min(1),
  specialtyTags: boundedArray(z.string().max(16000).trim().min(1)).min(1),
  handoff: handoffSchema.optional(),
  verificationStatus: verificationStatusSchema,
  verificationSource: z.string().max(16000).trim().min(1),
  verifiedAt: z.string().max(16000).trim().min(1),
  verificationMessage: z.string().max(16000).trim().min(1).optional(),
});

const exportSkillEntrySchema = z.strictObject({
  entryType: z.literal("skill"),
  skillName: z.string().max(16000).trim().min(1),
  projectName: z.string().max(16000).trim().min(1),
  displayName: z.string().max(16000).trim().min(1),
  primarySpecialty: z.string().max(16000).trim().min(1),
  specialtyTags: boundedArray(z.string().max(16000).trim().min(1)).min(1),
  verificationStatus: verificationStatusSchema,
  verificationSource: z.string().max(16000).trim().min(1),
  verifiedAt: z.string().max(16000).trim().min(1),
  verificationMessage: z.string().max(16000).trim().min(1).optional(),
  skillContext: skillContextSchema.optional(),
  routing: routingMetadataSchema.optional(),
});

const exportSubagentEntrySchema = z.strictObject({
  entryType: z.literal("subagent"),
  name: z.string().max(16000).trim().min(1),
  projectName: z.string().max(16000).trim().min(1),
  displayName: z.string().max(16000).trim().min(1),
  purpose: z.string().max(16000).trim().min(1),
  limitedScope: z.string().max(16000).trim().min(1),
  primarySpecialty: z.string().max(16000).trim().min(1),
  specialtyTags: boundedArray(z.string().max(16000).trim().min(1)).min(1),
  agentReferences: boundedArray(catalogReferenceSchema),
  skillReferences: boundedArray(catalogReferenceSchema),
  unresolvedReferences: boundedArray(catalogReferenceSchema),
  promptTemplate: z.string().max(16000).trim().min(1).optional(),
  constraints: boundedArray(z.string().max(16000).trim().min(1)),
  expectedOutput: z.string().max(16000).trim().min(1),
  negativeRouting: negativeRoutingSchema.optional(),
  routing: routingMetadataSchema.optional(),
  verificationStatus: verificationStatusSchema,
  verificationSource: z.string().max(16000).trim().min(1),
  verifiedAt: z.string().max(16000).trim().min(1),
  verificationMessage: z.string().max(16000).trim().min(1).optional(),
});

export const importCatalogInputSchema = z.strictObject({
  idempotencyKey: z.string().min(1).max(120).optional(),
  workspace: workspaceSchema,
  conflictStrategy: z.enum(["skip", "fail"]).optional(),
  catalog: z.strictObject({
    version: z.literal(1),
    exportedAt: z.string().max(16000).trim().min(1),
    workspace: z.string().max(16000).trim().min(1),
    filters: z.strictObject({
      entryType: entryTypeSchema.optional(),
      projectName: z.string().max(16000).trim().min(1).optional(),
    }),
    entries: boundedArray(z.discriminatedUnion("entryType", [
      exportAgentEntrySchema,
      exportSkillEntrySchema,
      exportSubagentEntrySchema,
    ])),
  }),
});

const workspaceCatalogSyncBaseInputSchema = z.strictObject({
  sourceWorkspace: workspaceSchema,
  targetWorkspace: workspaceSchema,
  projectName: z.string().max(16000).trim().min(1).optional(),
  skillNames: boundedArray(z.string().max(16000).trim().min(1)).min(1)
    .optional(),
  subagentNames: boundedArray(z.string().max(16000).trim().min(1)).min(1)
    .optional(),
  agentPromptRoles: boundedArray(z.string().max(16000).trim().min(1)).min(1)
    .optional(),
});

export const previewWorkspaceCatalogSyncInputSchema =
  workspaceCatalogSyncBaseInputSchema;

export const applyWorkspaceCatalogSyncInputSchema =
  workspaceCatalogSyncBaseInputSchema.extend({
    previewDigest: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    idempotencyKey: z.string().min(1).max(120).optional(),
    confirm: z.literal(true),
  });

export const checkCatalogHealthInputSchema = z.strictObject({
  workspace: workspaceSchema,
  entryType: healthEntryTypeSchema.optional(),
  projectName: z.string().max(16000).trim().min(1).optional(),
  entryKey: z.string().max(16000).trim().min(1).optional(),
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

export const getWorkspaceDiagnosticsInputSchema = z.strictObject({
  workspace: workspaceSchema,
});

export const getUsageAnalyticsInputSchema = z.strictObject({
  workspace: workspaceSchema,
  entryType: usageEntryTypeSchema.optional(),
  scope: catalogScopeSchema.optional(),
  entryKey: z.string().max(16000).trim().min(1).optional(),
  projectName: z.string().max(16000).trim().min(1).optional(),
}).refine(
  (input) => !(input.entryType === "note" && input.scope === "global"),
  {
    message: "Workspace notes do not support global scope.",
    path: ["scope"],
  },
).refine(
  (input) => !(input.entryType === "note" && input.projectName !== undefined),
  {
    message: "Workspace notes do not support projectName filters.",
    path: ["projectName"],
  },
);

export const rememberWorkspaceNoteInputSchema = z.strictObject({
  idempotencyKey: z.string().min(1).max(120).optional(),
  workspace: workspaceSchema,
  title: z.string().max(16000).trim().min(1),
  body: z.string().max(16000).trim().min(1),
  tags: boundedArray(z.string().max(16000).trim().min(1)).optional(),
});

export const listWorkspaceNotesInputSchema = z.strictObject({
  cursor: z.string().max(512).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  workspace: workspaceSchema,
  tags: boundedArray(z.string().max(16000).trim().min(1)).optional(),
});

export const findMatchingWorkspaceNoteInputSchema = z.strictObject({
  workspace: workspaceSchema,
  query: z.string().max(16000).trim().min(1),
  tags: boundedArray(z.string().max(16000).trim().min(1)).optional(),
  limit: z.number().int().min(1).max(20).optional(),
});

export const getWorkspaceNoteInputSchema = z.strictObject({
  workspace: workspaceSchema,
  noteId: z.string().max(16000).trim().min(1),
});

export const removeWorkspaceNoteInputSchema = getWorkspaceNoteInputSchema;

export const generateAgentPromptInputSchema = z.strictObject({
  workspace: workspaceSchema,
  role: z.string().max(16000).trim().min(1),
  projectName: z.string().max(16000).trim().min(1).optional(),
  task: z.string().max(16000).trim().min(1).optional(),
  context: z.string().max(16000).trim().min(1).optional(),
  constraints: z.string().max(16000).trim().min(1).optional(),
});

export const findMatchingSkillInputSchema = z.strictObject({
  workspace: workspaceSchema,
  task: z.string().max(16000).trim().min(1),
  canonicalTask: z.string().max(16000).trim().min(1).optional(),
  projectName: z.string().max(16000).trim().min(1).optional(),
  specialtyHints: boundedArray(z.string().max(16000).trim().min(1)).optional(),
  intent: z.string().max(16000).trim().min(1).max(120).optional(),
  excludeIntents: routingStringListSchema.optional(),
  positiveKeywords: routingStringListSchema.optional(),
  negativeKeywords: routingStringListSchema.optional(),
  negativeHints: routingStringListSchema.optional(),
  requiredAny: routingStringListSchema.optional(),
  requiredAll: routingStringListSchema.optional(),
  excludedSkills: routingStringListSchema.optional(),
  preferredSkills: routingStringListSchema.optional(),
  excludedEntryKeys: routingStringListSchema.optional(),
  preferredEntryKeys: routingStringListSchema.optional(),
  domain: routingStringListSchema.optional(),
  outputNeed: routingStringListSchema.optional(),
  debug: z.boolean().optional(),
});

export const findMatchingSubagentInputSchema = z.strictObject({
  workspace: workspaceSchema,
  task: z.string().max(16000).trim().min(1),
  canonicalTask: z.string().max(16000).trim().min(1).optional(),
  projectName: z.string().max(16000).trim().min(1).optional(),
  specialtyHints: boundedArray(z.string().max(16000).trim().min(1)).optional(),
  intent: z.string().max(16000).trim().min(1).max(120).optional(),
  excludeIntents: routingStringListSchema.optional(),
  positiveKeywords: routingStringListSchema.optional(),
  negativeKeywords: routingStringListSchema.optional(),
  negativeHints: routingStringListSchema.optional(),
  requiredAny: routingStringListSchema.optional(),
  requiredAll: routingStringListSchema.optional(),
  excludedSkills: routingStringListSchema.optional(),
  preferredSkills: routingStringListSchema.optional(),
  excludedEntryKeys: routingStringListSchema.optional(),
  preferredEntryKeys: routingStringListSchema.optional(),
  domain: routingStringListSchema.optional(),
  outputNeed: routingStringListSchema.optional(),
  debug: z.boolean().optional(),
});

export type IntroduceSkillToolInput = z.infer<typeof introduceSkillInputSchema>;
export type IntroduceSubagentToolInput = z.infer<
  typeof introduceSubagentInputSchema
>;
export type ListSkillsToolInput = z.infer<typeof listSkillsInputSchema>;
export type ListSubagentsToolInput = z.infer<typeof listSubagentsInputSchema>;
export type ClearWorkspaceSkillsToolInput = z.infer<
  typeof clearWorkspaceSkillsInputSchema
>;
export type ClearWorkspaceSubagentsToolInput = z.infer<
  typeof clearWorkspaceSubagentsInputSchema
>;
export type RegisterWorkspaceAliasToolInput = z.infer<
  typeof registerWorkspaceAliasInputSchema
>;
export type PromoteSkillToGlobalToolInput = z.infer<
  typeof promoteSkillToGlobalInputSchema
>;
export type GetSkillDetailToolInput = z.infer<typeof getSkillDetailInputSchema>;
export type GetSubagentDetailToolInput = z.infer<
  typeof getSubagentDetailInputSchema
>;
export type UpdateSkillToolInput = z.infer<typeof updateSkillInputSchema>;
export type UpdateSubagentToolInput = z.infer<typeof updateSubagentInputSchema>;
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
export type RemoveSkillToolInput = z.infer<typeof removeSkillInputSchema>;
export type RemoveSubagentToolInput = z.infer<typeof removeSubagentInputSchema>;
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
export type GetWorkspaceDiagnosticsToolInput = z.infer<
  typeof getWorkspaceDiagnosticsInputSchema
>;
export type GetUsageAnalyticsToolInput = z.infer<
  typeof getUsageAnalyticsInputSchema
>;
export type RememberWorkspaceNoteToolInput = z.infer<
  typeof rememberWorkspaceNoteInputSchema
>;
export type ListWorkspaceNotesToolInput = z.infer<
  typeof listWorkspaceNotesInputSchema
>;
export type FindMatchingWorkspaceNoteToolInput = z.infer<
  typeof findMatchingWorkspaceNoteInputSchema
>;
export type GetWorkspaceNoteToolInput = z.infer<
  typeof getWorkspaceNoteInputSchema
>;
export type RemoveWorkspaceNoteToolInput = z.infer<
  typeof removeWorkspaceNoteInputSchema
>;
export type GenerateAgentPromptToolInput = z.infer<
  typeof generateAgentPromptInputSchema
>;
export type FindMatchingSkillToolInput = z.infer<
  typeof findMatchingSkillInputSchema
>;
export type FindMatchingSubagentToolInput = z.infer<
  typeof findMatchingSubagentInputSchema
>;

export const toolOutputSchema = {
  status: z.enum(["ok", "no_match", "conflict", "error"]),
  data: z.unknown().optional(),
  error: z.strictObject({
    code: z.string().max(16000),
    message: z.string().max(16000),
    details: z.record(z.string().max(16000), z.unknown()).optional(),
  }).optional(),
};
