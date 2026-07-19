import {
  type CatalogEntryUpdate,
  type CatalogExportEntry,
  type CatalogExportFilter,
  type CatalogHealthFilter,
  type CatalogImportConflictStrategy,
  type CatalogImportInput,
  type EntryLookup,
  type HandoffMetadata,
  type IntroduceAgentInput,
  type IntroduceSkillInput,
  type PrepareAgentHandoffInput,
  type RegisterWorkspaceAliasInput,
} from "@src/catalog/types.ts";
import { LorError } from "@src/errors.ts";
import { requireWorkspace } from "@src/catalog/workspace.ts";

export function validateIntroduceAgent(
  input: IntroduceAgentInput,
): IntroduceAgentInput {
  return {
    workspace: requireWorkspace(input.workspace),
    codexSessionId: requireString(input.codexSessionId, "codexSessionId"),
    projectName: requireString(input.projectName, "projectName"),
    displayName: requireString(input.displayName, "displayName"),
    primarySpecialty: requireString(input.primarySpecialty, "primarySpecialty"),
    specialtyTags: requireTags(input.specialtyTags),
    handoff: input.handoff ? validateHandoff(input.handoff) : undefined,
  };
}

export function validateIntroduceSkill(
  input: IntroduceSkillInput,
): IntroduceSkillInput {
  return {
    workspace: requireWorkspace(input.workspace),
    skillName: requireString(input.skillName, "skillName"),
    projectName: requireString(input.projectName, "projectName"),
    displayName: requireString(input.displayName, "displayName"),
    primarySpecialty: requireString(input.primarySpecialty, "primarySpecialty"),
    specialtyTags: requireTags(input.specialtyTags),
  };
}

export function validateWorkspace(workspace: string): string {
  return requireWorkspace(workspace);
}

export function validateCatalogEntryUpdate(
  input: CatalogEntryUpdate,
): CatalogEntryUpdate {
  const update: CatalogEntryUpdate = {
    workspace: requireWorkspace(input.workspace),
    entryType: requireEntryType(input.entryType),
    entryKey: requireString(input.entryKey, "entryKey"),
  };

  if (input.projectName !== undefined) {
    update.projectName = requireString(input.projectName, "projectName");
  }
  if (input.displayName !== undefined) {
    update.displayName = requireString(input.displayName, "displayName");
  }
  if (input.primarySpecialty !== undefined) {
    update.primarySpecialty = requireString(
      input.primarySpecialty,
      "primarySpecialty",
    );
  }
  if (input.specialtyTags !== undefined) {
    update.specialtyTags = requireTags(input.specialtyTags);
  }

  if (!hasEditableUpdate(update)) {
    throw new LorError(
      "validation_error",
      "At least one editable field is required.",
      { field: "update" },
    );
  }

  return update;
}

export function validateEntryLookup(input: EntryLookup): EntryLookup {
  return {
    workspace: requireWorkspace(input.workspace),
    entryType: requireEntryType(input.entryType),
    entryKey: requireString(input.entryKey, "entryKey"),
  };
}

export function validateCatalogExportFilter(
  input: CatalogExportFilter,
): CatalogExportFilter {
  const projectName = input.projectName?.trim();
  return {
    workspace: requireWorkspace(input.workspace),
    entryType: input.entryType === undefined
      ? undefined
      : requireEntryType(input.entryType),
    projectName: projectName || undefined,
  };
}

export function validateCatalogHealthFilter(
  input: CatalogHealthFilter,
): CatalogHealthFilter {
  const projectName = input.projectName?.trim();
  const entryKey = input.entryKey?.trim();
  if (entryKey && input.entryType === undefined) {
    throw new LorError(
      "validation_error",
      "entryType is required when entryKey is provided.",
      { field: "entryType" },
    );
  }

  return {
    workspace: requireWorkspace(input.workspace),
    entryType: input.entryType === undefined
      ? undefined
      : requireEntryType(input.entryType),
    projectName: projectName || undefined,
    entryKey: entryKey || undefined,
  };
}

export function validateCatalogImportInput(
  input: CatalogImportInput,
): CatalogImportInput & { conflictStrategy: CatalogImportConflictStrategy } {
  const workspace = requireWorkspace(input.workspace);
  const conflictStrategy = input.conflictStrategy ?? "skip";
  if (conflictStrategy !== "skip" && conflictStrategy !== "fail") {
    throw new LorError(
      "validation_error",
      "conflictStrategy must be skip or fail.",
      { field: "conflictStrategy" },
    );
  }
  if (!input.catalog || input.catalog.version !== 1) {
    throw new LorError(
      "validation_error",
      "catalog version must be 1.",
      { field: "catalog.version" },
    );
  }
  if (!Array.isArray(input.catalog.entries)) {
    throw new LorError(
      "validation_error",
      "catalog entries must be an array.",
      { field: "catalog.entries" },
    );
  }

  return {
    workspace,
    conflictStrategy,
    catalog: {
      version: 1,
      exportedAt: requireString(input.catalog.exportedAt, "catalog.exportedAt"),
      workspace: requireString(input.catalog.workspace, "catalog.workspace"),
      filters: {
        entryType: input.catalog.filters?.entryType === undefined
          ? undefined
          : requireEntryType(input.catalog.filters.entryType),
        projectName: input.catalog.filters?.projectName?.trim() || undefined,
      },
      entries: input.catalog.entries.map(validateCatalogImportEntry),
    },
  };
}

export function validatePrepareAgentHandoff(
  input: PrepareAgentHandoffInput,
): PrepareAgentHandoffInput {
  const context = input.context?.trim();
  return {
    workspace: requireWorkspace(input.workspace),
    agentEntryKey: requireString(input.agentEntryKey, "agentEntryKey"),
    task: requireString(input.task, "task"),
    context: context || undefined,
  };
}

export function validateRegisterWorkspaceAlias(
  input: RegisterWorkspaceAliasInput,
): RegisterWorkspaceAliasInput {
  if (input.confirm !== undefined && input.confirm !== true) {
    throw new LorError(
      "validation_error",
      "confirm must be true when provided.",
      { field: "confirm" },
    );
  }

  return {
    workspace: requireWorkspace(input.workspace),
    alias: requireWorkspace(input.alias, "alias"),
    confirm: input.confirm,
  };
}

function requireString(value: string, field: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new LorError("validation_error", `${field} is required.`, {
      field,
    });
  }
  return trimmed;
}

function validateCatalogImportEntry(
  entry: CatalogExportEntry,
  index: number,
): CatalogExportEntry {
  requireEntryType(entry.entryType);
  const base = {
    projectName: requireString(
      entry.projectName,
      `catalog.entries.${index}.projectName`,
    ),
    displayName: requireString(
      entry.displayName,
      `catalog.entries.${index}.displayName`,
    ),
    primarySpecialty: requireString(
      entry.primarySpecialty,
      `catalog.entries.${index}.primarySpecialty`,
    ),
    specialtyTags: requireTags(entry.specialtyTags),
    verificationStatus: requireVerificationStatus(
      entry.verificationStatus,
      `catalog.entries.${index}.verificationStatus`,
    ),
    verificationSource: requireString(
      entry.verificationSource,
      `catalog.entries.${index}.verificationSource`,
    ),
    verifiedAt: requireString(
      entry.verifiedAt,
      `catalog.entries.${index}.verifiedAt`,
    ),
    verificationMessage: entry.verificationMessage?.trim() || undefined,
  };

  if (entry.entryType === "agent") {
    return {
      ...base,
      entryType: "agent",
      codexSessionId: requireString(
        entry.codexSessionId,
        `catalog.entries.${index}.codexSessionId`,
      ),
      handoff: entry.handoff ? validateHandoff(entry.handoff) : undefined,
    };
  }

  return {
    ...base,
    entryType: "skill",
    skillName: requireString(
      entry.skillName,
      `catalog.entries.${index}.skillName`,
    ),
  };
}

function hasEditableUpdate(input: CatalogEntryUpdate): boolean {
  return input.projectName !== undefined ||
    input.displayName !== undefined ||
    input.primarySpecialty !== undefined ||
    input.specialtyTags !== undefined;
}

function requireEntryType(value: unknown): "agent" | "skill" {
  if (value !== "agent" && value !== "skill") {
    throw new LorError(
      "validation_error",
      "entryType must be agent or skill.",
      {
        field: "entryType",
      },
    );
  }
  return value;
}

function requireVerificationStatus(
  value: unknown,
  field: string,
): "verified" | "unverified" | "unknown" {
  if (value === "verified" || value === "unverified" || value === "unknown") {
    return value;
  }
  throw new LorError(
    "validation_error",
    `${field} must be verified, unverified, or unknown.`,
    { field },
  );
}

function requireTags(tags: readonly string[]): string[] {
  if (!Array.isArray(tags)) {
    throw new LorError(
      "validation_error",
      "specialtyTags must be an array.",
      { field: "specialtyTags" },
    );
  }

  const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
  if (normalized.length === 0) {
    throw new LorError(
      "validation_error",
      "specialtyTags must include at least one tag.",
      { field: "specialtyTags" },
    );
  }
  return [...new Set(normalized)];
}

function validateHandoff(handoff: HandoffMetadata): HandoffMetadata {
  return {
    whenToUse: requireString(handoff.whenToUse, "handoff.whenToUse"),
    handoffPromptTemplate: requireString(
      handoff.handoffPromptTemplate,
      "handoff.handoffPromptTemplate",
    ),
    requiredContext: requireStringList(
      handoff.requiredContext,
      "handoff.requiredContext",
    ),
    expectedOutput: requireString(
      handoff.expectedOutput,
      "handoff.expectedOutput",
    ),
    constraints: requireStringList(handoff.constraints, "handoff.constraints"),
  };
}

function requireStringList(values: string[], field: string): string[] {
  if (!Array.isArray(values)) {
    throw new LorError("validation_error", `${field} is required.`, {
      field,
    });
  }
  return values.map((value) => requireString(value, field));
}
