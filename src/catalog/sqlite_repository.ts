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
  catalogNamespace: string;
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
  catalogNamespace: string;
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
      this.#db.exec(
        "INSERT OR IGNORE INTO schema_migrations(version, appliedAt) VALUES (?, ?)",
        1,
        new Date().toISOString(),
      );
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  async createAgent(
    namespace: string,
    input: IntroduceAgentInput & {
      verification: VerificationMetadata;
      now: string;
    },
  ): Promise<AgentCatalogEntry> {
    const db = this.requireDb();
    const insert = db.transaction(() => {
      if (this.agentExists(namespace, input.codexSessionId)) {
        throw new AgenticRouterError(
          "duplicate_entry",
          "Agent already exists in this catalog namespace.",
          { entryType: "agent" },
        );
      }

      db.exec(
        `INSERT INTO introduced_agents (
          catalogNamespace, codexSessionId, projectName, displayName,
          primarySpecialty, specialtyTags, handoff, verificationStatus,
          verificationSource, verifiedAt, verificationMessage, createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        namespace,
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
      const created = await this.getEntry(namespace, {
        entryType: "agent",
        entryKey: input.codexSessionId,
      });
      return created as AgentCatalogEntry;
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  async createSkill(
    namespace: string,
    input: IntroduceSkillInput & {
      verification: VerificationMetadata;
      now: string;
    },
  ): Promise<SkillCatalogEntry> {
    const db = this.requireDb();
    const insert = db.transaction(() => {
      if (this.skillExists(namespace, input.skillName)) {
        throw new AgenticRouterError(
          "duplicate_entry",
          "Skill already exists in this catalog namespace.",
          { entryType: "skill" },
        );
      }

      db.exec(
        `INSERT INTO introduced_skills (
          catalogNamespace, skillName, projectName, displayName,
          primarySpecialty, specialtyTags, verificationStatus,
          verificationSource, verifiedAt, verificationMessage, createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        namespace,
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
      const created = await this.getEntry(namespace, {
        entryType: "skill",
        entryKey: input.skillName,
      });
      return created as SkillCatalogEntry;
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  listEntries(
    namespace: string,
    filter: ListEntriesFilter,
  ): Promise<CatalogEntry[]> {
    const entries: CatalogEntry[] = [];
    if (!filter.entryType || filter.entryType === "agent") {
      entries.push(...this.listAgents(namespace, filter.projectName));
    }
    if (!filter.entryType || filter.entryType === "skill") {
      entries.push(...this.listSkills(namespace, filter.projectName));
    }
    return Promise.resolve(
      entries.sort((a, b) =>
        a.entryType.localeCompare(b.entryType) ||
        a.displayName.localeCompare(b.displayName)
      ),
    );
  }

  getEntry(
    namespace: string,
    lookup: EntryLookup,
  ): Promise<CatalogEntry | undefined> {
    if (lookup.entryType === "agent") {
      const row = this.requireDb().prepare<AgentRow>(
        `SELECT * FROM introduced_agents
         WHERE catalogNamespace = ? AND codexSessionId = ?`,
      ).get(namespace, lookup.entryKey);
      return Promise.resolve(row ? mapAgentRow(row) : undefined);
    }

    const row = this.requireDb().prepare<SkillRow>(
      `SELECT * FROM introduced_skills
       WHERE catalogNamespace = ? AND skillName = ?`,
    ).get(namespace, lookup.entryKey);
    return Promise.resolve(row ? mapSkillRow(row) : undefined);
  }

  close(): void {
    this.#db?.close();
    this.#db = undefined;
  }

  private listAgents(
    namespace: string,
    projectName?: string,
  ): AgentCatalogEntry[] {
    const db = this.requireDb();
    const sql = projectName
      ? `SELECT * FROM introduced_agents
         WHERE catalogNamespace = ? AND projectName = ?`
      : `SELECT * FROM introduced_agents WHERE catalogNamespace = ?`;
    const rows = projectName
      ? db.prepare<AgentRow>(sql).all(namespace, projectName)
      : db.prepare<AgentRow>(sql).all(namespace);
    return rows.map(mapAgentRow);
  }

  private listSkills(
    namespace: string,
    projectName?: string,
  ): SkillCatalogEntry[] {
    const db = this.requireDb();
    const sql = projectName
      ? `SELECT * FROM introduced_skills
         WHERE catalogNamespace = ? AND projectName = ?`
      : `SELECT * FROM introduced_skills WHERE catalogNamespace = ?`;
    const rows = projectName
      ? db.prepare<SkillRow>(sql).all(namespace, projectName)
      : db.prepare<SkillRow>(sql).all(namespace);
    return rows.map(mapSkillRow);
  }

  private agentExists(namespace: string, codexSessionId: string): boolean {
    return Boolean(
      this.requireDb().prepare<{ count: number }>(
        `SELECT COUNT(*) AS count FROM introduced_agents
         WHERE catalogNamespace = ? AND codexSessionId = ?`,
      ).get(namespace, codexSessionId)?.count,
    );
  }

  private skillExists(namespace: string, skillName: string): boolean {
    return Boolean(
      this.requireDb().prepare<{ count: number }>(
        `SELECT COUNT(*) AS count FROM introduced_skills
         WHERE catalogNamespace = ? AND skillName = ?`,
      ).get(namespace, skillName)?.count,
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
    catalogNamespace: row.catalogNamespace,
    entryType: "agent",
    entryKey: row.codexSessionId,
    codexSessionId: row.codexSessionId,
    projectName: row.projectName,
    displayName: row.displayName,
    primarySpecialty: row.primarySpecialty,
    specialtyTags: parseTags(row.specialtyTags),
    handoff: row.handoff ? JSON.parse(row.handoff) : undefined,
    verificationStatus: "verified",
    verificationSource: row.verificationSource,
    verifiedAt: row.verifiedAt,
    verificationMessage: row.verificationMessage ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapSkillRow(row: SkillRow): SkillCatalogEntry {
  return {
    catalogNamespace: row.catalogNamespace,
    entryType: "skill",
    entryKey: row.skillName,
    skillName: row.skillName,
    projectName: row.projectName,
    displayName: row.displayName,
    primarySpecialty: row.primarySpecialty,
    specialtyTags: parseTags(row.specialtyTags),
    verificationStatus: "verified",
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
  catalogNamespace TEXT NOT NULL,
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
  PRIMARY KEY (catalogNamespace, codexSessionId)
);

CREATE TABLE IF NOT EXISTS introduced_skills (
  catalogNamespace TEXT NOT NULL,
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
  PRIMARY KEY (catalogNamespace, skillName)
);
`;
