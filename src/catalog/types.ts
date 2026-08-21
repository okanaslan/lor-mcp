export type EntryType = "agent" | "skill" | "subagent";
export type CatalogScope = "workspace" | "global";
export type AgentStatus = "active" | "retired";
export type ReachabilityStatus =
  | "unknown"
  | "reachable"
  | "unreachable"
  | "unsupported";
export type DispatchMode = "manual" | "codex_thread" | "unsupported";
export type VerificationStatus = "verified" | "unverified" | "unknown";
export type Confidence = "low" | "medium" | "high";
export type MatchStatus = "ok" | "no_match" | "conflict";
export type ReferenceEntryType = "agent" | "skill";
export type UsageEntryType = "skill" | "subagent" | "note";
export type UsageOperation = "listed" | "matched" | "detailed";

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

export interface AgentReachability {
  reachabilityStatus: ReachabilityStatus;
  dispatchMode: DispatchMode;
  lastReachabilityCheckAt?: string;
  lastReachabilityError?: string;
  lastDispatchAt?: string;
}

export interface SkillContext {
  whenToUse?: string;
  usageNotes?: string;
  constraints?: readonly string[];
  examplePrompts?: readonly string[];
  negativeRouting?: NegativeRoutingMetadata | null;
  implementationGuidance?: SkillImplementationGuidance | null;
}

export interface NegativeRoutingMetadata {
  doNotUseWhen: readonly string[];
  insteadUse?: readonly string[];
  notes?: string;
}

export interface SkillImplementationGuidance {
  firstInspect?: readonly string[];
  implementationRules?: readonly string[];
  commonFixPatterns?: readonly SkillFixPattern[];
  testsToAdd?: readonly string[];
  verification?: readonly string[];
  handoffChecklist?: readonly string[];
}

export interface SkillFixPattern {
  problem: string;
  approach: string;
  antiPattern?: string;
}

export interface CatalogReference {
  entryType: ReferenceEntryType;
  name: string;
  scope?: CatalogScope;
  entryKey?: string;
  required?: boolean;
}

export interface BaseCatalogEntry extends VerificationMetadata {
  workspace: string;
  scope: CatalogScope;
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
  scope: "workspace";
  codexSessionId: string;
  agentStatus: AgentStatus;
  reachability: AgentReachability;
  retiredAt?: string;
  retirementReason?: string;
  replacedByAgentEntryKey?: string;
  replacesAgentEntryKey?: string;
  handoff?: HandoffMetadata;
}

export interface SkillCatalogEntry extends BaseCatalogEntry {
  entryType: "skill";
  scope: CatalogScope;
  skillName: string;
  skillContext?: SkillContext;
}

export interface SubagentCatalogEntry extends BaseCatalogEntry {
  entryType: "subagent";
  scope: CatalogScope;
  name: string;
  purpose: string;
  limitedScope: string;
  agentReferences: readonly CatalogReference[];
  skillReferences: readonly CatalogReference[];
  unresolvedReferences: readonly CatalogReference[];
  promptTemplate?: string;
  constraints: readonly string[];
  expectedOutput: string;
  prompt: string;
  negativeRouting?: NegativeRoutingMetadata;
}

export type CatalogEntry =
  | AgentCatalogEntry
  | SkillCatalogEntry
  | SubagentCatalogEntry;

export interface IntroduceAgentInput {
  workspace: string;
  codexSessionId: string;
  projectName: string;
  displayName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  replacesAgentEntryKey?: string;
  handoff?: HandoffMetadata;
}

export interface IntroduceSkillInput {
  workspace: string;
  scope?: CatalogScope;
  skillName: string;
  projectName: string;
  displayName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  skillContext?: SkillContext;
}

export interface IntroduceSubagentInput {
  workspace: string;
  scope?: CatalogScope;
  name: string;
  projectName: string;
  displayName: string;
  purpose: string;
  limitedScope: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  agentReferences?: readonly CatalogReference[];
  skillReferences?: readonly CatalogReference[];
  unresolvedReferences?: readonly CatalogReference[];
  promptTemplate?: string;
  constraints?: readonly string[];
  expectedOutput?: string;
  negativeRouting?: NegativeRoutingMetadata;
}

export interface ListEntriesFilter {
  workspace: string;
  entryType?: EntryType;
  projectName?: string;
  scope?: CatalogScope;
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
  deletedSubagents: number;
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
  negativeRouting?: NegativeRoutingMetadata | null;
}

export interface PromoteSkillToGlobalInput {
  workspace: string;
  skillName: string;
}

export interface PromoteSkillToGlobalResult {
  workspace: string;
  sourceSkill: SkillCatalogEntry;
  globalSkill: SkillCatalogEntry;
  promoted: true;
}

export interface RetireAgentInput {
  workspace: string;
  agentEntryKey: string;
  reason?: string;
  replacedByAgentEntryKey?: string;
  confirm: true;
}

export interface RetireAgentResult {
  workspace: string;
  agent: AgentCatalogEntry;
  retiredAt: string;
  replacedByAgent?: HandoffTargetAgent;
}

export interface RecordAgentDispatchSuccessInput {
  workspace: string;
  agentEntryKey: string;
  dispatchedAt: string;
}

export interface RecordAgentDispatchFailureInput {
  workspace: string;
  agentEntryKey: string;
  error: string;
  checkedAt: string;
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
  scope?: CatalogScope;
  skillName: string;
  reason: string;
  skillContext?: SkillContext;
  metadata?: SkillMetadataUpdate;
}

export interface ApplySkillUpdateInput {
  workspace: string;
  scope?: CatalogScope;
  proposalId: string;
  confirm: true;
}

export interface SkillUpdateProposal {
  proposalId: string;
  workspace: string;
  scope: CatalogScope;
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
  scope?: CatalogScope;
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
  agentStatus?: AgentStatus;
  retiredAt?: string;
  retirementReason?: string;
  replacedByAgentEntryKey?: string;
  replacesAgentEntryKey?: string;
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

export interface CatalogExportSubagentEntry extends VerificationMetadata {
  entryType: "subagent";
  name: string;
  projectName: string;
  displayName: string;
  purpose: string;
  limitedScope: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  agentReferences: readonly CatalogReference[];
  skillReferences: readonly CatalogReference[];
  unresolvedReferences: readonly CatalogReference[];
  promptTemplate?: string;
  constraints: readonly string[];
  expectedOutput: string;
  negativeRouting?: NegativeRoutingMetadata;
}

export type CatalogExportEntry =
  | CatalogExportAgentEntry
  | CatalogExportSkillEntry
  | CatalogExportSubagentEntry;

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

export interface WorkspaceCatalogSyncInput {
  sourceWorkspace: string;
  targetWorkspace: string;
  projectName?: string;
  skillNames?: readonly string[];
  subagentNames?: readonly string[];
  agentPromptRoles?: readonly string[];
}

export interface ApplyWorkspaceCatalogSyncInput
  extends WorkspaceCatalogSyncInput {
  confirm: true;
}

export interface WorkspaceCatalogSyncSummary {
  selectedSkills: number;
  skillsToCopy: number;
  duplicateSkills: number;
  missingSkills: number;
  selectedSubagents: number;
  subagentsToCopy: number;
  duplicateSubagents: number;
  missingSubagents: number;
  generatedAgentPrompts: number;
  copiedSkills?: number;
  copiedSubagents?: number;
}

export interface WorkspaceCatalogSyncAgentPrompt {
  workspace: string;
  role: string;
  prompt: string;
  displayName: string;
  suggestedAgentMetadata: {
    projectName: string;
    displayName: string;
    primarySpecialty: string;
    specialtyTags: readonly string[];
    handoff?: HandoffMetadata;
  };
  delivery: {
    mode: "manual";
    instruction: string;
  };
}

export interface WorkspaceCatalogSyncPreview {
  sourceWorkspace: string;
  targetWorkspace: string;
  projectName?: string;
  requestedSkillNames?: readonly string[];
  requestedSubagentNames?: readonly string[];
  requestedAgentPromptRoles?: readonly string[];
  skillsToCopy: CatalogExportSkillEntry[];
  subagentsToCopy: CatalogExportSubagentEntry[];
  duplicateSkills: readonly string[];
  duplicateSubagents: readonly string[];
  missingSkills: readonly string[];
  missingSubagents: readonly string[];
  generatedAgentPrompts: WorkspaceCatalogSyncAgentPrompt[];
  summary: WorkspaceCatalogSyncSummary;
}

export interface WorkspaceCatalogSyncApplyResult
  extends WorkspaceCatalogSyncPreview {
  copiedSkills: readonly string[];
  copiedSubagents: readonly string[];
  importResult: CatalogImportResult;
}

export interface CatalogHealthFilter {
  workspace: string;
  entryType?: EntryType;
  projectName?: string;
  entryKey?: string;
  scope?: CatalogScope;
}

export interface CatalogHealthIssue {
  code: string;
  message: string;
}

export interface CatalogHealthEntry {
  scope: CatalogScope;
  entryType: "agent" | "skill";
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

export type CoverageStatus = "healthy" | "needs_attention" | "low_coverage";

export interface CatalogCoverageDimension {
  name: string;
  skills: number;
  subagents: number;
}

export interface CatalogCoverageHealth {
  workspaceSkillCount: number;
  globalSkillCount: number;
  workspaceSubagentCount: number;
  globalSubagentCount: number;
  skillCount: number;
  subagentCount: number;
  projectCoverage: CatalogCoverageDimension[];
  specialtyCoverage: CatalogCoverageDimension[];
  coverageStatus: CoverageStatus;
  recommendedActions: string[];
}

export interface CatalogHealthReport {
  checkedAt: string;
  workspace: string;
  filters: {
    entryType?: "agent" | "skill";
    projectName?: string;
    scope?: CatalogScope;
    entryKey?: string;
  };
  summary: CatalogHealthSummary;
  coverage: CatalogCoverageHealth;
  entries: CatalogHealthEntry[];
}

export interface WorkspaceCatalogCounts {
  total: number;
  agents: number;
  skills: number;
  subagents: number;
}

export interface WorkspaceDiagnosticsInput {
  workspace: string;
}

export interface WorkspaceDiagnosticsStorageStatus {
  configured: boolean;
  reachable: boolean;
  schemaVersion?: number;
  message?: string;
}

export interface WorkspaceDiagnosticsRuntimeStatus {
  transport: "mcp";
  activeHttpSessions?: number;
}

export interface WorkspaceDiagnosticsAgentsMdStatus {
  status: "present" | "missing" | "not_inspected";
  instruction: string;
}

export interface WorkspaceDiagnosticsLocalSkillStatus {
  configuredRoots: number;
  discoveredSkillNames: readonly string[];
  registeredSkillsWithLocalFile: readonly string[];
  registeredSkillsWithoutLocalFile: readonly string[];
  unregisteredLocalSkillNames: readonly string[];
}

export interface WorkspaceDiagnosticsLocalContext {
  agentsMd: WorkspaceDiagnosticsAgentsMdStatus;
  skills: WorkspaceDiagnosticsLocalSkillStatus;
  recommendedActions: readonly string[];
}

export interface WorkspaceDiagnosticsReport {
  inputWorkspace: string;
  resolvedWorkspace: string;
  aliases: readonly string[];
  catalogCounts: WorkspaceCatalogCounts;
  storageStatus: WorkspaceDiagnosticsStorageStatus;
  runtimeStatus: WorkspaceDiagnosticsRuntimeStatus;
  localContext: WorkspaceDiagnosticsLocalContext;
  checkedAt: string;
}

export interface WorkspaceNote {
  noteId: string;
  workspace: string;
  title: string;
  body: string;
  tags: readonly string[];
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceNoteSummary = Omit<WorkspaceNote, "body">;

export interface RememberWorkspaceNoteInput {
  workspace: string;
  title: string;
  body: string;
  tags?: readonly string[];
}

export interface ListWorkspaceNotesInput {
  workspace: string;
  tags?: readonly string[];
}

export interface ListWorkspaceNotesResult {
  workspace: string;
  filters: {
    tags?: readonly string[];
  };
  notes: readonly WorkspaceNoteSummary[];
}

export interface FindMatchingWorkspaceNoteInput {
  workspace: string;
  query: string;
  tags?: readonly string[];
  limit?: number;
}

export interface WorkspaceNoteMatch extends WorkspaceNoteSummary {
  score: number;
  matchedFields: readonly string[];
  matchedSignals: readonly string[];
  preview: string;
}

export interface FindMatchingWorkspaceNoteResult {
  status: Extract<MatchStatus, "ok" | "no_match">;
  workspace: string;
  query: string;
  filters: {
    tags?: readonly string[];
    limit: number;
  };
  notes: readonly WorkspaceNoteMatch[];
}

export interface GetWorkspaceNoteInput {
  workspace: string;
  noteId: string;
}

export interface RemoveWorkspaceNoteInput {
  workspace: string;
  noteId: string;
}

export interface RemoveWorkspaceNoteResult {
  workspace: string;
  noteId: string;
  removed: boolean;
}

export interface UsageCounterIncrement {
  workspace: string;
  entryType: UsageEntryType;
  scope: CatalogScope;
  entryKey: string;
  projectName?: string;
  operation: UsageOperation;
  count?: number;
}

export interface UsageCounterRecord {
  workspace: string;
  entryType: UsageEntryType;
  scope: CatalogScope;
  entryKey: string;
  projectName?: string;
  operation: UsageOperation;
  count: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface UsageAnalyticsFilter {
  workspace: string;
  entryType?: UsageEntryType;
  scope?: CatalogScope;
  entryKey?: string;
  projectName?: string;
}

export interface UsageAnalyticsEntry {
  workspace: string;
  entryType: UsageEntryType;
  scope: CatalogScope;
  entryKey: string;
  projectName?: string;
  listed: number;
  matched: number;
  detailed: number;
  total: number;
  firstSeenAt?: string;
  lastSeenAt?: string;
}

export interface UsageAnalyticsTypeSummary {
  entries: number;
  listed: number;
  matched: number;
  detailed: number;
  total: number;
}

export interface UsageAnalyticsSummary {
  totalEntries: number;
  totalCount: number;
  byEntryType: Record<UsageEntryType, UsageAnalyticsTypeSummary>;
  byOperation: Record<UsageOperation, number>;
}

export interface UsageAnalyticsReport {
  workspace: string;
  checkedAt: string;
  filters: {
    entryType?: UsageEntryType;
    scope?: CatalogScope;
    entryKey?: string;
    projectName?: string;
  };
  summary: UsageAnalyticsSummary;
  entries: UsageAnalyticsEntry[];
  recommendedActions: string[];
}

export interface HandoffTargetAgent {
  entryKey: string;
  codexSessionId: string;
  displayName: string;
  projectName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  reachability: AgentReachability;
}

export interface EntryLookup {
  workspace: string;
  entryType: EntryType;
  entryKey: string;
  scope?: CatalogScope;
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
  negativeMatchedFields?: string[];
  negativeMatchedSignals?: string[];
  negativeScore?: number;
  demotedByNegativeRouting?: boolean;
}

export interface MatchCandidate {
  scope: CatalogScope;
  entryType: EntryType;
  entryKey: string;
  displayName: string;
  projectName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  reachability?: AgentReachability;
  skillContext?: SkillContext;
  purpose?: string;
  limitedScope?: string;
  prompt?: string;
  agentReferences?: readonly CatalogReference[];
  skillReferences?: readonly CatalogReference[];
  unresolvedReferences?: readonly CatalogReference[];
  negativeRouting?: NegativeRoutingMetadata;
  score: number;
  matchedFields: string[];
  matchedSignals: string[];
  explanation: MatchExplanation;
}

export interface MatchData {
  agents: MatchCandidate[];
  skills: MatchCandidate[];
  subagents: MatchCandidate[];
  agentsAmbiguous: boolean;
  conflict?: {
    reason: string;
    candidates: MatchCandidate[];
    matchedSignals: string[];
    differentiatingFields: string[];
    differentiatingSignals: string[];
    suggestedClarificationQuestion: string;
    recommendedNextAction: string;
    resolutionHint: string;
  };
}

export interface MatchResult {
  status: MatchStatus;
  data: MatchData;
}

export interface PrepareAgentInitializationInput {
  workspace: string;
  task: string;
  projectName?: string;
  specialtyHints?: readonly string[];
}

export interface LocalInstructionSource {
  name: string;
  status: "manual_reference";
  instruction: string;
}

export interface PrepareAgentInitializationResult {
  workspace: string;
  task: string;
  recommendedSkills: MatchCandidate[];
  recommendedSubagents: MatchCandidate[];
  localInstructionSources: LocalInstructionSource[];
  prompt: string;
  nextSteps: string[];
  failureGuidance: string[];
  delivery: {
    mode: "manual";
    instruction: string;
  };
}

export interface CatalogRepository {
  initialize(): Promise<void>;
  createAgent(
    workspace: string,
    input: IntroduceAgentInput & {
      verification: VerificationMetadata;
      now: string;
      agentStatus?: AgentStatus;
      retiredAt?: string;
      retirementReason?: string;
      replacedByAgentEntryKey?: string;
    },
  ): Promise<AgentCatalogEntry>;
  createSkill(
    workspace: string,
    input: IntroduceSkillInput & {
      verification: VerificationMetadata;
      now: string;
    },
  ): Promise<SkillCatalogEntry>;
  createSubagent(
    workspace: string,
    input: IntroduceSubagentInput & {
      verification: VerificationMetadata;
      now: string;
    },
  ): Promise<SubagentCatalogEntry>;
  createSkillUpdateProposal(
    input: SkillUpdateProposal,
  ): Promise<SkillUpdateProposal>;
  getSkillUpdateProposal(
    workspace: string,
    proposalId: string,
    scope?: CatalogScope,
  ): Promise<SkillUpdateProposal | undefined>;
  applySkillUpdateProposal(
    workspace: string,
    proposalId: string,
    scope: CatalogScope | undefined,
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
  listWorkspaceAliases(canonicalWorkspace: string): Promise<string[]>;
  getSchemaVersion(): Promise<number | undefined>;
  createWorkspaceNote(input: WorkspaceNote): Promise<WorkspaceNote>;
  listWorkspaceNotes(
    workspace: string,
    filter?: { tags?: readonly string[] },
  ): Promise<WorkspaceNote[]>;
  getWorkspaceNote(
    workspace: string,
    noteId: string,
  ): Promise<WorkspaceNote | undefined>;
  removeWorkspaceNote(workspace: string, noteId: string): Promise<boolean>;
  recordUsageCounters(
    increments: readonly UsageCounterIncrement[],
    options: { now: string },
  ): Promise<void>;
  getUsageCounters(
    workspace: string,
    filter: Omit<UsageAnalyticsFilter, "workspace">,
  ): Promise<UsageCounterRecord[]>;
  updateEntry(
    workspace: string,
    input: CatalogEntryUpdate & { now: string },
  ): Promise<CatalogEntry | undefined>;
  retireAgent(
    workspace: string,
    input: RetireAgentInput & { now: string },
  ): Promise<AgentCatalogEntry | undefined>;
  updateAgentReachability(
    workspace: string,
    agentEntryKey: string,
    input: {
      reachability: AgentReachability;
      updatedAt: string;
    },
  ): Promise<AgentCatalogEntry | undefined>;
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
