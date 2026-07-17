import type { HandoffMetadata } from "@src/catalog/types.ts";
import { LorError } from "@src/errors.ts";

export const agentPromptRoles = [
  "backend",
  "frontend",
  "react_native_mobile",
  "figma_design",
  "code_review",
  "qa",
  "devops",
  "product",
  "marketing",
  "email",
] as const;

export type AgentPromptRole = typeof agentPromptRoles[number];

export interface GenerateAgentPromptInput {
  workspace: string;
  role: string;
  projectName?: string;
  task?: string;
  context?: string;
  constraints?: string;
}

export interface SuggestedAgentMetadata {
  projectName: string;
  displayName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  handoff?: HandoffMetadata;
}

export interface GenerateAgentPromptResult {
  workspace: string;
  role: AgentPromptRole;
  prompt: string;
  displayName: string;
  suggestedAgentMetadata: SuggestedAgentMetadata;
  delivery: {
    mode: "manual";
    instruction: string;
  };
}

interface RolePreset {
  role: AgentPromptRole;
  displayName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  focus: readonly string[];
  handoff?: HandoffMetadata;
}

const rolePresets = {
  backend: preset({
    role: "backend",
    displayName: "Backend Agent",
    primarySpecialty: "backend implementation",
    specialtyTags: ["backend", "api", "database"],
    focus: [
      "Implement backend APIs, domain logic, storage behavior, and server-side tests.",
      "Prefer existing service, repository, validation, and error-handling patterns.",
      "Keep API contracts explicit and verify behavior with focused backend checks.",
    ],
  }),
  frontend: preset({
    role: "frontend",
    displayName: "Frontend Agent",
    primarySpecialty: "frontend implementation",
    specialtyTags: ["frontend", "ui", "react"],
    focus: [
      "Implement browser UI, component behavior, state handling, and frontend tests.",
      "Follow the existing design system, routing, styling, and accessibility patterns.",
      "Check responsive layout and verify user-facing workflows before handoff.",
    ],
  }),
  react_native_mobile: preset({
    role: "react_native_mobile",
    displayName: "React Native Mobile Agent",
    primarySpecialty: "react native mobile implementation",
    specialtyTags: ["mobile", "react-native", "expo"],
    focus: [
      "Implement mobile screens, navigation, native integrations, and device-facing behavior.",
      "Respect existing Expo, React Native, styling, localization, and accessibility patterns.",
      "Verify platform-sensitive changes with the narrowest available mobile checks.",
    ],
  }),
  figma_design: preset({
    role: "figma_design",
    displayName: "Figma Design Agent",
    primarySpecialty: "figma product design",
    specialtyTags: ["figma", "design", "product-ui"],
    focus: [
      "Design or refine product screens, flows, component structure, and visual hierarchy.",
      "Preserve existing design-system conventions and keep design decisions implementation-aware.",
      "Report concrete design changes and any assumptions that need owner review.",
    ],
  }),
  code_review: preset({
    role: "code_review",
    displayName: "Code Review Agent",
    primarySpecialty: "code review",
    specialtyTags: ["review", "quality", "risk"],
    focus: [
      "Review changed code for bugs, regressions, missing tests, and project-fit issues.",
      "Lead with findings ordered by severity and include exact file references.",
      "Avoid rewriting code unless explicitly asked to move from review into implementation.",
    ],
  }),
  qa: preset({
    role: "qa",
    displayName: "QA Agent",
    primarySpecialty: "quality assurance",
    specialtyTags: ["qa", "testing", "smoke-tests"],
    focus: [
      "Plan, run, and summarize manual or automated verification for user-facing workflows.",
      "Prioritize high-risk paths, regressions, edge cases, and reproducible evidence.",
      "Separate confirmed defects from residual risk and untested areas.",
    ],
  }),
  devops: preset({
    role: "devops",
    displayName: "DevOps Agent",
    primarySpecialty: "devops and delivery",
    specialtyTags: ["devops", "ci", "deployment"],
    focus: [
      "Work on CI, deployment, runtime configuration, infrastructure, and operational checks.",
      "Keep secrets and environment-specific values out of source-controlled artifacts.",
      "Verify changes with local or documented deployment checks and report exact results.",
    ],
  }),
  product: preset({
    role: "product",
    displayName: "Product Agent",
    primarySpecialty: "product planning",
    specialtyTags: ["product", "planning", "requirements"],
    focus: [
      "Clarify goals, user flows, success criteria, tradeoffs, and implementation-ready scope.",
      "Keep plans decision-complete while avoiding unnecessary product or technical expansion.",
      "Surface open questions only when they materially change the plan or acceptance criteria.",
    ],
  }),
  marketing: preset({
    role: "marketing",
    displayName: "Marketing Agent",
    primarySpecialty: "marketing content",
    specialtyTags: ["marketing", "copy", "positioning"],
    focus: [
      "Create or refine marketing copy, positioning, launch materials, and campaign content.",
      "Use source-backed claims and avoid inventing unsupported product, pricing, or compliance details.",
      "Keep output concise, audience-aware, and ready for owner review.",
    ],
  }),
  email: preset({
    role: "email",
    displayName: "Email Agent",
    primarySpecialty: "email communication",
    specialtyTags: ["email", "communication", "copy"],
    focus: [
      "Draft, revise, and structure email communication for the requested audience and outcome.",
      "Keep tone direct, useful, and aligned with any provided relationship or business context.",
      "Call out assumptions and avoid committing the user to facts not provided in context.",
    ],
  }),
} satisfies Record<AgentPromptRole, RolePreset>;

export function generateAgentPrompt(
  input: GenerateAgentPromptInput,
): GenerateAgentPromptResult {
  const workspace = requireText(input.workspace, "workspace");
  const role = parseRole(input.role);
  const preset = rolePresets[role];
  const projectName = optionalText(input.projectName) ?? workspace;
  const task = optionalText(input.task);
  const context = optionalText(input.context);
  const constraints = optionalText(input.constraints);
  const suggestedAgentMetadata = {
    projectName,
    displayName: preset.displayName,
    primarySpecialty: preset.primarySpecialty,
    specialtyTags: preset.specialtyTags,
    handoff: preset.handoff,
  };

  return {
    workspace,
    role,
    prompt: renderPrompt({
      preset,
      projectName,
      task,
      context,
      constraints,
    }),
    displayName: preset.displayName,
    suggestedAgentMetadata,
    delivery: {
      mode: "manual",
      instruction:
        "Paste this prompt into an empty Codex chat. After that chat has a Codex session ID, introduce it with the suggested metadata.",
    },
  };
}

function preset(input: RolePreset): RolePreset {
  return {
    ...input,
    handoff: input.handoff ?? {
      whenToUse: input.primarySpecialty,
      handoffPromptTemplate:
        "You are {agentDisplayName}, a Codex agent for {projectName}. Handle this task: {task}\n\nContext:\n{context}",
      requiredContext: ["task", "context"],
      expectedOutput:
        "Concise result, changed files, verification, and residual risks.",
      constraints: [
        "Read repo instructions before changing files.",
        "Keep changes scoped and report exact verification.",
      ],
    },
  };
}

function parseRole(role: string): AgentPromptRole {
  const normalized = requireText(role, "role");
  if (isAgentPromptRole(normalized)) {
    return normalized;
  }

  throw new LorError(
    "validation_error",
    "role must be one of the supported role presets.",
    {
      field: "role",
      supportedRoles: agentPromptRoles.join(", "),
    },
  );
}

function isAgentPromptRole(role: string): role is AgentPromptRole {
  return agentPromptRoles.includes(role as AgentPromptRole);
}

function requireText(value: string, field: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new LorError("validation_error", `${field} is required.`, {
      field,
    });
  }
  return trimmed;
}

function optionalText(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function renderPrompt(input: {
  preset: RolePreset;
  projectName: string;
  task?: string;
  context?: string;
  constraints?: string;
}): string {
  const sections = [
    `You are ${input.preset.displayName}, a specialized Codex agent for ${input.projectName}.`,
    "",
    "Role focus:",
    `Primary specialty: ${input.preset.primarySpecialty}.`,
    `Specialty tags: ${input.preset.specialtyTags.join(", ")}.`,
    ...input.preset.focus.map((line) => `- ${line}`),
    "",
    "Operating rules:",
    "- Read repo instructions before changing files.",
    "- Respect planning-only, review-only, and learn-first tasks.",
    "- Keep changes scoped to the request.",
    "- Preserve user and other-agent work; do not revert unrelated changes.",
    "- Report exact verification commands and results.",
  ];

  if (input.task) {
    sections.push("", "Initial task:", input.task);
  }

  if (input.context) {
    sections.push("", "Context:", input.context);
  }

  if (input.constraints) {
    sections.push("", "User constraints:", input.constraints);
  }

  sections.push(
    "",
    "Delivery:",
    "Work inside this Codex chat. Do not assume Local Orchestration Router (LOR) created, registered, or contacted any other agent.",
  );

  return sections.join("\n");
}
