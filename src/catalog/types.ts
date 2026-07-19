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

export interface SkillContext {
  whenToUse?: string;
  usageNotes?: string;
  constraints?: readonly string[];
  examplePrompts?: readonly string[];
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
  skillContext?: SkillContext;
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
  skillContext?: SkillContext;
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

export interface RegisterWorkspaceAliasInput {
  workspace: string;
  alias: string;
  confirm?: true;
}

export interface RegisterWorkspaceAliasResult {
  workspace: string;
  alias: string;
  created: boolean;
  reassigned: boolean;
}

export interface CatalogEntryUpdate extends EntryLookup {
  projectName?: string;
  displayName?: string;
  primarySpecialty?: string;
  specialtyTags?: readonly string[];
}

export interface SkillMetadataUpdate {
  projectName?: string;
  displayName?: string;
  primarySpecialty?: string;
  specialtyTags?: readonly string[];
}

export type SkillUpdateProposalStatus = "pending" | "applied";

export interface ProposeSkillUpdateInput {
  workspace: string;
  skillName: string;
  reason: string;
  skillContext?: SkillContext;
  metadata?: SkillMetadataUpdate;
}

export interface ApplySkillUpdateInput {
  workspace: string;
  proposalId: string;
  confirm: true;
}

export interface SkillUpdateProposal {
  proposalId: string;
  workspace: string;
  skillName: string;
  reason: string;
  proposedSkillContext?: SkillContext;
  proposedMetadata?: SkillMetadataUpdate;
  status: SkillUpdateProposalStatus;
  createdAt: string;
  appliedAt?: string;
}

export interface SkillUpdateProposalResult {
  proposal: SkillUpdateProposal;
  before: SkillCatalogEntry;
  after: SkillCatalogEntry;
}

export interface SkillFileSyncInput {
  workspace: string;
  skillName: string;
  proposalId: string;
}

export interface ApplySkillFileSyncInput extends SkillFileSyncInput {
  confirm: true;
}

export interface SkillFileSyncPreview {
  workspace: string;
  skillName: string;
  proposalId: string;
  targetFile: "SKILL.md";
  sectionName: "lor-managed-skill-context";
  sectionExists: boolean;
  wouldChange: boolean;
  renderedSection: string;
}

export interface SkillFileSyncApplyResult extends SkillFileSyncPreview {
  written: boolean;
}

export interface RemoveCatalogEntryResult extends EntryLookup {
  removed: true;
}

export interface CatalogExportFilter {
  workspace: string;
  entryType?: EntryType;
  projectName?: string;
}

export type CatalogImportConflictStrategy = "skip" | "fail";

export interface CatalogExportAgentEntry extends VerificationMetadata {
  entryType: "agent";
  codexSessionId: string;
  projectName: string;
  displayName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  handoff?: HandoffMetadata;
}

export interface CatalogExportSkillEntry extends VerificationMetadata {
  entryType: "skill";
  skillName: string;
  projectName: string;
  displayName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  skillContext?: SkillContext;
}

export type CatalogExportEntry =
  | CatalogExportAgentEntry
  | CatalogExportSkillEntry;

export interface CatalogExport {
  version: 1;
  exportedAt: string;
  workspace: string;
  filters: {
    entryType?: EntryType;
    projectName?: string;
  };
  entries: CatalogExportEntry[];
}

export interface CatalogImportInput {
  workspace: string;
  catalog: CatalogExport;
  conflictStrategy?: CatalogImportConflictStrategy;
}

export interface CatalogImportIssue {
  index: number;
  entryType?: EntryType;
  entryKey?: string;
  code: string;
  message: string;
}

export interface CatalogImportResult {
  workspace: string;
  version: 1;
  conflictStrategy: CatalogImportConflictStrategy;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: CatalogImportIssue[];
}

export interface CatalogHealthFilter {
  workspace: string;
  entryType?: EntryType;
  projectName?: string;
  entryKey?: string;
}

export interface CatalogHealthIssue {
  code: string;
  message: string;
}

export interface CatalogHealthEntry {
  entryType: EntryType;
  entryKey: string;
  displayName: string;
  projectName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  verificationStatus: VerificationStatus;
  verificationSource: string;
  verifiedAt: string;
  verificationMessage?: string;
  issues: CatalogHealthIssue[];
}

export interface CatalogHealthSummary {
  total: number;
  verified: number;
  unverified: number;
  unknown: number;
  agents: number;
  skills: number;
}

export interface CatalogHealthReport {
  checkedAt: string;
  workspace: string;
  filters: {
    entryType?: EntryType;
    projectName?: string;
    entryKey?: string;
  };
  summary: CatalogHealthSummary;
  entries: CatalogHealthEntry[];
}

export interface PrepareAgentHandoffInput {
  workspace: string;
  agentEntryKey: string;
  task: string;
  context?: string;
}

export interface HandoffTargetAgent {
  entryKey: string;
  codexSessionId: string;
  displayName: string;
  projectName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
}

export interface PrepareAgentHandoffResult {
  workspace: string;
  targetAgent: HandoffTargetAgent;
  prompt: string;
  usedStoredHandoff: boolean;
  handoff?: HandoffMetadata;
  missingContext: string[];
  delivery: {
    mode: "manual";
    instruction: string;
  };
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
  skillContext?: SkillContext;
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
  createSkillUpdateProposal(
    input: SkillUpdateProposal,
  ): Promise<SkillUpdateProposal>;
  getSkillUpdateProposal(
    workspace: string,
    proposalId: string,
  ): Promise<SkillUpdateProposal | undefined>;
  applySkillUpdateProposal(
    workspace: string,
    proposalId: string,
    input: {
      entry: SkillCatalogEntry;
      appliedAt: string;
    },
  ): Promise<SkillUpdateProposal | undefined>;
  listEntries(
    workspace: string,
    filter: ListEntriesFilter,
  ): Promise<CatalogEntry[]>;
  clearEntries(
    workspace: string,
    input: ClearWorkspaceCatalogInput,
  ): Promise<ClearWorkspaceCatalogResult>;
  registerWorkspaceAlias(
    input: RegisterWorkspaceAliasInput & { now: string },
  ): Promise<RegisterWorkspaceAliasResult>;
  resolveWorkspace(
    workspace: string,
    options: { now: string },
  ): Promise<string>;
  updateEntry(
    workspace: string,
    input: CatalogEntryUpdate & { now: string },
  ): Promise<CatalogEntry | undefined>;
  removeEntry(
    workspace: string,
    lookup: EntryLookup,
  ): Promise<boolean>;
  getEntry(
    workspace: string,
    lookup: EntryLookup,
  ): Promise<CatalogEntry | undefined>;
  close(): void;
}
