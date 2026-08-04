import type {
  CatalogReference,
  IntroduceSubagentInput,
  SubagentCatalogEntry,
} from "@src/catalog/types.ts";

type SubagentPromptSource =
  & Pick<
    SubagentCatalogEntry,
    | "name"
    | "displayName"
    | "projectName"
    | "purpose"
    | "limitedScope"
    | "primarySpecialty"
    | "specialtyTags"
    | "agentReferences"
    | "skillReferences"
    | "constraints"
    | "expectedOutput"
  >
  & {
    promptTemplate?: string;
  };

export function renderSubagentPrompt(source: SubagentPromptSource): string {
  if (source.promptTemplate) {
    return renderTemplate(source.promptTemplate, source);
  }

  const sections = [
    `You are ${source.displayName}, a focused Codex subagent profile for ${source.projectName}.`,
    "",
    "Purpose:",
    source.purpose,
    "",
    "Limited scope:",
    source.limitedScope,
    "",
    "Primary specialty:",
    source.primarySpecialty,
    "",
    "Specialty tags:",
    source.specialtyTags.join(", "),
  ];

  if (source.constraints.length > 0) {
    sections.push(
      "",
      "Constraints:",
      ...source.constraints.map((item) => `- ${item}`),
    );
  }

  if (source.agentReferences.length > 0) {
    sections.push(
      "",
      "Agent references:",
      ...source.agentReferences.map(formatReferenceLine),
    );
  }

  if (source.skillReferences.length > 0) {
    sections.push(
      "",
      "Skill references:",
      ...source.skillReferences.map(formatReferenceLine),
    );
  }

  sections.push(
    "",
    "Expected output:",
    source.expectedOutput,
    "",
    "Operating boundary:",
    "Use Codex-native subagent or task behavior when available. Local Orchestration Router (LOR) only stores and renders this prompt; it does not execute this profile, start a chat, or contact referenced agents or skills.",
  );

  return sections.join("\n");
}

export function normalizeSubagentPromptFields(input: IntroduceSubagentInput): {
  agentReferences: CatalogReference[];
  skillReferences: CatalogReference[];
  constraints: string[];
  expectedOutput: string;
} {
  return {
    agentReferences: [...(input.agentReferences ?? [])],
    skillReferences: [...(input.skillReferences ?? [])],
    constraints: [...(input.constraints ?? [])],
    expectedOutput: input.expectedOutput ??
      "Return concise findings, changes, and verification notes for the delegated scope.",
  };
}

function renderTemplate(
  template: string,
  source: SubagentPromptSource,
): string {
  const replacements: Record<string, string> = {
    name: source.name,
    displayName: source.displayName,
    projectName: source.projectName,
    purpose: source.purpose,
    limitedScope: source.limitedScope,
    primarySpecialty: source.primarySpecialty,
    specialtyTags: source.specialtyTags.join(", "),
    constraints: source.constraints.join("\n"),
    expectedOutput: source.expectedOutput,
    agentReferences: source.agentReferences.map(formatReference).join(", "),
    skillReferences: source.skillReferences.map(formatReference).join(", "),
  };

  let prompt = template;
  for (const [key, value] of Object.entries(replacements)) {
    prompt = prompt.replaceAll(`{${key}}`, value);
  }
  return prompt;
}

function formatReferenceLine(reference: CatalogReference): string {
  return `- ${formatReference(reference)}`;
}

function formatReference(reference: CatalogReference): string {
  const parts = [
    reference.entryType,
    reference.name,
    reference.entryKey ? `entryKey=${reference.entryKey}` : undefined,
    reference.scope ? `scope=${reference.scope}` : undefined,
    reference.required ? "required" : undefined,
  ].filter((part): part is string => part !== undefined);
  return parts.join(" ");
}
