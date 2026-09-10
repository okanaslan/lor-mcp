import * as z from "zod/v4";
import {
  exportSkillEntrySchema,
  exportSubagentEntrySchema,
  importCatalogInputSchema,
  introduceSkillInputSchema,
  introduceSubagentInputSchema,
} from "@src/tools/schemas.ts";

const text = z.string();
const count = z.number().int().nonnegative();
const jsonObject = z.record(text, z.json());
const strings = z.array(text);
const digest = text.regex(/^[a-f0-9]{64}$/);
const pagination = { total: count, nextCursor: text.optional() };
const base = {
  revision: digest,
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
  unresolvedReferences: introduceSubagentInputSchema.shape.agentReferences,
});
const summary = z.object({
  workspace: text.optional(),
  revision: digest.optional(),
  resourceUri: text.optional(),
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
const noteSummary = note.omit({ body: true }).extend({
  resourceUri: text.optional(),
});
const notes = z.object({
  workspace: text,
  filters: z.object({
    tags: z.array(text).optional(),
    limit: count.optional(),
  }),
  notes: z.array(noteSummary),
}).catchall(z.json());
const proposal = z.object({
  baseRevision: digest.optional(),
  expiresAt: text.optional(),
  originWorkspace: text.optional(),
  appliedAt: text.optional(),
  proposedSkillContext: introduceSkillInputSchema.shape.skillContext,
  proposedRouting: introduceSkillInputSchema.shape.routing.nullable(),
  proposedMetadata: introduceSkillInputSchema.pick({
    projectName: true,
    displayName: true,
    primarySpecialty: true,
    specialtyTags: true,
  }).partial().optional(),
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
  previewDigest: digest,
  workspace: text,
  skillName: text,
  proposalId: text,
  targetFile: z.literal("SKILL.md"),
  sectionName: text,
  sectionExists: z.boolean(),
  wouldChange: z.boolean(),
  renderedSection: text,
}).catchall(z.json());
const signal = z.object({
  term: text,
  source: text,
  weight: z.number(),
  queryTerm: text.optional(),
  querySource: text.optional(),
  candidateTerm: text.optional(),
  candidateSource: text.optional(),
  matchKind: z.enum([
    "alias",
    "exact",
    "negative-route",
    "phrase",
    "prefix",
    "token",
  ]).optional(),
});
const candidate = summary.extend({
  score: z.number(),
  matchedFields: strings,
  matchedSignals: strings,
  purpose: text.optional(),
  limitedScope: text.optional(),
  reachability: z.object({
    reachabilityStatus: text,
    dispatchMode: text,
    lastReachabilityCheckAt: text.optional(),
    lastReachabilityError: text.optional(),
    lastDispatchAt: text.optional(),
  }).optional(),
  explanation: z.object({
    summary: text,
    confidence: z.enum(["high", "medium", "low"]),
    matchedFields: strings,
    matchedSignals: strings,
    score: z.number(),
    negativeMatchedFields: strings.optional(),
    negativeMatchedSignals: strings.optional(),
    negativeScore: z.number().optional(),
    demotedByNegativeRouting: z.boolean().optional(),
    signalBreakdown: z.array(signal).optional(),
    ignoredSignals: strings.optional(),
    negativeSignals: z.array(signal).optional(),
    excludedBy: strings.optional(),
    finalScoreBreakdown: z.object({
      positive: z.record(text, z.number()),
      negativePenalty: z.number(),
      preferenceBoost: z.number(),
      finalScore: z.number(),
    }).optional(),
  }),
});
const matches = z.object({
  agents: z.array(candidate),
  skills: z.array(candidate),
  subagents: z.array(candidate),
  agentsAmbiguous: z.boolean(),
  ignoredSignals: strings.optional(),
  querySignals: strings.optional(),
  excludedCandidates: z.array(summary.extend({
    excludedBy: strings,
    matchedSignals: strings,
    negativeSignals: z.array(signal),
  })).optional(),
  conflict: z.object({
    reason: text,
    candidates: z.array(candidate),
    matchedSignals: strings,
    differentiatingFields: strings,
    differentiatingSignals: strings,
    suggestedClarificationQuestion: text,
    recommendedNextAction: text,
    resolutionHint: text,
  }).optional(),
}).catchall(z.json());
const agentPrompt = z.object({
  workspace: text,
  role: text,
  prompt: text,
  displayName: text,
  suggestedAgentMetadata: z.object({
    projectName: text,
    displayName: text,
    primarySpecialty: text,
    specialtyTags: strings,
    handoff: z.object({
      whenToUse: text,
      handoffPromptTemplate: text,
      requiredContext: strings,
      expectedOutput: text,
      constraints: strings,
    }).optional(),
  }),
  delivery: z.object({ mode: z.literal("manual"), instruction: text }),
});
const syncSummary = z.object({
  selectedSkills: count,
  skillsToCopy: count,
  duplicateSkills: count,
  missingSkills: count,
  selectedSubagents: count,
  subagentsToCopy: count,
  duplicateSubagents: count,
  missingSubagents: count,
  generatedAgentPrompts: count,
  copiedSkills: count.optional(),
  copiedSubagents: count.optional(),
});
const syncPreview = z.object({
  previewDigest: digest,
  sourceWorkspace: text,
  targetWorkspace: text,
  projectName: text.optional(),
  requestedSkillNames: z.array(text).optional(),
  requestedSubagentNames: z.array(text).optional(),
  requestedAgentPromptRoles: z.array(text).optional(),
  skillsToCopy: z.array(exportSkillEntrySchema),
  subagentsToCopy: z.array(exportSubagentEntrySchema),
  duplicateSkills: z.array(text),
  duplicateSubagents: z.array(text),
  missingSkills: z.array(text),
  missingSubagents: z.array(text),
  generatedAgentPrompts: z.array(agentPrompt),
  summary: syncSummary,
});
const removed = z.object({
  workspace: text,
  entryType: z.enum(["skill", "subagent"]),
  entryKey: text,
  scope: base.scope.optional(),
  removed: z.literal(true),
});
const filterFields = {
  scope: base.scope.optional(),
  entryKey: text.optional(),
  projectName: text.optional(),
};
const coverageDimension = z.object({
  name: text,
  skills: count,
  subagents: count,
});
const health = z.object({
  workspace: text,
  checkedAt: text,
  filters: z.object({
    ...filterFields,
    entryType: z.enum(["agent", "skill"]).optional(),
  }),
  summary: z.object({
    total: count,
    verified: count,
    unverified: count,
    unknown: count,
    agents: count,
    skills: count,
  }),
  coverage: z.object({
    workspaceSkillCount: count,
    globalSkillCount: count,
    workspaceSubagentCount: count,
    globalSubagentCount: count,
    skillCount: count,
    subagentCount: count,
    projectCoverage: z.array(coverageDimension),
    specialtyCoverage: z.array(coverageDimension),
    coverageStatus: z.enum(["healthy", "needs_attention", "low_coverage"]),
    recommendedActions: strings,
  }),
  entries: z.array(
    summary.extend({
      ...verification,
      issues: z.array(z.object({ code: text, message: text })),
    }),
  ),
});
const usageCounts = {
  listed: count,
  matched: count,
  detailed: count,
  total: count,
};
const usageType = z.enum(["skill", "subagent", "note"]);
const usage = z.object({
  workspace: text,
  checkedAt: text,
  filters: z.object({ ...filterFields, entryType: usageType.optional() }),
  summary: z.object({
    totalEntries: count,
    totalCount: count,
    byEntryType: z.record(
      usageType,
      z.object({ entries: count, ...usageCounts }),
    ),
    byOperation: z.object({ listed: count, matched: count, detailed: count }),
  }),
  entries: z.array(z.object({
    workspace: text,
    entryType: usageType,
    scope: base.scope,
    entryKey: text,
    projectName: text.optional(),
    ...usageCounts,
    firstSeenAt: text.optional(),
    lastSeenAt: text.optional(),
  })),
  recommendedActions: strings,
});
const importResult = z.object({
  workspace: text,
  version: z.literal(1),
  conflictStrategy: z.enum(["skip", "fail"]),
  importedCount: count,
  skippedCount: count,
  failedCount: count,
  errors: z.array(z.object({
    index: count,
    code: text,
    message: text,
    entryType: z.enum(["agent", "skill", "subagent"]).optional(),
    entryKey: text.optional(),
  })),
});

const outputs: Record<string, z.ZodType> = {
  read_result_page: z.object({
    snapshotId: z.uuid(),
    offset: count,
    text,
    totalCharacters: count,
    byteLength: count,
    revision: digest,
    nextUri: text.optional(),
  }),
  list_default_skills: z.object({
    skills: z.array(
      z.object({
        name: text,
        version: text,
        description: text,
        aliases: z.array(text),
        manifestUri: text,
        entrypointUri: text,
        files: z.array(text),
      }),
    ),
  }),
  get_default_skill: z.object({
    name: text,
    version: text,
    path: text,
    content: text,
  }),
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
  list_skills: z.object({ skills: z.array(summary), ...pagination }),
  list_subagents: z.object({ subagents: z.array(summary), ...pagination }),
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
  apply_skill_file_sync: sync.extend({
    written: z.boolean(),
    backupFile: text.optional(),
  }),
  remove_skill: removed,
  remove_subagent: removed,
  export_catalog: importCatalogInputSchema.shape.catalog.extend(pagination),
  import_catalog: importResult,
  preview_workspace_catalog_sync: syncPreview,
  apply_workspace_catalog_sync: syncPreview.extend({
    copiedSkills: z.array(text),
    copiedSubagents: z.array(text),
    importResult,
  }),
  check_catalog_health: health,
  get_workspace_diagnostics: z.object({
    inputWorkspace: text,
    resolvedWorkspace: text,
    aliases: z.array(text),
    catalogCounts: z.object({
      total: count,
      agents: count,
      skills: count,
      subagents: count,
    }),
    storageStatus: z.object({
      configured: z.boolean(),
      reachable: z.boolean(),
      schemaVersion: count.optional(),
      message: text.optional(),
    }),
    runtimeStatus: z.object({
      transport: z.literal("mcp"),
      activeHttpSessions: count.optional(),
      releaseVersion: text,
      buildId: text,
      buildIdSource: text,
      toolContractFingerprint: digest,
    }),
    localContext: z.object({
      agentsMd: z.object({
        status: z.enum(["present", "missing", "not_inspected"]),
        instruction: text,
      }),
      skills: z.object({
        configuredRoots: count,
        discoveredSkillNames: z.array(text),
        registeredSkillsWithLocalFile: z.array(text),
        registeredSkillsWithoutLocalFile: z.array(text),
        unregisteredLocalSkillNames: z.array(text),
      }),
      recommendedActions: z.array(text),
    }),
    checkedAt: text,
  }),
  get_usage_analytics: usage,
  remember_workspace_note: note,
  get_workspace_note: note,
  list_workspace_notes: notes.extend(pagination),
  find_matching_workspace_note: notes.extend({
    query: text,
    notes: z.array(noteSummary.extend({
      score: z.number(),
      matchedFields: z.array(text),
      matchedSignals: z.array(text),
      preview: text,
    })),
  }),
  remove_workspace_note: z.object({
    workspace: text,
    noteId: text,
    removed: z.boolean(),
  }),
  generate_agent_prompt: agentPrompt,
  find_matching_skill: matches,
  find_matching_subagent: matches,
};

export function outputSchemaFor(name: string) {
  const data = outputs[name];
  if (!data) throw new Error(`Missing output schema for ${name}`);
  return z.object({
    status: z.enum(["ok", "no_match", "conflict", "error", "deferred"]),
    data: z.union([
      data,
      z.object({
        resultResource: z.object({
          uri: text,
          byteLength: count,
          revision: digest,
          expiresAt: text,
        }),
      }),
    ]).optional(),
    error: z.object({
      code: text,
      message: text,
      recovery: text,
      details: jsonObject.optional(),
    }).catchall(z.json()).optional(),
    requestId: text.optional(),
  }).catchall(z.json()).superRefine((result, ctx) => {
    const deferred = result.data && typeof result.data === "object" &&
      "resultResource" in result.data;
    if (
      (result.status === "deferred") !== Boolean(deferred) ||
      (result.status === "error"
        ? !result.error || result.data !== undefined
        : result.data === undefined || result.error !== undefined)
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Result must contain either successful data or an execution error.",
      });
    }
  });
}
