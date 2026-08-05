import type { Database } from "@db/sqlite";
import type {
  AgentCatalogEntry,
  AgentReachability,
  AgentStatus,
  AgentTaskResult,
  CatalogEntry,
  CatalogEntryUpdate,
  CatalogRepository,
  CatalogScope,
  ClearWorkspaceCatalogInput,
  ClearWorkspaceCatalogResult,
  DelegatedAgentTask,
  DelegatedAgentTaskStatus,
  DelegatedTaskMessage,
  EntryLookup,
  IntroduceAgentInput,
  IntroduceSkillInput,
  IntroduceSubagentInput,
  ListEntriesFilter,
  RegisterWorkspaceAliasInput,
  RegisterWorkspaceAliasResult,
  RetireAgentInput,
  SkillCatalogEntry,
  SkillUpdateProposal,
  SubagentCatalogEntry,
  VerificationMetadata,
  WorkspaceNote,
} from "@src/catalog/types.ts";
import {
  normalizeSubagentPromptFields,
  renderSubagentPrompt,
} from "@src/catalog/subagent_prompt.ts";
import { LorError } from "@src/errors.ts";
import {
  isAbsoluteWorkspacePath,
  normalizeWorkspace,
  workspaceBasename,
} from "@src/catalog/workspace.ts";

interface AgentRow {
  workspace: string;
  codexSessionId: string;
  agentStatus: string;
  retiredAt: string | null;
  retirementReason: string | null;
  replacedByAgentEntryKey: string | null;
  replacesAgentEntryKey: string | null;
  reachabilityStatus: string;
  dispatchMode: string;
  lastReachabilityCheckAt: string | null;
  lastReachabilityError: string | null;
  lastDispatchAt: string | null;
  projectName: string;
  displayName: string;
  primarySpecialty: string;
  specialtyTags: string;
  handoff: string | null;
  verificationStatus: string;
  verificationSource: string;
  verifiedAt: string;
  verificationMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SkillRow {
  workspace: string;
  skillName: string;
  projectName: string;
  displayName: string;
  primarySpecialty: string;
  specialtyTags: string;
  skillContext: string | null;
  verificationStatus: string;
  verificationSource: string;
  verifiedAt: string;
  verificationMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubagentRow {
  workspace: string;
  name: string;
  projectName: string;
  displayName: string;
  purpose: string;
  limitedScope: string;
  primarySpecialty: string;
  specialtyTags: string;
  agentReferences: string;
  skillReferences: string;
  unresolvedReferences: string;
  promptTemplate: string | null;
  constraints: string;
  expectedOutput: string;
  verificationStatus: string;
  verificationSource: string;
  verifiedAt: string;
  verificationMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SkillUpdateProposalRow {
  proposalId: string;
  workspace: string;
  skillName: string;
  reason: string;
  proposedSkillContext: string | null;
  proposedMetadata: string | null;
  status: string;
  createdAt: string;
  appliedAt: string | null;
}

interface WorkspaceAliasRow {
  alias: string;
  canonicalWorkspace: string;
  createdAt: string;
  updatedAt: string;
}

interface DelegatedAgentTaskRow {
  taskId: string;
  workspace: string;
  agentEntryKey: string;
  codexSessionId: string;
  status: string;
  task: string;
  context: string | null;
  createdAt: string;
  sentAt: string | null;
  updatedAt: string;
  completedAt: string | null;
  failureMessage: string | null;
  externalTaskId: string | null;
}

interface DelegatedTaskResultRow {
  taskId: string;
  workspace: string;
  summary: string;
  result: string;
  completedAt: string;
}

interface WorkspaceNoteRow {
  noteId: string;
  workspace: string;
  title: string;
  body: string;
  tagsJson: string;
  createdAt: string;
  updatedAt: string;
}

const GLOBAL_SKILL_WORKSPACE = "__lor_global_skills__";
const GLOBAL_SUBAGENT_WORKSPACE = "__lor_global_subagents__";
const PUBLIC_GLOBAL_WORKSPACE = "global";

export class SqliteCatalogRepository implements CatalogRepository {
  #db: Database | undefined;

  constructor(private readonly dbPath: string) {}

  async initialize(): Promise<void> {
    try {
      const { Database } = await import("@db/sqlite");
      this.#db = new Database(this.dbPath);
      this.#db.exec("PRAGMA foreign_keys = ON");
      this.#db.exec("PRAGMA journal_mode = WAL");
      this.#db.exec("PRAGMA synchronous = NORMAL");
      this.#db.exec(SCHEMA_SQL);
      migrateLegacyNamespaceColumns(this.#db);
      migrateSkillContextColumn(this.#db);
      migrateAgentLifecycleColumns(this.#db);
      migrateAgentReachabilityColumns(this.#db);
      this.#db.exec(DELEGATED_TASKS_SCHEMA_SQL);
      this.#db.exec(DELEGATED_TASK_MESSAGES_SCHEMA_SQL);
      this.#db.exec(DELEGATED_TASK_RESULTS_SCHEMA_SQL);
      this.#db.exec(WORKSPACE_NOTES_SCHEMA_SQL);
      backfillWorkspaceAliases(this.#db);
      recordSchemaVersion(this.#db, 9);
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  async createAgent(
    workspace: string,
    input: IntroduceAgentInput & {
      verification: VerificationMetadata;
      now: string;
      agentStatus?: AgentStatus;
      retiredAt?: string;
      retirementReason?: string;
      replacedByAgentEntryKey?: string;
    },
  ): Promise<AgentCatalogEntry> {
    const db = this.requireDb();
    const insert = db.transaction(() => {
      if (this.agentExists(workspace, input.codexSessionId)) {
        throw new LorError(
          "duplicate_entry",
          "Agent already exists in this workspace.",
          { entryType: "agent" },
        );
      }

      db.exec(
        `INSERT INTO introduced_agents (
          workspace, codexSessionId, projectName, displayName,
          primarySpecialty, specialtyTags, handoff, agentStatus,
          retiredAt, retirementReason, replacedByAgentEntryKey,
          replacesAgentEntryKey, verificationStatus,
          verificationSource, verifiedAt, verificationMessage, createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        workspace,
        input.codexSessionId,
        input.projectName,
        input.displayName,
        input.primarySpecialty,
        JSON.stringify(input.specialtyTags),
        input.handoff ? JSON.stringify(input.handoff) : null,
        input.agentStatus ?? "active",
        input.retiredAt ?? null,
        input.retirementReason ?? null,
        input.replacedByAgentEntryKey ?? null,
        input.replacesAgentEntryKey ?? null,
        input.verification.verificationStatus,
        input.verification.verificationSource,
        input.verification.verifiedAt,
        input.verification.verificationMessage ?? null,
        input.now,
        input.now,
      );
    });

    try {
      insert();
      const created = await this.getEntry(workspace, {
        workspace,
        entryType: "agent",
        entryKey: input.codexSessionId,
      });
      return created as AgentCatalogEntry;
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  async createSkill(
    workspace: string,
    input: IntroduceSkillInput & {
      verification: VerificationMetadata;
      now: string;
    },
  ): Promise<SkillCatalogEntry> {
    const db = this.requireDb();
    const storageWorkspace = skillStorageWorkspace(workspace, input.scope);
    const insert = db.transaction(() => {
      if (this.skillExists(storageWorkspace, input.skillName)) {
        throw new LorError(
          "duplicate_entry",
          input.scope === "global"
            ? "Skill already exists in global scope."
            : "Skill already exists in this workspace.",
          { entryType: "skill" },
        );
      }

      db.exec(
        `INSERT INTO introduced_skills (
          workspace, skillName, projectName, displayName,
          primarySpecialty, specialtyTags, skillContext, verificationStatus,
          verificationSource, verifiedAt, verificationMessage, createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        storageWorkspace,
        input.skillName,
        input.projectName,
        input.displayName,
        input.primarySpecialty,
        JSON.stringify(input.specialtyTags),
        input.skillContext ? JSON.stringify(input.skillContext) : null,
        input.verification.verificationStatus,
        input.verification.verificationSource,
        input.verification.verifiedAt,
        input.verification.verificationMessage ?? null,
        input.now,
        input.now,
      );
    });

    try {
      insert();
      const created = await this.getEntry(workspace, {
        workspace,
        entryType: "skill",
        entryKey: input.skillName,
        scope: input.scope ?? "workspace",
      });
      return created as SkillCatalogEntry;
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  async createSubagent(
    workspace: string,
    input: IntroduceSubagentInput & {
      verification: VerificationMetadata;
      now: string;
    },
  ): Promise<SubagentCatalogEntry> {
    const db = this.requireDb();
    const scope = input.scope ?? "workspace";
    const storageWorkspace = subagentStorageWorkspace(workspace, scope);
    const promptFields = normalizeSubagentPromptFields(input);
    const insert = db.transaction(() => {
      if (this.subagentExists(storageWorkspace, input.name)) {
        throw new LorError(
          "duplicate_entry",
          scope === "global"
            ? "Subagent already exists in global scope."
            : "Subagent already exists in this workspace.",
          { entryType: "subagent" },
        );
      }

      db.exec(
        `INSERT INTO introduced_subagents (
          workspace, name, projectName, displayName, purpose, limitedScope,
          primarySpecialty, specialtyTags, agentReferences, skillReferences,
          unresolvedReferences, promptTemplate, constraints, expectedOutput,
          verificationStatus, verificationSource, verifiedAt,
          verificationMessage, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        storageWorkspace,
        input.name,
        input.projectName,
        input.displayName,
        input.purpose,
        input.limitedScope,
        input.primarySpecialty,
        JSON.stringify(input.specialtyTags),
        JSON.stringify(promptFields.agentReferences),
        JSON.stringify(promptFields.skillReferences),
        JSON.stringify(input.unresolvedReferences ?? []),
        input.promptTemplate ?? null,
        JSON.stringify(promptFields.constraints),
        promptFields.expectedOutput,
        input.verification.verificationStatus,
        input.verification.verificationSource,
        input.verification.verifiedAt,
        input.verification.verificationMessage ?? null,
        input.now,
        input.now,
      );
    });

    try {
      insert();
      const created = await this.getEntry(workspace, {
        workspace,
        entryType: "subagent",
        entryKey: input.name,
        scope,
      });
      return created as SubagentCatalogEntry;
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  createSkillUpdateProposal(
    input: SkillUpdateProposal,
  ): Promise<SkillUpdateProposal> {
    const db = this.requireDb();
    const storageWorkspace = skillStorageWorkspace(
      input.workspace,
      input.scope,
    );
    try {
      db.exec(
        `INSERT INTO skill_update_proposals (
          proposalId, workspace, skillName, reason, proposedSkillContext,
          proposedMetadata, status, createdAt, appliedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        input.proposalId,
        storageWorkspace,
        input.skillName,
        input.reason,
        input.proposedSkillContext
          ? JSON.stringify(input.proposedSkillContext)
          : null,
        input.proposedMetadata ? JSON.stringify(input.proposedMetadata) : null,
        input.status,
        input.createdAt,
        input.appliedAt ?? null,
      );
      return Promise.resolve({
        ...input,
        workspace: publicSkillWorkspace(storageWorkspace),
      });
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  getSkillUpdateProposal(
    workspace: string,
    proposalId: string,
    scope?: CatalogScope,
  ): Promise<SkillUpdateProposal | undefined> {
    const storageWorkspace = skillStorageWorkspace(workspace, scope);
    const row = this.requireDb().prepare<SkillUpdateProposalRow>(
      `SELECT * FROM skill_update_proposals
       WHERE workspace = ? AND proposalId = ?`,
    ).get(storageWorkspace, proposalId);
    return Promise.resolve(row ? mapSkillUpdateProposalRow(row) : undefined);
  }

  applySkillUpdateProposal(
    workspace: string,
    proposalId: string,
    scope: CatalogScope | undefined,
    input: {
      entry: SkillCatalogEntry;
      appliedAt: string;
    },
  ): Promise<SkillUpdateProposal | undefined> {
    const db = this.requireDb();
    const storageWorkspace = skillStorageWorkspace(workspace, scope);
    const apply = db.transaction(() => {
      const proposal = this.getSkillUpdateProposalSync(
        storageWorkspace,
        proposalId,
      );
      if (!proposal || proposal.status !== "pending") {
        return undefined;
      }

      db.exec(
        `UPDATE introduced_skills
         SET projectName = ?, displayName = ?, primarySpecialty = ?,
           specialtyTags = ?, skillContext = ?, updatedAt = ?
         WHERE workspace = ? AND skillName = ?`,
        input.entry.projectName,
        input.entry.displayName,
        input.entry.primarySpecialty,
        JSON.stringify(input.entry.specialtyTags),
        input.entry.skillContext
          ? JSON.stringify(input.entry.skillContext)
          : null,
        input.appliedAt,
        storageWorkspace,
        input.entry.skillName,
      );
      db.exec(
        `UPDATE skill_update_proposals
         SET status = ?, appliedAt = ?
         WHERE workspace = ? AND proposalId = ?`,
        "applied",
        input.appliedAt,
        storageWorkspace,
        proposalId,
      );

      return this.getSkillUpdateProposalSync(storageWorkspace, proposalId);
    });

    try {
      return Promise.resolve(apply());
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  listEntries(
    workspace: string,
    filter: ListEntriesFilter,
  ): Promise<CatalogEntry[]> {
    const entries: CatalogEntry[] = [];
    if (!filter.entryType || filter.entryType === "agent") {
      if (filter.scope !== "global") {
        entries.push(...this.listAgents(workspace, filter.projectName));
      }
    }
    if (!filter.entryType || filter.entryType === "skill") {
      entries.push(
        ...this.listSkills(workspace, filter.projectName, filter.scope),
      );
    }
    if (!filter.entryType || filter.entryType === "subagent") {
      entries.push(
        ...this.listSubagents(workspace, filter.projectName, filter.scope),
      );
    }
    return Promise.resolve(
      entries.sort((a, b) =>
        a.entryType.localeCompare(b.entryType) ||
        a.displayName.localeCompare(b.displayName)
      ),
    );
  }

  getEntry(
    workspace: string,
    lookup: EntryLookup,
  ): Promise<CatalogEntry | undefined> {
    return Promise.resolve(this.getEntrySync(workspace, lookup));
  }

  createDelegatedAgentTask(
    input: DelegatedAgentTask,
  ): Promise<DelegatedAgentTask> {
    try {
      this.requireDb().exec(
        `INSERT INTO delegated_agent_tasks (
          taskId, workspace, agentEntryKey, codexSessionId, status, task,
          context, createdAt, sentAt, updatedAt, completedAt, failureMessage,
          externalTaskId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        input.taskId,
        input.workspace,
        input.agentEntryKey,
        input.codexSessionId,
        input.status,
        input.task,
        input.context ?? null,
        input.createdAt,
        input.sentAt ?? null,
        input.updatedAt,
        input.completedAt ?? null,
        input.failureMessage ?? null,
        input.externalTaskId ?? null,
      );
      return Promise.resolve(input);
    } catch (error) {
      throw mapStorageError(error);
    }
  }

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
  ): Promise<DelegatedAgentTask | undefined> {
    try {
      const existing = this.getDelegatedAgentTaskSync(workspace, taskId);
      if (!existing) {
        return Promise.resolve(undefined);
      }

      this.requireDb().exec(
        `UPDATE delegated_agent_tasks
         SET status = ?, sentAt = ?, updatedAt = ?, completedAt = ?,
           failureMessage = ?, externalTaskId = ?
         WHERE workspace = ? AND taskId = ?`,
        input.status,
        input.sentAt ?? existing.sentAt ?? null,
        input.updatedAt,
        input.completedAt ?? existing.completedAt ?? null,
        input.failureMessage ?? existing.failureMessage ?? null,
        input.externalTaskId ?? existing.externalTaskId ?? null,
        workspace,
        taskId,
      );

      return Promise.resolve(this.getDelegatedAgentTaskSync(workspace, taskId));
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  getDelegatedAgentTask(
    workspace: string,
    taskId: string,
  ): Promise<DelegatedAgentTask | undefined> {
    return Promise.resolve(this.getDelegatedAgentTaskSync(workspace, taskId));
  }

  listActiveDelegatedAgentTasks(
    workspace: string,
    filter: { agentEntryKey?: string } = {},
  ): Promise<DelegatedAgentTask[]> {
    const activeStatuses = ["queued", "sent", "running", "needs_input"];
    const statusPlaceholders = placeholders(activeStatuses);
    const rows = filter.agentEntryKey
      ? this.requireDb().prepare<DelegatedAgentTaskRow>(
        `SELECT * FROM delegated_agent_tasks
         WHERE workspace = ? AND agentEntryKey = ?
           AND status IN (${statusPlaceholders})
         ORDER BY updatedAt DESC, createdAt DESC`,
      ).all(workspace, filter.agentEntryKey, ...activeStatuses)
      : this.requireDb().prepare<DelegatedAgentTaskRow>(
        `SELECT * FROM delegated_agent_tasks
         WHERE workspace = ? AND status IN (${statusPlaceholders})
         ORDER BY updatedAt DESC, createdAt DESC`,
      ).all(workspace, ...activeStatuses);
    return Promise.resolve(rows.map(mapDelegatedAgentTaskRow));
  }

  createDelegatedTaskMessage(
    input: DelegatedTaskMessage,
  ): Promise<DelegatedTaskMessage> {
    try {
      this.requireDb().exec(
        `INSERT INTO delegated_agent_task_messages (
          messageId, taskId, workspace, direction, message, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        input.messageId,
        input.taskId,
        input.workspace,
        input.direction,
        input.message,
        input.createdAt,
      );
      return Promise.resolve(input);
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  recordDelegatedAgentTaskResult(
    workspace: string,
    input: {
      taskId: string;
      summary: string;
      result: string;
      completedAt: string;
    },
  ): Promise<AgentTaskResult | undefined> {
    try {
      const existing = this.getDelegatedAgentTaskSync(workspace, input.taskId);
      if (!existing) {
        return Promise.resolve(undefined);
      }

      const write = this.requireDb().transaction(() => {
        this.requireDb().exec(
          `INSERT OR REPLACE INTO delegated_agent_task_results (
            taskId, workspace, summary, result, completedAt
          ) VALUES (?, ?, ?, ?, ?)`,
          input.taskId,
          workspace,
          input.summary,
          input.result,
          input.completedAt,
        );
        this.requireDb().exec(
          `UPDATE delegated_agent_tasks
           SET status = ?, completedAt = ?, updatedAt = ?
           WHERE workspace = ? AND taskId = ?`,
          "completed",
          input.completedAt,
          input.completedAt,
          workspace,
          input.taskId,
        );
      });
      write();
      return Promise.resolve(
        this.getDelegatedAgentTaskResultSync(workspace, input.taskId),
      );
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  getDelegatedAgentTaskResult(
    workspace: string,
    taskId: string,
  ): Promise<AgentTaskResult | undefined> {
    return Promise.resolve(
      this.getDelegatedAgentTaskResultSync(workspace, taskId),
    );
  }

  updateEntry(
    workspace: string,
    input: CatalogEntryUpdate & { now: string },
  ): Promise<CatalogEntry | undefined> {
    const db = this.requireDb();
    const update = db.transaction(() => {
      const existing = this.getEntrySync(workspace, input);
      if (!existing) {
        return undefined;
      }

      if (input.entryType === "agent") {
        db.exec(
          `UPDATE introduced_agents
           SET projectName = ?, displayName = ?, primarySpecialty = ?,
             specialtyTags = ?, updatedAt = ?
           WHERE workspace = ? AND codexSessionId = ?`,
          input.projectName ?? existing.projectName,
          input.displayName ?? existing.displayName,
          input.primarySpecialty ?? existing.primarySpecialty,
          JSON.stringify(input.specialtyTags ?? existing.specialtyTags),
          input.now,
          workspace,
          input.entryKey,
        );
      } else if (input.entryType === "skill") {
        const storageWorkspace = skillStorageWorkspace(workspace, input.scope);
        db.exec(
          `UPDATE introduced_skills
           SET projectName = ?, displayName = ?, primarySpecialty = ?,
             specialtyTags = ?, updatedAt = ?
           WHERE workspace = ? AND skillName = ?`,
          input.projectName ?? existing.projectName,
          input.displayName ?? existing.displayName,
          input.primarySpecialty ?? existing.primarySpecialty,
          JSON.stringify(input.specialtyTags ?? existing.specialtyTags),
          input.now,
          storageWorkspace,
          input.entryKey,
        );
      } else {
        const storageWorkspace = subagentStorageWorkspace(
          workspace,
          input.scope,
        );
        db.exec(
          `UPDATE introduced_subagents
           SET projectName = ?, displayName = ?, primarySpecialty = ?,
             specialtyTags = ?, updatedAt = ?
           WHERE workspace = ? AND name = ?`,
          input.projectName ?? existing.projectName,
          input.displayName ?? existing.displayName,
          input.primarySpecialty ?? existing.primarySpecialty,
          JSON.stringify(input.specialtyTags ?? existing.specialtyTags),
          input.now,
          storageWorkspace,
          input.entryKey,
        );
      }

      return this.getEntrySync(workspace, input);
    });

    try {
      return Promise.resolve(update());
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  retireAgent(
    workspace: string,
    input: RetireAgentInput & { now: string },
  ): Promise<AgentCatalogEntry | undefined> {
    const db = this.requireDb();
    const retire = db.transaction(() => {
      const existing = this.getEntrySync(workspace, {
        workspace,
        entryType: "agent",
        entryKey: input.agentEntryKey,
      });
      if (!existing || existing.entryType !== "agent") {
        return undefined;
      }

      db.exec(
        `UPDATE introduced_agents
         SET agentStatus = ?, retiredAt = ?, retirementReason = ?,
           replacedByAgentEntryKey = ?, updatedAt = ?
         WHERE workspace = ? AND codexSessionId = ?`,
        "retired",
        existing.retiredAt ?? input.now,
        input.reason ?? existing.retirementReason ?? null,
        input.replacedByAgentEntryKey ?? existing.replacedByAgentEntryKey ??
          null,
        input.now,
        workspace,
        input.agentEntryKey,
      );

      return this.getEntrySync(workspace, {
        workspace,
        entryType: "agent",
        entryKey: input.agentEntryKey,
      }) as AgentCatalogEntry | undefined;
    });

    try {
      return Promise.resolve(retire());
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  updateAgentReachability(
    workspace: string,
    agentEntryKey: string,
    input: {
      reachability: AgentReachability;
      updatedAt: string;
    },
  ): Promise<AgentCatalogEntry | undefined> {
    const db = this.requireDb();
    const update = db.transaction(() => {
      const existing = this.getEntrySync(workspace, {
        workspace,
        entryType: "agent",
        entryKey: agentEntryKey,
      });
      if (!existing || existing.entryType !== "agent") {
        return undefined;
      }

      db.exec(
        `UPDATE introduced_agents
         SET reachabilityStatus = ?, dispatchMode = ?,
           lastReachabilityCheckAt = ?, lastReachabilityError = ?,
           lastDispatchAt = ?, updatedAt = ?
         WHERE workspace = ? AND codexSessionId = ?`,
        input.reachability.reachabilityStatus,
        input.reachability.dispatchMode,
        input.reachability.lastReachabilityCheckAt ?? null,
        input.reachability.lastReachabilityError ?? null,
        input.reachability.lastDispatchAt ??
          existing.reachability.lastDispatchAt ??
          null,
        input.updatedAt,
        workspace,
        agentEntryKey,
      );

      return this.getEntrySync(workspace, {
        workspace,
        entryType: "agent",
        entryKey: agentEntryKey,
      }) as AgentCatalogEntry | undefined;
    });

    try {
      return Promise.resolve(update());
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  removeEntry(
    workspace: string,
    lookup: EntryLookup,
  ): Promise<boolean> {
    const db = this.requireDb();
    const remove = db.transaction(() => {
      const existing = this.getEntrySync(workspace, lookup);
      if (!existing) {
        return false;
      }

      if (lookup.entryType === "agent") {
        db.exec(
          `DELETE FROM introduced_agents
           WHERE workspace = ? AND codexSessionId = ?`,
          workspace,
          lookup.entryKey,
        );
      } else if (lookup.entryType === "skill") {
        const storageWorkspace = skillStorageWorkspace(
          workspace,
          lookup.scope,
        );
        db.exec(
          `DELETE FROM introduced_skills
           WHERE workspace = ? AND skillName = ?`,
          storageWorkspace,
          lookup.entryKey,
        );
      } else {
        const storageWorkspace = subagentStorageWorkspace(
          workspace,
          lookup.scope,
        );
        db.exec(
          `DELETE FROM introduced_subagents
           WHERE workspace = ? AND name = ?`,
          storageWorkspace,
          lookup.entryKey,
        );
      }

      return true;
    });

    try {
      return Promise.resolve(remove());
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  private getEntrySync(
    workspace: string,
    lookup: EntryLookup,
  ): CatalogEntry | undefined {
    if (lookup.entryType === "agent") {
      const row = this.requireDb().prepare<AgentRow>(
        `SELECT * FROM introduced_agents
         WHERE workspace = ? AND codexSessionId = ?`,
      ).get(workspace, lookup.entryKey);
      return row ? mapAgentRow(row) : undefined;
    }

    if (lookup.entryType === "skill") {
      const row = this.requireDb().prepare<SkillRow>(
        `SELECT * FROM introduced_skills
         WHERE workspace = ? AND skillName = ?`,
      ).get(skillStorageWorkspace(workspace, lookup.scope), lookup.entryKey);
      return row ? mapSkillRow(row) : undefined;
    }

    const row = this.requireDb().prepare<SubagentRow>(
      `SELECT * FROM introduced_subagents
       WHERE workspace = ? AND name = ?`,
    ).get(subagentStorageWorkspace(workspace, lookup.scope), lookup.entryKey);
    return row ? mapSubagentRow(row) : undefined;
  }

  private getDelegatedAgentTaskSync(
    workspace: string,
    taskId: string,
  ): DelegatedAgentTask | undefined {
    const row = this.requireDb().prepare<DelegatedAgentTaskRow>(
      `SELECT * FROM delegated_agent_tasks
       WHERE workspace = ? AND taskId = ?`,
    ).get(workspace, taskId);
    return row ? mapDelegatedAgentTaskRow(row) : undefined;
  }

  private getDelegatedAgentTaskResultSync(
    workspace: string,
    taskId: string,
  ): AgentTaskResult | undefined {
    const task = this.getDelegatedAgentTaskSync(workspace, taskId);
    if (!task) {
      return undefined;
    }
    const row = this.requireDb().prepare<DelegatedTaskResultRow>(
      `SELECT * FROM delegated_agent_task_results
       WHERE workspace = ? AND taskId = ?`,
    ).get(workspace, taskId);
    if (!row) {
      return {
        workspace,
        taskId,
        status: task.status,
        resultAvailable: false,
      };
    }
    return {
      workspace,
      taskId,
      status: "completed",
      resultAvailable: true,
      summary: row.summary,
      result: row.result,
      completedAt: row.completedAt,
    };
  }

  private getSkillUpdateProposalSync(
    workspace: string,
    proposalId: string,
  ): SkillUpdateProposal | undefined {
    const row = this.requireDb().prepare<SkillUpdateProposalRow>(
      `SELECT * FROM skill_update_proposals
       WHERE workspace = ? AND proposalId = ?`,
    ).get(workspace, proposalId);
    return row ? mapSkillUpdateProposalRow(row) : undefined;
  }

  clearEntries(
    workspace: string,
    input: ClearWorkspaceCatalogInput,
  ): Promise<ClearWorkspaceCatalogResult> {
    const db = this.requireDb();
    const clear = db.transaction(() => {
      const deletedAgents = input.entryType === "skill"
        ? 0
        : this.countAgents(workspace);
      const deletedSkills = input.entryType === "agent"
        ? 0
        : this.countSkills(workspace);

      if (input.entryType !== "skill") {
        db.exec("DELETE FROM introduced_agents WHERE workspace = ?", workspace);
      }
      if (input.entryType !== "agent") {
        db.exec("DELETE FROM introduced_skills WHERE workspace = ?", workspace);
      }

      return {
        workspace,
        entryType: input.entryType,
        deletedAgents,
        deletedSkills,
        deletedTotal: deletedAgents + deletedSkills,
      };
    });

    try {
      return Promise.resolve(clear());
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  registerWorkspaceAlias(
    input: RegisterWorkspaceAliasInput & { now: string },
  ): Promise<RegisterWorkspaceAliasResult> {
    try {
      const alias = normalizeWorkspace(input.alias);
      const canonicalWorkspace = this.resolveAliasTargetWorkspace(
        normalizeWorkspace(input.workspace),
      );
      const existing = this.getWorkspaceAlias(alias);

      if (!existing) {
        this.insertWorkspaceAlias(alias, canonicalWorkspace, input.now);
        return Promise.resolve({
          workspace: canonicalWorkspace,
          alias,
          created: true,
          reassigned: false,
        });
      }

      if (existing.canonicalWorkspace === canonicalWorkspace) {
        return Promise.resolve({
          workspace: canonicalWorkspace,
          alias,
          created: false,
          reassigned: false,
        });
      }

      if (input.confirm !== true) {
        throw new LorError(
          "validation_error",
          "alias already exists for another workspace.",
          { field: "confirm" },
        );
      }

      this.requireDb().exec(
        `UPDATE workspace_aliases
       SET canonicalWorkspace = ?, updatedAt = ?
       WHERE alias = ?`,
        canonicalWorkspace,
        input.now,
        alias,
      );

      return Promise.resolve({
        workspace: canonicalWorkspace,
        alias,
        created: false,
        reassigned: true,
      });
    } catch (error) {
      return Promise.reject(mapStorageError(error));
    }
  }

  resolveWorkspace(
    workspace: string,
    options: { now: string },
  ): Promise<string> {
    return Promise.resolve(this.resolveWorkspaceSync(workspace, options.now));
  }

  listWorkspaceAliases(canonicalWorkspace: string): Promise<string[]> {
    try {
      const rows = this.requireDb().prepare<{ alias: string }>(
        `SELECT alias FROM workspace_aliases
         WHERE canonicalWorkspace = ?
         ORDER BY alias`,
      ).all(canonicalWorkspace);
      return Promise.resolve(rows.map((row) => row.alias));
    } catch (error) {
      return Promise.reject(mapStorageError(error));
    }
  }

  getSchemaVersion(): Promise<number | undefined> {
    try {
      const row = this.requireDb().prepare<{ version: number }>(
        `SELECT MAX(version) AS version FROM schema_migrations`,
      ).get();
      return Promise.resolve(row?.version);
    } catch (error) {
      return Promise.reject(mapStorageError(error));
    }
  }

  createWorkspaceNote(input: WorkspaceNote): Promise<WorkspaceNote> {
    try {
      this.requireDb().exec(
        `INSERT INTO workspace_notes (
          noteId, workspace, title, body, tagsJson, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        input.noteId,
        input.workspace,
        input.title,
        input.body,
        JSON.stringify(input.tags),
        input.createdAt,
        input.updatedAt,
      );
      return Promise.resolve(input);
    } catch (error) {
      return Promise.reject(mapStorageError(error));
    }
  }

  listWorkspaceNotes(
    workspace: string,
    filter: { tags?: readonly string[] } = {},
  ): Promise<WorkspaceNote[]> {
    try {
      const rows = this.requireDb().prepare<WorkspaceNoteRow>(
        `SELECT * FROM workspace_notes
         WHERE workspace = ?
         ORDER BY updatedAt DESC, createdAt DESC, title ASC`,
      ).all(workspace);
      const notes = rows.map(mapWorkspaceNoteRow);
      if (!filter.tags?.length) {
        return Promise.resolve(notes);
      }
      const requestedTags = new Set(filter.tags);
      return Promise.resolve(
        notes.filter((note) =>
          [...requestedTags].every((tag) => note.tags.includes(tag))
        ),
      );
    } catch (error) {
      return Promise.reject(mapStorageError(error));
    }
  }

  getWorkspaceNote(
    workspace: string,
    noteId: string,
  ): Promise<WorkspaceNote | undefined> {
    try {
      const row = this.requireDb().prepare<WorkspaceNoteRow>(
        `SELECT * FROM workspace_notes
         WHERE workspace = ? AND noteId = ?`,
      ).get(workspace, noteId);
      return Promise.resolve(row ? mapWorkspaceNoteRow(row) : undefined);
    } catch (error) {
      return Promise.reject(mapStorageError(error));
    }
  }

  removeWorkspaceNote(workspace: string, noteId: string): Promise<boolean> {
    try {
      const db = this.requireDb();
      const existed = Boolean(
        db.prepare<{ count: number }>(
          `SELECT COUNT(*) AS count FROM workspace_notes
           WHERE workspace = ? AND noteId = ?`,
        ).get(workspace, noteId)?.count,
      );
      if (!existed) {
        return Promise.resolve(false);
      }
      db.exec(
        `DELETE FROM workspace_notes
         WHERE workspace = ? AND noteId = ?`,
        workspace,
        noteId,
      );
      return Promise.resolve(true);
    } catch (error) {
      return Promise.reject(mapStorageError(error));
    }
  }

  close(): void {
    this.#db?.close();
    this.#db = undefined;
  }

  private listAgents(
    workspace: string,
    projectName?: string,
  ): AgentCatalogEntry[] {
    const db = this.requireDb();
    const sql = projectName
      ? `SELECT * FROM introduced_agents
         WHERE workspace = ? AND projectName = ?`
      : `SELECT * FROM introduced_agents WHERE workspace = ?`;
    const rows = projectName
      ? db.prepare<AgentRow>(sql).all(workspace, projectName)
      : db.prepare<AgentRow>(sql).all(workspace);
    return rows.map(mapAgentRow);
  }

  private listSkills(
    workspace: string,
    projectName?: string,
    scope?: CatalogScope,
  ): SkillCatalogEntry[] {
    const db = this.requireDb();
    const workspaces = skillListStorageWorkspaces(workspace, scope);
    const sql = projectName
      ? `SELECT * FROM introduced_skills
         WHERE workspace IN (${placeholders(workspaces)}) AND projectName = ?`
      : `SELECT * FROM introduced_skills
         WHERE workspace IN (${placeholders(workspaces)})`;
    const rows = projectName
      ? db.prepare<SkillRow>(sql).all(...workspaces, projectName)
      : db.prepare<SkillRow>(sql).all(...workspaces);
    return rows.map(mapSkillRow);
  }

  private listSubagents(
    workspace: string,
    projectName?: string,
    scope?: CatalogScope,
  ): SubagentCatalogEntry[] {
    const db = this.requireDb();
    const workspaces = subagentListStorageWorkspaces(workspace, scope);
    const sql = projectName
      ? `SELECT * FROM introduced_subagents
         WHERE workspace IN (${placeholders(workspaces)}) AND projectName = ?`
      : `SELECT * FROM introduced_subagents
         WHERE workspace IN (${placeholders(workspaces)})`;
    const rows = projectName
      ? db.prepare<SubagentRow>(sql).all(...workspaces, projectName)
      : db.prepare<SubagentRow>(sql).all(...workspaces);
    return rows.map(mapSubagentRow);
  }

  private agentExists(workspace: string, codexSessionId: string): boolean {
    return Boolean(
      this.requireDb().prepare<{ count: number }>(
        `SELECT COUNT(*) AS count FROM introduced_agents
         WHERE workspace = ? AND codexSessionId = ?`,
      ).get(workspace, codexSessionId)?.count,
    );
  }

  private countAgents(workspace: string): number {
    return this.requireDb().prepare<{ count: number }>(
      `SELECT COUNT(*) AS count FROM introduced_agents
       WHERE workspace = ?`,
    ).get(workspace)?.count ?? 0;
  }

  private skillExists(workspace: string, skillName: string): boolean {
    return Boolean(
      this.requireDb().prepare<{ count: number }>(
        `SELECT COUNT(*) AS count FROM introduced_skills
         WHERE workspace = ? AND skillName = ?`,
      ).get(workspace, skillName)?.count,
    );
  }

  private subagentExists(workspace: string, name: string): boolean {
    return Boolean(
      this.requireDb().prepare<{ count: number }>(
        `SELECT COUNT(*) AS count FROM introduced_subagents
         WHERE workspace = ? AND name = ?`,
      ).get(workspace, name)?.count,
    );
  }

  private countSkills(workspace: string): number {
    return this.requireDb().prepare<{ count: number }>(
      `SELECT COUNT(*) AS count FROM introduced_skills
       WHERE workspace = ?`,
    ).get(workspace)?.count ?? 0;
  }

  private resolveWorkspaceSync(workspace: string, now: string): string {
    const normalized = normalizeWorkspace(workspace);
    const existingAlias = this.getWorkspaceAlias(normalized);
    if (existingAlias) {
      return existingAlias.canonicalWorkspace;
    }

    this.ensureWorkspaceAlias(normalized, normalized, now);

    if (!isAbsoluteWorkspacePath(normalized)) {
      return normalized;
    }

    const basename = workspaceBasename(normalized);
    if (basename && !this.getWorkspaceAlias(basename)) {
      this.ensureWorkspaceAlias(basename, normalized, now);
    }
    return normalized;
  }

  private resolveAliasTargetWorkspace(workspace: string): string {
    return this.getWorkspaceAlias(workspace)?.canonicalWorkspace ?? workspace;
  }

  private getWorkspaceAlias(alias: string): WorkspaceAliasRow | undefined {
    return this.requireDb().prepare<WorkspaceAliasRow>(
      `SELECT * FROM workspace_aliases WHERE alias = ?`,
    ).get(alias);
  }

  private ensureWorkspaceAlias(
    alias: string,
    canonicalWorkspace: string,
    now: string,
  ): boolean {
    if (this.getWorkspaceAlias(alias)) {
      return false;
    }
    this.insertWorkspaceAlias(alias, canonicalWorkspace, now);
    return true;
  }

  private insertWorkspaceAlias(
    alias: string,
    canonicalWorkspace: string,
    now: string,
  ): void {
    this.requireDb().exec(
      `INSERT INTO workspace_aliases (
        alias, canonicalWorkspace, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?)`,
      alias,
      canonicalWorkspace,
      now,
      now,
    );
  }

  private requireDb(): Database {
    if (!this.#db) {
      throw new LorError(
        "storage_error",
        "Catalog storage has not been initialized.",
      );
    }
    return this.#db;
  }
}

function mapAgentRow(row: AgentRow): AgentCatalogEntry {
  return {
    workspace: row.workspace,
    scope: "workspace",
    entryType: "agent",
    entryKey: row.codexSessionId,
    codexSessionId: row.codexSessionId,
    agentStatus: parseAgentStatus(row.agentStatus),
    reachability: mapAgentReachability(row),
    retiredAt: row.retiredAt ?? undefined,
    retirementReason: row.retirementReason ?? undefined,
    replacedByAgentEntryKey: row.replacedByAgentEntryKey ?? undefined,
    replacesAgentEntryKey: row.replacesAgentEntryKey ?? undefined,
    projectName: row.projectName,
    displayName: row.displayName,
    primarySpecialty: row.primarySpecialty,
    specialtyTags: parseTags(row.specialtyTags),
    handoff: row.handoff ? JSON.parse(row.handoff) : undefined,
    verificationStatus: parseVerificationStatus(row.verificationStatus),
    verificationSource: row.verificationSource,
    verifiedAt: row.verifiedAt,
    verificationMessage: row.verificationMessage ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapSkillRow(row: SkillRow): SkillCatalogEntry {
  return {
    workspace: publicSkillWorkspace(row.workspace),
    scope: skillScopeFromStorage(row.workspace),
    entryType: "skill",
    entryKey: row.skillName,
    skillName: row.skillName,
    projectName: row.projectName,
    displayName: row.displayName,
    primarySpecialty: row.primarySpecialty,
    specialtyTags: parseTags(row.specialtyTags),
    skillContext: row.skillContext ? JSON.parse(row.skillContext) : undefined,
    verificationStatus: parseVerificationStatus(row.verificationStatus),
    verificationSource: row.verificationSource,
    verifiedAt: row.verifiedAt,
    verificationMessage: row.verificationMessage ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapSubagentRow(row: SubagentRow): SubagentCatalogEntry {
  const entry = {
    workspace: publicSubagentWorkspace(row.workspace),
    scope: subagentScopeFromStorage(row.workspace),
    entryType: "subagent" as const,
    entryKey: row.name,
    name: row.name,
    projectName: row.projectName,
    displayName: row.displayName,
    purpose: row.purpose,
    limitedScope: row.limitedScope,
    primarySpecialty: row.primarySpecialty,
    specialtyTags: parseTags(row.specialtyTags),
    agentReferences: parseJsonArray(row.agentReferences),
    skillReferences: parseJsonArray(row.skillReferences),
    unresolvedReferences: parseJsonArray(row.unresolvedReferences),
    promptTemplate: row.promptTemplate ?? undefined,
    constraints: parseJsonArray(row.constraints),
    expectedOutput: row.expectedOutput,
    verificationStatus: parseVerificationStatus(row.verificationStatus),
    verificationSource: row.verificationSource,
    verifiedAt: row.verifiedAt,
    verificationMessage: row.verificationMessage ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  return {
    ...entry,
    prompt: renderSubagentPrompt(entry),
  };
}

function mapSkillUpdateProposalRow(
  row: SkillUpdateProposalRow,
): SkillUpdateProposal {
  return {
    proposalId: row.proposalId,
    workspace: publicSkillWorkspace(row.workspace),
    scope: skillScopeFromStorage(row.workspace),
    skillName: row.skillName,
    reason: row.reason,
    proposedSkillContext: row.proposedSkillContext
      ? JSON.parse(row.proposedSkillContext)
      : undefined,
    proposedMetadata: row.proposedMetadata
      ? JSON.parse(row.proposedMetadata)
      : undefined,
    status: row.status === "applied" ? "applied" : "pending",
    createdAt: row.createdAt,
    appliedAt: row.appliedAt ?? undefined,
  };
}

function mapDelegatedAgentTaskRow(
  row: DelegatedAgentTaskRow,
): DelegatedAgentTask {
  return {
    taskId: row.taskId,
    workspace: row.workspace,
    agentEntryKey: row.agentEntryKey,
    codexSessionId: row.codexSessionId,
    status: parseDelegatedAgentTaskStatus(row.status),
    task: row.task,
    context: row.context ?? undefined,
    createdAt: row.createdAt,
    sentAt: row.sentAt ?? undefined,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt ?? undefined,
    failureMessage: row.failureMessage ?? undefined,
    externalTaskId: row.externalTaskId ?? undefined,
  };
}

function parseDelegatedAgentTaskStatus(
  value: string,
): DelegatedAgentTaskStatus {
  if (
    value === "queued" || value === "sent" || value === "running" ||
    value === "needs_input" || value === "completed" || value === "failed" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "queued";
}

function mapWorkspaceNoteRow(row: WorkspaceNoteRow): WorkspaceNote {
  return {
    noteId: row.noteId,
    workspace: row.workspace,
    title: row.title,
    body: row.body,
    tags: JSON.parse(row.tagsJson),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function skillStorageWorkspace(
  workspace: string,
  scope: CatalogScope | undefined,
): string {
  return scope === "global" ? GLOBAL_SKILL_WORKSPACE : workspace;
}

function subagentStorageWorkspace(
  workspace: string,
  scope: CatalogScope | undefined,
): string {
  return scope === "global" ? GLOBAL_SUBAGENT_WORKSPACE : workspace;
}

function skillListStorageWorkspaces(
  workspace: string,
  scope: CatalogScope | undefined,
): string[] {
  if (scope === "global") {
    return [GLOBAL_SKILL_WORKSPACE];
  }
  if (scope === "workspace") {
    return [workspace];
  }
  return [workspace, GLOBAL_SKILL_WORKSPACE];
}

function subagentListStorageWorkspaces(
  workspace: string,
  scope: CatalogScope | undefined,
): string[] {
  if (scope === "global") {
    return [GLOBAL_SUBAGENT_WORKSPACE];
  }
  if (scope === "workspace") {
    return [workspace];
  }
  return [workspace, GLOBAL_SUBAGENT_WORKSPACE];
}

function skillScopeFromStorage(workspace: string): CatalogScope {
  return workspace === GLOBAL_SKILL_WORKSPACE ? "global" : "workspace";
}

function subagentScopeFromStorage(workspace: string): CatalogScope {
  return workspace === GLOBAL_SUBAGENT_WORKSPACE ? "global" : "workspace";
}

function publicSkillWorkspace(workspace: string): string {
  return workspace === GLOBAL_SKILL_WORKSPACE
    ? PUBLIC_GLOBAL_WORKSPACE
    : workspace;
}

function publicSubagentWorkspace(workspace: string): string {
  return workspace === GLOBAL_SUBAGENT_WORKSPACE
    ? PUBLIC_GLOBAL_WORKSPACE
    : workspace;
}

function placeholders(values: readonly unknown[]): string {
  return values.map(() => "?").join(", ");
}

function parseTags(value: string): string[] {
  const parsed = JSON.parse(value);
  return Array.isArray(parsed)
    ? parsed.filter((tag) => typeof tag === "string")
    : [];
}

function parseJsonArray<T = never>(value: string): T[] {
  const parsed = JSON.parse(value);
  return Array.isArray(parsed) ? parsed as T[] : [];
}

function parseVerificationStatus(
  value: string,
): VerificationMetadata["verificationStatus"] {
  if (value === "verified" || value === "unverified" || value === "unknown") {
    return value;
  }
  return "unknown";
}

function parseAgentStatus(value: string): AgentStatus {
  if (value === "active" || value === "retired") {
    return value;
  }
  return "active";
}

function mapAgentReachability(row: AgentRow): AgentReachability {
  return {
    reachabilityStatus: parseReachabilityStatus(row.reachabilityStatus),
    dispatchMode: parseDispatchMode(row.dispatchMode),
    ...(row.lastReachabilityCheckAt
      ? { lastReachabilityCheckAt: row.lastReachabilityCheckAt }
      : {}),
    ...(row.lastReachabilityError
      ? { lastReachabilityError: row.lastReachabilityError }
      : {}),
    ...(row.lastDispatchAt ? { lastDispatchAt: row.lastDispatchAt } : {}),
  };
}

function parseReachabilityStatus(
  value: string,
): AgentReachability["reachabilityStatus"] {
  if (
    value === "unknown" || value === "reachable" ||
    value === "unreachable" || value === "unsupported"
  ) {
    return value;
  }
  return "unknown";
}

function parseDispatchMode(value: string): AgentReachability["dispatchMode"] {
  if (
    value === "manual" || value === "codex_thread" || value === "unsupported"
  ) {
    return value;
  }
  return "manual";
}

interface TableColumn {
  name: string;
}

function migrateLegacyNamespaceColumns(db: Database): void {
  renameLegacyNamespaceColumn(db, "introduced_agents");
  renameLegacyNamespaceColumn(db, "introduced_skills");
  renameLegacyNamespaceColumn(db, "introduced_subagents");
}

function migrateSkillContextColumn(db: Database): void {
  const columns = db.prepare<TableColumn>(
    "PRAGMA table_info(introduced_skills)",
  )
    .all();
  const columnNames = new Set(columns.map((column) => column.name));
  if (!columnNames.has("skillContext")) {
    db.exec("ALTER TABLE introduced_skills ADD COLUMN skillContext TEXT");
  }
}

function migrateAgentLifecycleColumns(db: Database): void {
  const columns = db.prepare<TableColumn>(
    "PRAGMA table_info(introduced_agents)",
  )
    .all();
  const columnNames = new Set(columns.map((column) => column.name));
  const additions = [
    ["agentStatus", "TEXT NOT NULL DEFAULT 'active'"],
    ["retiredAt", "TEXT"],
    ["retirementReason", "TEXT"],
    ["replacedByAgentEntryKey", "TEXT"],
    ["replacesAgentEntryKey", "TEXT"],
  ];
  for (const [columnName, definition] of additions) {
    if (!columnNames.has(columnName)) {
      db.exec(
        `ALTER TABLE introduced_agents ADD COLUMN ${columnName} ${definition}`,
      );
    }
  }
}

function migrateAgentReachabilityColumns(db: Database): void {
  const columns = db.prepare<TableColumn>(
    "PRAGMA table_info(introduced_agents)",
  )
    .all();
  const columnNames = new Set(columns.map((column) => column.name));
  const additions = [
    ["reachabilityStatus", "TEXT NOT NULL DEFAULT 'unknown'"],
    ["dispatchMode", "TEXT NOT NULL DEFAULT 'manual'"],
    ["lastReachabilityCheckAt", "TEXT"],
    ["lastReachabilityError", "TEXT"],
    ["lastDispatchAt", "TEXT"],
  ];
  for (const [columnName, definition] of additions) {
    if (!columnNames.has(columnName)) {
      db.exec(
        `ALTER TABLE introduced_agents ADD COLUMN ${columnName} ${definition}`,
      );
    }
  }
}

function renameLegacyNamespaceColumn(db: Database, tableName: string): void {
  const columns = db.prepare<TableColumn>(`PRAGMA table_info(${tableName})`)
    .all();
  const columnNames = new Set(columns.map((column) => column.name));
  if (columnNames.has("workspace") || !columnNames.has("catalogNamespace")) {
    return;
  }
  db.exec(
    `ALTER TABLE ${tableName} RENAME COLUMN catalogNamespace TO workspace`,
  );
}

function recordSchemaVersion(db: Database, version: number): void {
  db.exec(
    "INSERT OR IGNORE INTO schema_migrations(version, appliedAt) VALUES (?, ?)",
    version,
    new Date().toISOString(),
  );
}

function backfillWorkspaceAliases(db: Database): void {
  const now = new Date().toISOString();
  const workspaces = db.prepare<{ workspace: string }>(`
    SELECT workspace FROM introduced_agents
    UNION
    SELECT workspace FROM introduced_skills
    UNION
    SELECT workspace FROM introduced_subagents
  `).all().map((row) => row.workspace);
  const absoluteByBasename = new Map<string, string[]>();

  for (const workspace of workspaces) {
    const alias = normalizeWorkspace(workspace);
    insertWorkspaceAliasIfMissing(db, alias, workspace, now);

    if (isAbsoluteWorkspacePath(alias)) {
      const basename = workspaceBasename(alias);
      if (basename) {
        const values = absoluteByBasename.get(basename) ?? [];
        values.push(workspace);
        absoluteByBasename.set(basename, values);
      }
    }
  }

  for (const [alias, candidates] of absoluteByBasename.entries()) {
    const uniqueCandidates = [...new Set(candidates)];
    if (uniqueCandidates.length === 1) {
      insertWorkspaceAliasIfMissing(db, alias, uniqueCandidates[0], now);
    }
  }
}

function insertWorkspaceAliasIfMissing(
  db: Database,
  alias: string,
  canonicalWorkspace: string,
  now: string,
): void {
  db.exec(
    `INSERT OR IGNORE INTO workspace_aliases (
      alias, canonicalWorkspace, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?)`,
    alias,
    canonicalWorkspace,
    now,
    now,
  );
}

function mapStorageError(error: unknown): LorError {
  if (error instanceof LorError) {
    return error;
  }
  return new LorError("storage_error", "Catalog storage failed.");
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  appliedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_aliases (
  alias TEXT PRIMARY KEY,
  canonicalWorkspace TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS introduced_agents (
  workspace TEXT NOT NULL,
  codexSessionId TEXT NOT NULL,
  agentStatus TEXT NOT NULL DEFAULT 'active',
  retiredAt TEXT,
  retirementReason TEXT,
  replacedByAgentEntryKey TEXT,
  replacesAgentEntryKey TEXT,
  reachabilityStatus TEXT NOT NULL DEFAULT 'unknown',
  dispatchMode TEXT NOT NULL DEFAULT 'manual',
  lastReachabilityCheckAt TEXT,
  lastReachabilityError TEXT,
  lastDispatchAt TEXT,
  projectName TEXT NOT NULL,
  displayName TEXT NOT NULL,
  primarySpecialty TEXT NOT NULL,
  specialtyTags TEXT NOT NULL,
  handoff TEXT,
  verificationStatus TEXT NOT NULL,
  verificationSource TEXT NOT NULL,
  verifiedAt TEXT NOT NULL,
  verificationMessage TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (workspace, codexSessionId)
);

CREATE TABLE IF NOT EXISTS introduced_skills (
  workspace TEXT NOT NULL,
  skillName TEXT NOT NULL,
  projectName TEXT NOT NULL,
  displayName TEXT NOT NULL,
  primarySpecialty TEXT NOT NULL,
  specialtyTags TEXT NOT NULL,
  skillContext TEXT,
  verificationStatus TEXT NOT NULL,
  verificationSource TEXT NOT NULL,
  verifiedAt TEXT NOT NULL,
  verificationMessage TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (workspace, skillName)
);

CREATE TABLE IF NOT EXISTS introduced_subagents (
  workspace TEXT NOT NULL,
  name TEXT NOT NULL,
  projectName TEXT NOT NULL,
  displayName TEXT NOT NULL,
  purpose TEXT NOT NULL,
  limitedScope TEXT NOT NULL,
  primarySpecialty TEXT NOT NULL,
  specialtyTags TEXT NOT NULL,
  agentReferences TEXT NOT NULL,
  skillReferences TEXT NOT NULL,
  unresolvedReferences TEXT NOT NULL,
  promptTemplate TEXT,
  constraints TEXT NOT NULL,
  expectedOutput TEXT NOT NULL,
  verificationStatus TEXT NOT NULL,
  verificationSource TEXT NOT NULL,
  verifiedAt TEXT NOT NULL,
  verificationMessage TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (workspace, name)
);

CREATE TABLE IF NOT EXISTS skill_update_proposals (
  proposalId TEXT PRIMARY KEY,
  workspace TEXT NOT NULL,
  skillName TEXT NOT NULL,
  reason TEXT NOT NULL,
  proposedSkillContext TEXT,
  proposedMetadata TEXT,
  status TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  appliedAt TEXT,
  FOREIGN KEY (workspace, skillName)
    REFERENCES introduced_skills(workspace, skillName)
    ON DELETE CASCADE
);
`;

const DELEGATED_TASKS_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS delegated_agent_tasks (
  taskId TEXT PRIMARY KEY,
  workspace TEXT NOT NULL,
  agentEntryKey TEXT NOT NULL,
  codexSessionId TEXT NOT NULL,
  status TEXT NOT NULL,
  task TEXT NOT NULL,
  context TEXT,
  createdAt TEXT NOT NULL,
  sentAt TEXT,
  updatedAt TEXT NOT NULL,
  completedAt TEXT,
  failureMessage TEXT,
  externalTaskId TEXT
);

CREATE INDEX IF NOT EXISTS delegated_agent_tasks_workspace_status_idx
  ON delegated_agent_tasks(workspace, status);

CREATE INDEX IF NOT EXISTS delegated_agent_tasks_workspace_agent_idx
  ON delegated_agent_tasks(workspace, agentEntryKey);
`;

const DELEGATED_TASK_MESSAGES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS delegated_agent_task_messages (
  messageId TEXT PRIMARY KEY,
  taskId TEXT NOT NULL,
  workspace TEXT NOT NULL,
  direction TEXT NOT NULL,
  message TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS delegated_agent_task_messages_task_idx
  ON delegated_agent_task_messages(workspace, taskId, createdAt);
`;

const DELEGATED_TASK_RESULTS_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS delegated_agent_task_results (
  taskId TEXT NOT NULL,
  workspace TEXT NOT NULL,
  summary TEXT NOT NULL,
  result TEXT NOT NULL,
  completedAt TEXT NOT NULL,
  PRIMARY KEY (workspace, taskId)
);
`;

const WORKSPACE_NOTES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS workspace_notes (
  noteId TEXT PRIMARY KEY,
  workspace TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tagsJson TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS workspace_notes_workspace_updated_idx
  ON workspace_notes(workspace, updatedAt DESC);
`;
