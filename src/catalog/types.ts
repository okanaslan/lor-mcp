export type EntryType = "agent" | "skill" | "subagent";
export type CatalogScope = "workspace" | "global";
export type AgentStatus = "active" | "retired";
export type ReachabilityStatus =
  | "unknown"
  | "reachable"
  | "unreachable"
  | "unsupported";
export type DispatchMode = "manual" | "codex_thread" | "unsupported";
export type DelegatedAgentTaskStatus =
  | "queued"
  | "sent"
  | "running"
  | "needs_input"
  | "completed"
  | "failed"
  | "cancelled";
export type VerificationStatus = "verified" | "unverified" | "unknown";
export type Confidence = "low" | "medium" | "high";
export type MatchStatus = "ok" | "no_match" | "conflict";
export type ReferenceEntryType = "agent" | "skill";

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
  entryType?: "agent" | "skill";
}

export interface ClearWorkspaceCatalogResult {
  workspace: string;
  entryType?: "agent" | "skill";
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

export interface SendAgentTaskInput {
  workspace: string;
  agentEntryKey: string;
  task: string;
  context?: string;
}

export interface GetAgentTaskStatusInput {
  workspace: string;
  taskId: string;
}

export interface ListActiveTasksInput {
  workspace: string;
  agentEntryKey?: string;
}

export interface DelegatedAgentTask {
  taskId: string;
  workspace: string;
  agentEntryKey: string;
  codexSessionId: string;
  status: DelegatedAgentTaskStatus;
  task: string;
  context?: string;
  createdAt: string;
  sentAt?: string;
  updatedAt: string;
  completedAt?: string;
  failureMessage?: string;
  externalTaskId?: string;
}

export interface AgentTaskDispatchRequest {
  workspace: string;
  taskId: string;
  agentEntryKey: string;
  codexSessionId: string;
  prompt: string;
}

export type AgentTaskDispatchOutcome =
  | {
    status: "sent" | "running";
    sentAt?: string;
    externalTaskId?: string;
  }
  | {
    status: "failed";
    failureMessage: string;
    failedAt?: string;
  };

export type AgentTaskDispatcher = (
  request: AgentTaskDispatchRequest,
) => Promise<AgentTaskDispatchOutcome>;

export interface SendAgentTaskResult {
  workspace: string;
  targetAgent: HandoffTargetAgent;
  task: DelegatedAgentTask;
  prompt: string;
  dispatch:
    | {
      mode: "manual";
      instruction: string;
    }
    | {
      mode: "codex_native";
      externalTaskId?: string;
    }
    | {
      mode: "failed";
      failureMessage: string;
    };
}

export interface ListActiveTasksResult {
  workspace: string;
  tasks: DelegatedAgentTask[];
}

export type DelegatedTaskMessageDirection =
  | "caller_to_agent"
  | "agent_to_caller";

export interface DelegatedTaskMessage {
  messageId: string;
  taskId: string;
  workspace: string;
  direction: DelegatedTaskMessageDirection;
  message: string;
  createdAt: string;
}

export interface AppendAgentContextInput {
  workspace: string;
  taskId: string;
  message: string;
}

export interface AppendAgentContextResult {
  workspace: string;
  task: DelegatedAgentTask;
  message: DelegatedTaskMessage;
  delivery:
    | {
      mode: "manual";
      instruction: string;
    }
    | {
      mode: "codex_native";
    };
}

export interface GetAgentTaskResultInput {
  workspace: string;
  taskId: string;
}

export interface RecordAgentTaskResultInput {
  workspace: string;
  taskId: string;
  summary: string;
  result: string;
  completedAt: string;
}

export interface AgentTaskResult {
  workspace: string;
  taskId: string;
  status: DelegatedAgentTaskStatus;
  resultAvailable: boolean;
  summary?: string;
  result?: string;
  completedAt?: string;
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
  entries: CatalogHealthEntry[];
}

export interface PrepareAgentHandoffInput {
  workspace: string;
  agentEntryKey: string;
  task: string;
  context?: string;
}

export interface PrepareAgentRegenerationInput {
  workspace: string;
  agentEntryKey: string;
  reason?: string;
  carryForwardContext?: string;
  replacementTask?: string;
  includeRegistrationInstructions?: boolean;
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

export interface RegenerationSourceAgent extends HandoffTargetAgent {
  handoff?: HandoffMetadata;
}

export interface SuggestedReplacementAgentMetadata {
  projectName: string;
  displayName: string;
  primarySpecialty: string;
  specialtyTags: readonly string[];
  replacesAgentEntryKey?: string;
  handoff?: HandoffMetadata;
}

export interface PrepareAgentRegenerationResult {
  workspace: string;
  sourceAgent: RegenerationSourceAgent;
  prompt: string;
  suggestedReplacementMetadata: SuggestedReplacementAgentMetadata;
  replacementInstructions: string[];
  catalogAction: {
    mode: "manual";
    instruction: string;
  };
  delivery: {
    mode: "manual";
    instruction: string;
  };
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
  createDelegatedAgentTask(
    input: DelegatedAgentTask,
  ): Promise<DelegatedAgentTask>;
  updateDelegatedAgentTask(
    workspace: string,
    taskId: string,
    input: {
      status: DelegatedAgentTaskStatus;
      updatedAt: string;
      sentAt?: string;
      completedAt?: string;
      failureMessage?: string;
      externalTaskId?: string;
    },
  ): Promise<DelegatedAgentTask | undefined>;
  getDelegatedAgentTask(
    workspace: string,
    taskId: string,
  ): Promise<DelegatedAgentTask | undefined>;
  listActiveDelegatedAgentTasks(
    workspace: string,
    filter?: { agentEntryKey?: string },
  ): Promise<DelegatedAgentTask[]>;
  createDelegatedTaskMessage(
    input: DelegatedTaskMessage,
  ): Promise<DelegatedTaskMessage>;
  recordDelegatedAgentTaskResult(
    workspace: string,
    input: {
      taskId: string;
      summary: string;
      result: string;
      completedAt: string;
    },
  ): Promise<AgentTaskResult | undefined>;
  getDelegatedAgentTaskResult(
    workspace: string,
    taskId: string,
  ): Promise<AgentTaskResult | undefined>;
  close(): void;
}
