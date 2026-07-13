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
  catalogNamespace: string;
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
  codexSessionId: string;
  projectName: string;
  displayName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  handoff?: HandoffMetadata;
}

export interface IntroduceSkillInput {
  skillName: string;
  projectName: string;
  displayName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
}

export interface ListEntriesFilter {
  entryType?: EntryType;
  projectName?: string;
}

export interface EntryLookup {
  entryType: EntryType;
  entryKey: string;
}

export interface MatchRequest {
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
    namespace: string,
    input: IntroduceAgentInput & {
      verification: VerificationMetadata;
      now: string;
    },
  ): Promise<AgentCatalogEntry>;
  createSkill(
    namespace: string,
    input: IntroduceSkillInput & {
      verification: VerificationMetadata;
      now: string;
    },
  ): Promise<SkillCatalogEntry>;
  listEntries(
    namespace: string,
    filter: ListEntriesFilter,
  ): Promise<CatalogEntry[]>;
  getEntry(
    namespace: string,
    lookup: EntryLookup,
  ): Promise<CatalogEntry | undefined>;
  close(): void;
}
