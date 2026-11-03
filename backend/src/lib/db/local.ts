/**
 * Wrapper unificado para banco de dados local (SQLite).
 *
 * Usa better-sqlite3 direto no Node.js (para backend standalone).
 */

import Database from "better-sqlite3";
import { logger } from "../logger";

// Tipos
export interface LocalDBRow {
  [key: string]: unknown;
}

export interface LocalDBResult {
  rows: LocalDBRow[];
  rowCount: number;
  lastInsertRowid?: number;
  changes: number;
  error?: Error | null;
}

interface LocalDB {
  query(sql: string, params?: unknown[]): Promise<LocalDBResult>;
  execute(sql: string, params?: unknown[]): Promise<LocalDBResult>;
  close(): Promise<void>;
}

let dbInstance: LocalDB | null = null;
const DB_PATH = process.env.DATABASE_URL ?? "./data/app.db";

/**
 * Wrapper para better-sqlite3
 */
class BetterSQLiteDB implements LocalDB {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    // Configurações SQLite
    this.db.pragma("journal_mode=WAL");
    this.db.pragma("foreign_keys=ON");
    this.db.pragma("busy_timeout=5000");
    logger.info("SQLite inicializado", { path: dbPath });
  }

  async query(sql: string, params: unknown[] = []): Promise<LocalDBResult> {
    try {
      const stmt = this.db.prepare(sql);
      const info = stmt.all(...(params as unknown[])) as unknown[];
      const result: LocalDBRow[] = [];
      for (const row of info) {
        result.push(row as LocalDBRow);
      }
      return {
        rows: result,
        rowCount: result.length,
        changes: 0,
        lastInsertRowid: 0,
      };
    } catch (error) {
      logger.error("Query falhou", { sql, error: error instanceof Error ? error.message : String(error) });
      return {
        rows: [],
        rowCount: 0,
        changes: 0,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  async execute(sql: string, params: unknown[] = []): Promise<LocalDBResult> {
    try {
      const stmt = this.db.prepare(sql);
      const info = stmt.run(...(params as unknown[]));
      return {
        rows: [],
        rowCount: 0,
        changes: info.changes,
        lastInsertRowid: info.lastInsertRowid as number,
      };
    } catch (error) {
      logger.error("Execute falhou", { sql, error: error instanceof Error ? error.message : String(error) });
      return {
        rows: [],
        rowCount: 0,
        changes: 0,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

/**
 * Obtém ou cria a instância do banco de dados
 */
export async function getLocalDB(config?: { url?: string; walMode?: boolean; busyTimeout?: number; foreignKeys?: boolean }): Promise<LocalDB> {
  if (dbInstance) return dbInstance;

  const dbPath = config?.url ?? DB_PATH;
  dbInstance = new BetterSQLiteDB(dbPath);
  return dbInstance;
}

/**
 * Funções de conveniência
 */
export async function dbQuery(sql: string, params: unknown[] = []): Promise<LocalDBResult> {
  const db = await getLocalDB();
  return db.query(sql, params);
}

export async function dbExecute(sql: string, params: unknown[] = []): Promise<LocalDBResult> {
  const db = await getLocalDB();
  return db.execute(sql, params);
}

export async function dbTransaction<T>(fn: (db: LocalDB) => Promise<T>): Promise<T> {
  const db = await getLocalDB();
  return fn(db);
}

/**
 * Inicializa o schema do banco
 */
export async function initSchema(): Promise<void> {
  const db = await getLocalDB();

  // Schema simplificado para o uso do backend
  const statements = [
    `CREATE TABLE IF NOT EXISTS setup_status (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cnpj TEXT,
      phone TEXT,
      address TEXT,
      maps_link TEXT,
      business_hours TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'dono',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      kind TEXT NOT NULL DEFAULT 'pj',
      name TEXT NOT NULL,
      document TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      delivery_address TEXT,
      price_table TEXT,
      credit_limit_cents INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      license_key TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      plan TEXT NOT NULL DEFAULT 'professional',
      modules TEXT,
      expires_at TEXT,
      last_validated_at TEXT,
      validation_error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS ai_provider_credentials (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      encrypted_key TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      revoked_at TEXT
    )`,
  ];

  for (const stmt of statements) {
    await db.execute(stmt);
  }

  logger.info("Schema do banco inicializado");
}

/**
 * Verifica se o setup foi completado
 */
export async function isSetupComplete(): Promise<boolean> {
  const result = await dbQuery(
    "SELECT value FROM setup_status WHERE key = 'setup_complete' LIMIT 1",
  );
  return result.rows.length > 0 && (result.rows[0]?.value as string) === "true";
}

/**
 * Marca o setup como completo
 */
export async function markSetupComplete(): Promise<void> {
  await dbExecute(
    "INSERT OR REPLACE INTO setup_status (key, value) VALUES ('setup_complete', 'true')",
  );
}

/**
 * Fecha a conexão com o banco
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}