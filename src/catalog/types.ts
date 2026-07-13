export type EntryType = "agent" | "skill";
export type VerificationStatus = "verified" | "unverified" | "unknown";
export type Confidence = "low" | "medium" | "high";
export type MatchStatus = "ok" | "no_match" | "conflict";

export interface VerificationMetadata {
  verificationStatus: VerificationStatus;
  verificationSource: string;
  verifiedAt: string;
  verificationMessage?: string;
}

export interface HandoffMetadata {
  whenToUse: string;
  handoffPromptTemplate: string;
  requiredContext: string[];
  expectedOutput: string;
  constraints: string[];
}

export interface BaseCatalogEntry extends VerificationMetadata {
  workspace: string;
  entryType: EntryType;
  entryKey: string;
  projectName: string;
  displayName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentCatalogEntry extends BaseCatalogEntry {
  entryType: "agent";
  codexSessionId: string;
  handoff?: HandoffMetadata;
}

export interface SkillCatalogEntry extends BaseCatalogEntry {
  entryType: "skill";
  skillName: string;
}

export type CatalogEntry = AgentCatalogEntry | SkillCatalogEntry;

export interface IntroduceAgentInput {
  workspace: string;
  codexSessionId: string;
  projectName: string;
  displayName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  handoff?: HandoffMetadata;
}

export interface IntroduceSkillInput {
  workspace: string;
  skillName: string;
  projectName: string;
  displayName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
}

export interface ListEntriesFilter {
  workspace: string;
  entryType?: EntryType;
  projectName?: string;
}

export interface ClearWorkspaceCatalogInput {
  workspace: string;
  confirm: true;
  entryType?: EntryType;
}

export interface ClearWorkspaceCatalogResult {
  workspace: string;
  entryType?: EntryType;
  deletedAgents: number;
  deletedSkills: number;
  deletedTotal: number;
}

export interface EntryLookup {
  workspace: string;
  entryType: EntryType;
  entryKey: string;
}

export interface MatchRequest {
  workspace: string;
  task: string;
  projectName?: string;
  preferredType?: EntryType;
  specialtyHints?: string[];
}

export interface MatchExplanation {
  summary: string;
  confidence: Confidence;
  matchedFields: string[];
  matchedSignals: string[];
  score: number;
}

export interface MatchCandidate {
  entryType: EntryType;
  entryKey: string;
  displayName: string;
  projectName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  score: number;
  matchedFields: string[];
  matchedSignals: string[];
  explanation: MatchExplanation;
}

export interface MatchData {
  agents: MatchCandidate[];
  skills: MatchCandidate[];
  agentsAmbiguous: boolean;
  conflict?: {
    reason: string;
    candidates: MatchCandidate[];
    matchedSignals: string[];
    resolutionHint: string;
  };
}

export interface MatchResult {
  status: MatchStatus;
  data: MatchData;
}

export interface CatalogRepository {
  initialize(): Promise<void>;
  createAgent(
    workspace: string,
    input: IntroduceAgentInput & {
      verification: VerificationMetadata;
      now: string;
    },
  ): Promise<AgentCatalogEntry>;
  createSkill(
    workspace: string,
    input: IntroduceSkillInput & {
      verification: VerificationMetadata;
      now: string;
    },
  ): Promise<SkillCatalogEntry>;
  listEntries(
    workspace: string,
    filter: ListEntriesFilter,
  ): Promise<CatalogEntry[]>;
  clearEntries(
    workspace: string,
    input: ClearWorkspaceCatalogInput,
  ): Promise<ClearWorkspaceCatalogResult>;
  getEntry(
    workspace: string,
    lookup: EntryLookup,
  ): Promise<CatalogEntry | undefined>;
  close(): void;
}
