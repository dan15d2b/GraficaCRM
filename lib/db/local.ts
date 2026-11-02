/**
 * Wrapper unificado para banco de dados local (SQLite / LibSQL).
 *
 * Detecta automaticamente o ambiente:
 * - Tauri (desktop): usa IPC para chamar comandos Rust (sqlite_init, sqlite_query, sqlite_execute)
 * - Node.js standalone (Linux server): usa better-sqlite3 direto
 * - Next.js dev: usa better-sqlite3 direto
 *
 * Mantém API consistente: init(), query(), execute(), close()
 */

import { env } from "@/lib/env";

// Tipos
export interface LocalDBRow {
  [key: string]: unknown;
}

export interface LocalDBResult {
  rows: LocalDBRow[];
  rowCount: number;
  lastInsertRowid?: string | number;
  changes: number;
}

export interface LocalDBConfig {
  url: string;
  walMode?: boolean;
  busyTimeout?: number;
  foreignKeys?: boolean;
}

let dbInstance: LocalDB | null = null;
let initPromise: Promise<LocalDB> | null = null;

/**
 * Detecta se está rodando dentro do Tauri
 */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_IPC__" in window;
}

/**
 * Detecta se está no Node.js (não browser)
 */
function isNode(): boolean {
  return typeof process !== "undefined" && process.versions != null && process.versions.node != null;
}

/**
 * Resolve o caminho do arquivo SQLite a partir da DATABASE_URL
 */
function resolveDbPath(url: string): string {
  const { path } = require("path");

  // Formatos suportados:
  // - file:./data/app.db
  // - file:///absolute/path/app.db
  // - sqlite://./data/app.db
  // - libsql://localhost:8080 (não é arquivo local)

  if (url.startsWith("libsql://")) {
    throw new Error("LibSQL remoto não suportado neste wrapper — use file: ou sqlite:");
  }

  let filePath = url;
  if (url.startsWith("file:")) {
    filePath = url.slice(5); // remove "file:"
  } else if (url.startsWith("sqlite:")) {
    filePath = url.slice(7); // remove "sqlite:"
  }

  // Remove query params se houver
  filePath = filePath.split("?")[0] ?? filePath;

  // Se caminho relativo, resolve a partir do cwd
  if (!path.isAbsolute(filePath)) {
    filePath = path.resolve(process.cwd(), filePath);
  }

  return filePath;
}

/**
 * Classe abstrata para implementações específicas
 */
abstract class LocalDB {
  abstract init(config: LocalDBConfig): Promise<void>;
  abstract query(sql: string, params?: unknown[]): Promise<LocalDBResult>;
  abstract execute(sql: string, params?: unknown[]): Promise<LocalDBResult>;
  abstract close(): Promise<void>;
  abstract isReady(): boolean;
}

/**
 * Implementação Tauri (IPC para Rust)
 */
class TauriDB extends LocalDB {
  private ready = false;

  async init(config: LocalDBConfig): Promise<void> {
    if (this.ready) return;

    // Chama comando Rust sqlite_init via Tauri IPC
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("sqlite_init", {
      dbPath: resolveDbPath(config.url),
      walMode: config.walMode ?? true,
      busyTimeout: config.busyTimeout ?? 5000,
      foreignKeys: config.foreignKeys ?? true,
    });
    this.ready = true;
  }

  async query(sql: string, params?: unknown[]): Promise<LocalDBResult> {
    if (!this.ready) throw new Error("DB não inicializado");
    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke("sqlite_query", { sql, params: params ?? [] });
    return result as LocalDBResult;
  }

  async execute(sql: string, params?: unknown[]): Promise<LocalDBResult> {
    if (!this.ready) throw new Error("DB não inicializado");
    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke("sqlite_execute", { sql, params: params ?? [] });
    return result as LocalDBResult;
  }

  async close(): Promise<void> {
    // Tauri gerencia ciclo de vida do DB no Rust side
    this.ready = false;
  }

  isReady(): boolean {
    return this.ready;
  }
}

/**
 * Implementação Node.js (better-sqlite3)
 */
class NodeDB extends LocalDB {
  private db: any = null;
  private ready = false;

  async init(config: LocalDBConfig): Promise<void> {
    if (this.ready) return;

    // Import dinâmico do better-sqlite3 (apenas no Node)
    const Database = (await import("better-sqlite3")).default;
    const dbPath = resolveDbPath(config.url);

    // Garante que o diretório existe (imports lazy para evitar 'fs' no bundle client)
    const { path } = require("path");
    const { existsSync, mkdirSync } = require("fs");
    const dir = path.dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);

    // Configurações de performance e integridade
    if (config.walMode ?? true) {
      this.db.pragma("journal_mode = WAL");
    }
    if (config.busyTimeout ?? 5000) {
      this.db.pragma(`busy_timeout = ${config.busyTimeout}`);
    }
    if (config.foreignKeys ?? true) {
      this.db.pragma("foreign_keys = ON");
    }

    // Otimizações adicionais
    this.db.pragma("synchronous = NORMAL");
    this.db.pragma("cache_size = -32768"); // 32MB cache
    this.db.pragma("temp_store = MEMORY");
    this.db.pragma("mmap_size = 268435456"); // 256MB mmap

    this.ready = true;
  }

  async query(sql: string, params?: unknown[]): Promise<LocalDBResult> {
    if (!this.ready || !this.db) throw new Error("DB não inicializado");

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(params ?? []) as LocalDBRow[];

    return {
      rows,
      rowCount: rows.length,
      changes: stmt.changes(),
      lastInsertRowid: stmt.lastInsertRowid,
    };
  }

  async execute(sql: string, params?: unknown[]): Promise<LocalDBResult> {
    if (!this.ready || !this.db) throw new Error("DB não inicializado");

    const stmt = this.db.prepare(sql);
    const result = stmt.run(params ?? []);

    return {
      rows: [],
      rowCount: 0,
      lastInsertRowid: result.lastInsertRowid,
      changes: result.changes,
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.ready = false;
    }
  }

  isReady(): boolean {
    return this.ready;
  }
}

/**
 * Função principal para obter instância do DB (singleton)
 */
export async function getLocalDB(config?: Partial<LocalDBConfig>): Promise<LocalDB> {
  if (dbInstance) return dbInstance;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    const dbUrl = config?.url ?? env.DATABASE_URL ?? "file:./data/app.db";

    let instance: LocalDB;
    if (isTauri()) {
      instance = new TauriDB();
    } else if (isNode()) {
      instance = new NodeDB();
    } else {
      throw new Error("Ambiente não suportado para banco local (não Tauri nem Node.js)");
    }

    await instance.init({
      url: dbUrl,
      walMode: config?.walMode ?? true,
      busyTimeout: config?.busyTimeout ?? 5000,
      foreignKeys: config?.foreignKeys ?? true,
    });

    dbInstance = instance;
    return instance;
  })();

  return initPromise;
}

/**
 * Helpers para queries comuns
 */
export async function dbQuery(sql: string, params?: unknown[]): Promise<LocalDBResult> {
  const db = await getLocalDB();
  return db.query(sql, params);
}

export async function dbExecute(sql: string, params?: unknown[]): Promise<LocalDBResult> {
  const db = await getLocalDB();
  return db.execute(sql, params);
}

export async function dbTransaction<T>(fn: (db: LocalDB) => Promise<T>): Promise<T> {
  const db = await getLocalDB();
  await db.execute("BEGIN");
  try {
    const result = await fn(db);
    await db.execute("COMMIT");
    return result;
  } catch (e) {
    await db.execute("ROLLBACK");
    throw e;
  }
}

/**
 * Inicializa schema do banco (tabelas core do CRM)
 * Baseado em src-tauri/src/commands/schema.sql
 */
export async function initSchema(): Promise<void> {
  const db = await getLocalDB();

  const statements = [
    // app_meta
    `CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,

    // organizations
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

    // users
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

    // clients
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
    `CREATE INDEX IF NOT EXISTS idx_clients_org_name ON clients(organization_id, name)`,

    // catalog_items
    `CREATE TABLE IF NOT EXISTS catalog_items (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'grafica',
      unit TEXT NOT NULL DEFAULT 'unidade',
      price_cents INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_catalog_org ON catalog_items(organization_id, active)`,

    // service_orders
    `CREATE TABLE IF NOT EXISTS service_orders (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      client_id TEXT REFERENCES clients(id),
      number INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'arte',
      priority TEXT NOT NULL DEFAULT 'normal',
      due_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(organization_id, number)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_os_org_status ON service_orders(organization_id, status)`,

    // service_order_items
    `CREATE TABLE IF NOT EXISTS service_order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      width_cm REAL,
      height_cm REAL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_price_cents INTEGER NOT NULL DEFAULT 0,
      finish TEXT
    )`,

    // art_files
    `CREATE TABLE IF NOT EXISTS art_files (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
      version INTEGER NOT NULL DEFAULT 1,
      path TEXT NOT NULL,
      approved_at TEXT,
      approved_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // stock_lots
    `CREATE TABLE IF NOT EXISTS stock_lots (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      material TEXT NOT NULL,
      width_m REAL,
      height_m REAL,
      quantity REAL NOT NULL DEFAULT 0,
      min_quantity REAL NOT NULL DEFAULT 0,
      is_offcut INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // stock_moves
    `CREATE TABLE IF NOT EXISTS stock_moves (
      id TEXT PRIMARY KEY,
      lot_id TEXT NOT NULL REFERENCES stock_lots(id) ON DELETE CASCADE,
      order_id TEXT REFERENCES service_orders(id),
      delta REAL NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // ledger_entries
    `CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      order_id TEXT REFERENCES service_orders(id),
      client_id TEXT REFERENCES clients(id),
      kind TEXT NOT NULL,
      method TEXT,
      description TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      due_at TEXT,
      paid_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_ledger_org ON ledger_entries(organization_id, kind, paid_at)`,

    // crm_deals (pipelines/kanban)
    `CREATE TABLE IF NOT EXISTS crm_deals (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      client_id TEXT REFERENCES clients(id),
      title TEXT NOT NULL,
      stage TEXT NOT NULL DEFAULT 'lead',
      lost_reason TEXT,
      value_cents INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // interactions
    `CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      client_id TEXT REFERENCES clients(id),
      deal_id TEXT REFERENCES crm_deals(id),
      kind TEXT NOT NULL,
      body TEXT NOT NULL,
      remind_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // integration_outbox (event sourcing)
    `CREATE TABLE IF NOT EXISTS integration_outbox (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      next_try_at TEXT,
      last_error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // refresh_tokens (auth local)
    `CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      revoked_at TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id, revoked_at)`,
    `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash)`,

    // crm_pipelines (core CRM)
    `CREATE TABLE IF NOT EXISTS crm_pipelines (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT,
      description TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      position REAL NOT NULL DEFAULT 1000,
      settings TEXT, -- JSON
      vocabulary TEXT, -- JSON
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_crm_pipelines_org ON crm_pipelines(organization_id)`,

    // crm_stages
    `CREATE TABLE IF NOT EXISTS crm_stages (
      id TEXT PRIMARY KEY,
      pipeline_id TEXT NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      color TEXT,
      is_won INTEGER NOT NULL DEFAULT 0,
      is_lost INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_crm_stages_org_pipeline ON crm_stages(organization_id, pipeline_id)`,

    // crm_leads
    `CREATE TABLE IF NOT EXISTS crm_leads (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      pipeline_id TEXT NOT NULL REFERENCES crm_pipelines(id),
      stage_id TEXT NOT NULL REFERENCES crm_stages(id),
      position_in_stage REAL NOT NULL DEFAULT 1000,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      lost_reason TEXT,
      won_reason TEXT,
      value_cents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'BRL',
      client_id TEXT REFERENCES clients(id),
      contact_id TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      tags TEXT, -- JSON array
      custom_fields TEXT, -- JSON
      source_metadata TEXT, -- JSON
      external_id TEXT,
      owner_user_id TEXT REFERENCES users(id),
      owner_agent_id TEXT,
      assigned_at TEXT,
      expected_close_date TEXT,
      closed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_by_user_id TEXT REFERENCES users(id)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_crm_leads_org_stage ON crm_leads(organization_id, stage_id, position_in_stage)`,
    `CREATE INDEX IF NOT EXISTS idx_crm_leads_contact ON crm_leads(organization_id, contact_id)`,

    // crm_lead_activities
    `CREATE TABLE IF NOT EXISTS crm_lead_activities (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      lead_id TEXT NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
      user_id TEXT,
      actor_type TEXT,
      actor_id TEXT,
      type TEXT NOT NULL,
      body TEXT,
      reason TEXT,
      payload TEXT, -- JSON
      metadata TEXT, -- JSON
      source_module TEXT,
      source_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_crm_lead_activities_org_lead ON crm_lead_activities(organization_id, lead_id)`,

    // crm_lead_links
    `CREATE TABLE IF NOT EXISTS crm_lead_links (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      lead_id TEXT NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
      related_type TEXT NOT NULL, -- 'contact', 'conversation', 'order', etc.
      related_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // contacts (WhatsApp)
    `CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      phone TEXT NOT NULL,
      name TEXT,
      display_name TEXT,
      profile_pic_url TEXT,
      is_business INTEGER NOT NULL DEFAULT 0,
      is_personal INTEGER NOT NULL DEFAULT 0,
      is_blocked INTEGER NOT NULL DEFAULT 0,
      metadata TEXT, -- JSON
      source TEXT,
      first_service_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(organization_id, phone)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_contacts_org_phone ON contacts(organization_id, phone)`,

    // conversations
    `CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      status TEXT NOT NULL DEFAULT 'open',
      assigned_user_id TEXT,
      last_message_at TEXT,
      metadata TEXT, -- JSON
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // messages
    `CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      direction TEXT NOT NULL, -- 'inbound', 'outbound'
      type TEXT NOT NULL, -- 'text', 'image', 'audio', 'video', 'document', etc.
      body TEXT,
      media_path TEXT,
      media_mime TEXT,
      media_size INTEGER,
      whatsapp_msg_id TEXT,
      status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
      error_message TEXT,
      metadata TEXT, -- JSON
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages(conversation_id, created_at)`,

    // api_audit_log
    `CREATE TABLE IF NOT EXISTS api_audit_log (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id TEXT,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      status_code INTEGER,
      request_body TEXT,
      response_body TEXT,
      ip TEXT,
      user_agent TEXT,
      duration_ms INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // event_log (event sourcing)
    `CREATE TABLE IF NOT EXISTS event_log (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      aggregate_type TEXT NOT NULL,
      aggregate_id TEXT NOT NULL,
      payload TEXT NOT NULL, -- JSON
      metadata TEXT, -- JSON
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_event_log_org_agg ON event_log(organization_id, aggregate_type, aggregate_id)`,

    // ai_provider_credentials (chaves IA por org)
    `CREATE TABLE IF NOT EXISTS ai_provider_credentials (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      provider TEXT NOT NULL, -- 'anthropic', 'openai', 'google', 'openrouter'
      encrypted_key TEXT NOT NULL,
      model TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // licenses (cache local da validação)
    `CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      license_key TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL, -- 'active', 'expired', 'blocked', 'revoked'
      plan TEXT,
      modules TEXT, -- JSON array
      expires_at TEXT,
      last_validated_at TEXT,
      validation_error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // setup_status (flag de instalação completa)
    `CREATE TABLE IF NOT EXISTS setup_status (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ];

  for (const sql of statements) {
    await db.execute(sql);
  }
}

/**
 * Verifica se o setup inicial foi completado
 */
export async function isSetupComplete(): Promise<boolean> {
  try {
    const db = await getLocalDB();
    const result = await db.query(
      "SELECT value FROM setup_status WHERE key = 'setup_complete'",
    );
    const row = result.rows[0];
    return result.rows.length > 0 && !!row?.value && row.value === "true";
  } catch {
    return false;
  }
}

/**
 * Marca setup como completo
 */
export async function markSetupComplete(): Promise<void> {
  const db = await getLocalDB();
  await db.execute(
    "INSERT OR REPLACE INTO setup_status (key, value, updated_at) VALUES ('setup_complete', 'true', datetime('now'))",
  );
}

/**
 * Fecha conexão (para testes/shutdown)
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    initPromise = null;
  }
}

export type { LocalDB };