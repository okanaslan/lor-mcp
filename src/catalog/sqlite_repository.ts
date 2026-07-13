import type { Database } from "@db/sqlite";
import type {
  AgentCatalogEntry,
  CatalogEntry,
  CatalogRepository,
  EntryLookup,
  IntroduceAgentInput,
  IntroduceSkillInput,
  ListEntriesFilter,
  SkillCatalogEntry,
  VerificationMetadata,
} from "@src/catalog/types.ts";
import { AgenticRouterError } from "@src/errors.ts";

interface AgentRow {
  workspace: string;
  codexSessionId: string;
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
  verificationStatus: string;
  verificationSource: string;
  verifiedAt: string;
  verificationMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

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
      recordSchemaVersion(this.#db, 2);
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  async createAgent(
    workspace: string,
    input: IntroduceAgentInput & {
      verification: VerificationMetadata;
      now: string;
    },
  ): Promise<AgentCatalogEntry> {
    const db = this.requireDb();
    const insert = db.transaction(() => {
      if (this.agentExists(workspace, input.codexSessionId)) {
        throw new AgenticRouterError(
          "duplicate_entry",
          "Agent already exists in this workspace.",
          { entryType: "agent" },
        );
      }

      db.exec(
        `INSERT INTO introduced_agents (
          workspace, codexSessionId, projectName, displayName,
          primarySpecialty, specialtyTags, handoff, verificationStatus,
          verificationSource, verifiedAt, verificationMessage, createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        workspace,
        input.codexSessionId,
        input.projectName,
        input.displayName,
        input.primarySpecialty,
        JSON.stringify(input.specialtyTags),
        input.handoff ? JSON.stringify(input.handoff) : null,
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
    const insert = db.transaction(() => {
      if (this.skillExists(workspace, input.skillName)) {
        throw new AgenticRouterError(
          "duplicate_entry",
          "Skill already exists in this workspace.",
          { entryType: "skill" },
        );
      }

      db.exec(
        `INSERT INTO introduced_skills (
          workspace, skillName, projectName, displayName,
          primarySpecialty, specialtyTags, verificationStatus,
          verificationSource, verifiedAt, verificationMessage, createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        workspace,
        input.skillName,
        input.projectName,
        input.displayName,
        input.primarySpecialty,
        JSON.stringify(input.specialtyTags),
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
      });
      return created as SkillCatalogEntry;
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
      entries.push(...this.listAgents(workspace, filter.projectName));
    }
    if (!filter.entryType || filter.entryType === "skill") {
      entries.push(...this.listSkills(workspace, filter.projectName));
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
    if (lookup.entryType === "agent") {
      const row = this.requireDb().prepare<AgentRow>(
        `SELECT * FROM introduced_agents
         WHERE workspace = ? AND codexSessionId = ?`,
      ).get(workspace, lookup.entryKey);
      return Promise.resolve(row ? mapAgentRow(row) : undefined);
    }

    const row = this.requireDb().prepare<SkillRow>(
      `SELECT * FROM introduced_skills
       WHERE workspace = ? AND skillName = ?`,
    ).get(workspace, lookup.entryKey);
    return Promise.resolve(row ? mapSkillRow(row) : undefined);
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
  ): SkillCatalogEntry[] {
    const db = this.requireDb();
    const sql = projectName
      ? `SELECT * FROM introduced_skills
         WHERE workspace = ? AND projectName = ?`
      : `SELECT * FROM introduced_skills WHERE workspace = ?`;
    const rows = projectName
      ? db.prepare<SkillRow>(sql).all(workspace, projectName)
      : db.prepare<SkillRow>(sql).all(workspace);
    return rows.map(mapSkillRow);
  }

  private agentExists(workspace: string, codexSessionId: string): boolean {
    return Boolean(
      this.requireDb().prepare<{ count: number }>(
        `SELECT COUNT(*) AS count FROM introduced_agents
         WHERE workspace = ? AND codexSessionId = ?`,
      ).get(workspace, codexSessionId)?.count,
    );
  }

  private skillExists(workspace: string, skillName: string): boolean {
    return Boolean(
      this.requireDb().prepare<{ count: number }>(
        `SELECT COUNT(*) AS count FROM introduced_skills
         WHERE workspace = ? AND skillName = ?`,
      ).get(workspace, skillName)?.count,
    );
  }

  private requireDb(): Database {
    if (!this.#db) {
      throw new AgenticRouterError(
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
    entryType: "agent",
    entryKey: row.codexSessionId,
    codexSessionId: row.codexSessionId,
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
    workspace: row.workspace,
    entryType: "skill",
    entryKey: row.skillName,
    skillName: row.skillName,
    projectName: row.projectName,
    displayName: row.displayName,
    primarySpecialty: row.primarySpecialty,
    specialtyTags: parseTags(row.specialtyTags),
    verificationStatus: parseVerificationStatus(row.verificationStatus),
    verificationSource: row.verificationSource,
    verifiedAt: row.verifiedAt,
    verificationMessage: row.verificationMessage ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function parseTags(value: string): string[] {
  const parsed = JSON.parse(value);
  return Array.isArray(parsed)
    ? parsed.filter((tag) => typeof tag === "string")
    : [];
}

function parseVerificationStatus(
  value: string,
): VerificationMetadata["verificationStatus"] {
  if (value === "verified" || value === "unverified" || value === "unknown") {
    return value;
  }
  return "unknown";
}

interface TableColumn {
  name: string;
}

function migrateLegacyNamespaceColumns(db: Database): void {
  renameLegacyNamespaceColumn(db, "introduced_agents");
  renameLegacyNamespaceColumn(db, "introduced_skills");
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

function mapStorageError(error: unknown): AgenticRouterError {
  if (error instanceof AgenticRouterError) {
    return error;
  }
  return new AgenticRouterError("storage_error", "Catalog storage failed.");
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  appliedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS introduced_agents (
  workspace TEXT NOT NULL,
  codexSessionId TEXT NOT NULL,
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
  verificationStatus TEXT NOT NULL,
  verificationSource TEXT NOT NULL,
  verifiedAt TEXT NOT NULL,
  verificationMessage TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (workspace, skillName)
);
`;
