/**
 * Compatibilidade shim — redireciona para o banco local SQLite
 *
 * Este arquivo mantém a compatibilidade de imports com o código antigo
 * que ainda usa `@/lib/supabase/admin`. A partir de 2026, o CRM usa
 * SQLite embutido via lib/db/local.ts.
 *
 * ⚠️ Para novos código, use lib/auth/local.ts e lib/db/local.ts diretamente.
 */

import { dbQuery, dbExecute, dbTransaction } from "@/lib/db/local";

// Interoperabilidade: implementa uma interface compatível com Supabase client
export interface SupabaseClient {
  from(table: string): SupabaseQueryBuilder;
  rpc(functionName: string, params: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
}

interface SupabaseQueryBuilder {
  select(columns?: string): SupabaseQueryChain;
  insert(data: unknown): SupabaseQueryChain;
  update(data: unknown): SupabaseQueryChain;
  delete(): SupabaseQueryChain;
}

interface SupabaseQueryChain {
  eq(column: string, value: unknown): SupabaseQueryChain;
  neq(column: string, value: unknown): SupabaseQueryChain;
  lt(column: string, value: unknown): SupabaseQueryChain;
  lte(column: string, value: unknown): SupabaseQueryChain;
  gt(column: string, value: unknown): SupabaseQueryChain;
  gte(column: string, value: unknown): SupabaseQueryChain;
  like(column: string, pattern: string): SupabaseQueryChain;
  ilike(column: string, pattern: string): SupabaseQueryChain;
  in(column: string, values: unknown[]): SupabaseQueryChain;
  is(column: string, value: unknown): SupabaseQueryChain;
  order(column: string, options?: { ascending?: boolean }): SupabaseQueryChain;
  limit(count: number): SupabaseQueryChain;
  offset(count: number): SupabaseQueryChain;
  single(): SupabaseQueryChain;
  maybeSingle(): SupabaseQueryChain;
  data: unknown;
  error: unknown;
}

class SupabaseQueryBuilderImpl implements SupabaseQueryBuilder {
  private sql = "";
  private params: unknown[] = [];
  private selectCols = "*";
  private baseTable: string;

  constructor(table: string) {
    this.baseTable = table;
    this.sql = `SELECT ${this.selectCols} FROM ${table}`;
  }

  private applyCondition(operator: string, column: string, value: unknown): this {
    const conditions: string[] = this.sql.includes("WHERE")
      ? []
      : [`${column} ${operator} ?`];

    if (!this.sql.includes("WHERE")) {
      this.sql += " WHERE";
    }
    this.sql += conditions.join(" AND ");
    this.params.push(value);
    return this;
  }

  select(columns?: string): SupabaseQueryChain {
    if (columns) this.selectCols = columns;
    this.sql = this.sql.replace(/SELECT \*\.*/, `SELECT ${columns}`);
    return this;
  }

  insert(data: unknown): SupabaseQueryChain {
    const row = data as Record<string, unknown>;
    const cols = Object.keys(row).join(", ");
    const placeholders = Object.values(row).map(() => "?").join(", ");
    this.sql = `INSERT INTO ${this.baseTable} (${cols}) VALUES (${placeholders})`;
    this.params = Object.values(row);
    return this;
  }

  update(data: unknown): SupabaseQueryChain {
    const row = data as Record<string, unknown>;
    const setClause = Object.entries(row).map(([k, v]) => `${k} = ?`).join(", ");
    this.sql = `UPDATE ${this.baseTable} SET ${setClause}`;
    this.params = Object.values(row);
    return this;
  }

  delete(): SupabaseQueryChain {
    this.sql = `DELETE FROM ${this.baseTable}`;
    return this;
  }

  eq(column: string, value: unknown): SupabaseQueryChain {
    if (!this.sql.includes("WHERE")) this.sql += " WHERE";
    this.sql += ` ${column} = ?`;
    this.params.push(value);
    return this;
  }

  neq(column: string, value: unknown): SupabaseQueryChain {
    if (!this.sql.includes("WHERE")) this.sql += " WHERE";
    this.sql += ` ${column} != ?`;
    this.params.push(value);
    return this;
  }

  lt(column: string, value: unknown): SupabaseQueryChain {
    if (!this.sql.includes("WHERE")) this.sql += " WHERE";
    this.sql += ` ${column} < ?`;
    this.params.push(value);
    return this;
  }

  lte(column: string, value: unknown): SupabaseQueryChain {
    if (!this.sql.includes("WHERE")) this.sql += " WHERE";
    this.sql += ` ${column} <= ?`;
    this.params.push(value);
    return this;
  }

  gt(column: string, value: unknown): SupabaseQueryChain {
    if (!this.sql.includes("WHERE")) this.sql += " WHERE";
    this.sql += ` ${column} > ?`;
    this.params.push(value);
    return this;
  }

  gte(column: string, value: unknown): SupabaseQueryChain {
    if (!this.sql.includes("WHERE")) this.sql += " WHERE";
    this.sql += ` ${column} >= ?`;
    this.params.push(value);
    return this;
  }

  like(column: string, pattern: string): SupabaseQueryChain {
    if (!this.sql.includes("WHERE")) this.sql += " WHERE";
    this.sql += ` ${column} LIKE ?`;
    this.params.push(pattern);
    return this;
  }

  ilike(column: string, pattern: string): SupabaseQueryChain {
    return this.like(column, pattern.toUpperCase());
  }

  in(column: string, values: unknown[]): SupabaseQueryChain {
    if (!this.sql.includes("WHERE")) this.sql += " WHERE";
    const placeholders = values.map(() => "?").join(", ");
    this.sql += ` ${column} IN (${placeholders})`;
    this.params.push(...values);
    return this;
  }

  is(column: string, value: unknown): SupabaseQueryChain {
    if (!this.sql.includes("WHERE")) this.sql += " WHERE";
    if (value === null) {
      this.sql += ` ${column} IS NULL`;
    } else {
      this.sql += ` ${column} = ?`;
      this.params.push(value);
    }
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): SupabaseQueryChain {
    this.sql += ` ORDER BY ${column} ${options?.ascending === false ? "DESC" : "ASC"}`;
    return this;
  }

  limit(count: number): SupabaseQueryChain {
    this.sql += ` LIMIT ${count}`;
    return this;
  }

  offset(count: number): SupabaseQueryChain {
    this.sql += ` OFFSET ${count}`;
    return this;
  }

  async single(): Promise<{ data: unknown; error: unknown }> {
    const result = await dbQuery<{ data: unknown[] }>(`${this.sql} LIMIT 1`, this.params);
    return { data: result.rows[0]?.data ?? null, error: result.error ?? null };
  }

  async maybeSingle(): Promise<{ data: unknown; error: unknown }> {
    const result = await dbQuery<{ data: unknown[] }>(`${this.sql} LIMIT 1`, this.params);
    return { data: result.rowCount > 0 ? result.rows[0]?.data : null, error: null };
  }

  async then(): Promise<{ data: unknown; error: unknown }> {
    const result = await dbQuery<{ data: unknown[] }>(this.sql, this.params);
    return { data: result.rows, error: result.error ?? null };
  }
}

function createMockClient(): SupabaseClient {
  return {
    from: (table: string) => new SupabaseQueryBuilderImpl(table) as unknown as SupabaseQueryBuilder,
    rpc: async (functionName: string, params: Record<string, unknown>) => {
      // Para RPC, converte para SQL chamada
      const placeholders = Object.entries(params).map(([_, v], i) => `$${i + 1}`).join(", ");
      const sql = `SELECT * FROM ${functionName}(${placeholders})`;
      const result = await dbExecute(sql, Object.values(params));
      return { data: result.rows[0], error: result.error ?? null };
    }
  };
}

export const getSupabaseAdmin = () => createMockClient();

// Aliases para compatibilidade - código antigo usa estes nomes
export const createAdminClient = getSupabaseAdmin;
export const createClient = getSupabaseAdmin;

export type { SupabaseClient };