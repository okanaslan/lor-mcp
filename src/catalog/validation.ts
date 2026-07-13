import {
  type HandoffMetadata,
  type IntroduceAgentInput,
  type IntroduceSkillInput,
} from "@src/catalog/types.ts";
import { AgenticRouterError } from "@src/errors.ts";

export function validateIntroduceAgent(
  input: IntroduceAgentInput,
): IntroduceAgentInput {
  return {
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
    skillName: requireString(input.skillName, "skillName"),
    projectName: requireString(input.projectName, "projectName"),
    displayName: requireString(input.displayName, "displayName"),
    primarySpecialty: requireString(input.primarySpecialty, "primarySpecialty"),
    specialtyTags: requireTags(input.specialtyTags),
  };
}

function requireString(value: string, field: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new AgenticRouterError("validation_error", `${field} is required.`, {
      field,
    });
  }
  return trimmed;
}

function requireTags(tags: readonly string[]): string[] {
  if (!Array.isArray(tags)) {
    throw new AgenticRouterError(
      "validation_error",
      "specialtyTags must be an array.",
      { field: "specialtyTags" },
    );
  }

  const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
  if (normalized.length === 0) {
    throw new AgenticRouterError(
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
    throw new AgenticRouterError("validation_error", `${field} is required.`, {
      field,
    });
  }
  return values.map((value) => requireString(value, field));
}
