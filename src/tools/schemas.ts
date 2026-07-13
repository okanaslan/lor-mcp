import * as z from "zod/v4";

export const entryTypeSchema = z.enum(["agent", "skill"]);

export const handoffSchema = z.object({
  whenToUse: z.string().trim().min(1),
  handoffPromptTemplate: z.string().trim().min(1),
  requiredContext: z.array(z.string().trim().min(1)),
  expectedOutput: z.string().trim().min(1),
  constraints: z.array(z.string().trim().min(1)),
});

export const introduceAgentInputSchema = z.object({
  codexSessionId: z.string().trim().min(1),
  projectName: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  primarySpecialty: z.string().trim().min(1),
  specialtyTags: z.array(z.string().trim().min(1)).min(1),
  handoff: handoffSchema.optional(),
});

export const introduceSkillInputSchema = z.object({
  skillName: z.string().trim().min(1),
  projectName: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  primarySpecialty: z.string().trim().min(1),
  specialtyTags: z.array(z.string().trim().min(1)).min(1),
});

export const listCatalogEntriesInputSchema = z.object({
  entryType: entryTypeSchema.optional(),
  projectName: z.string().trim().min(1).optional(),
});

export const getCatalogEntryDetailInputSchema = z.object({
  entryType: entryTypeSchema,
  entryKey: z.string().trim().min(1),
});

export const findMatchingCatalogEntryInputSchema = z.object({
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
export type GetCatalogEntryDetailToolInput = z.infer<
  typeof getCatalogEntryDetailInputSchema
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
