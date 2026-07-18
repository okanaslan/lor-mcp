import * as z from "zod/v4";

export const entryTypeSchema = z.enum(["agent", "skill"]);

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
  codexSessionId: z.string().trim().min(1),
  projectName: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  primarySpecialty: z.string().trim().min(1),
  specialtyTags: z.array(z.string().trim().min(1)).min(1),
  handoff: handoffSchema.optional(),
});

export const introduceSkillInputSchema = z.object({
  workspace: workspaceSchema,
  skillName: z.string().trim().min(1),
  projectName: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  primarySpecialty: z.string().trim().min(1),
  specialtyTags: z.array(z.string().trim().min(1)).min(1),
});

export const listCatalogEntriesInputSchema = z.object({
  workspace: workspaceSchema,
  entryType: entryTypeSchema.optional(),
  projectName: z.string().trim().min(1).optional(),
});

export const clearWorkspaceCatalogInputSchema = z.object({
  workspace: workspaceSchema,
  confirm: z.literal(true),
  entryType: entryTypeSchema.optional(),
});

export const getCatalogEntryDetailInputSchema = z.object({
  workspace: workspaceSchema,
  entryType: entryTypeSchema,
  entryKey: z.string().trim().min(1),
});

export const updateCatalogEntryInputSchema = z.object({
  workspace: workspaceSchema,
  entryType: entryTypeSchema,
  entryKey: z.string().trim().min(1),
  projectName: z.string().trim().min(1).optional(),
  displayName: z.string().trim().min(1).optional(),
  primarySpecialty: z.string().trim().min(1).optional(),
  specialtyTags: z.array(z.string().trim().min(1)).min(1).optional(),
}).refine(
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

export const removeCatalogEntryInputSchema = z.object({
  workspace: workspaceSchema,
  entryType: entryTypeSchema,
  entryKey: z.string().trim().min(1),
});

export const exportCatalogInputSchema = z.object({
  workspace: workspaceSchema,
  entryType: entryTypeSchema.optional(),
  projectName: z.string().trim().min(1).optional(),
});

const verificationStatusSchema = z.enum(["verified", "unverified", "unknown"]);

const exportAgentEntrySchema = z.object({
  entryType: z.literal("agent"),
  codexSessionId: z.string().trim().min(1),
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
    ])),
  }),
});

export const checkCatalogHealthInputSchema = z.object({
  workspace: workspaceSchema,
  entryType: entryTypeSchema.optional(),
  projectName: z.string().trim().min(1).optional(),
  entryKey: z.string().trim().min(1).optional(),
}).refine(
  (input) => input.entryKey === undefined || input.entryType !== undefined,
  {
    message: "entryType is required when entryKey is provided.",
    path: ["entryType"],
  },
);

export const prepareAgentHandoffInputSchema = z.object({
  workspace: workspaceSchema,
  agentEntryKey: z.string().trim().min(1),
  task: z.string().trim().min(1),
  context: z.string().trim().min(1).optional(),
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
export type ListCatalogEntriesToolInput = z.infer<
  typeof listCatalogEntriesInputSchema
>;
export type ClearWorkspaceCatalogToolInput = z.infer<
  typeof clearWorkspaceCatalogInputSchema
>;
export type GetCatalogEntryDetailToolInput = z.infer<
  typeof getCatalogEntryDetailInputSchema
>;
export type UpdateCatalogEntryToolInput = z.infer<
  typeof updateCatalogEntryInputSchema
>;
export type RemoveCatalogEntryToolInput = z.infer<
  typeof removeCatalogEntryInputSchema
>;
export type ExportCatalogToolInput = z.infer<typeof exportCatalogInputSchema>;
export type ImportCatalogToolInput = z.infer<typeof importCatalogInputSchema>;
export type CheckCatalogHealthToolInput = z.infer<
  typeof checkCatalogHealthInputSchema
>;
export type PrepareAgentHandoffToolInput = z.infer<
  typeof prepareAgentHandoffInputSchema
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
