/**
 * Autenticação Local — JWT + Cookie HttpOnly (substitui Supabase Auth)
 *
 * - Token de acesso: JWT assinado com HS256 (chave em INTERNAL_SECRET)
 * - Refresh token: armazenado no banco local (httpOnly cookie)
 * - Formato token: `dsk_<base64url(payload)>.<base64url(signature)>`
 * - Expiração access: 15min | refresh: 30 dias
 */

import { SignJWT, jwtVerify } from "jose";
import { env } from "../env";
import { dbExecute, dbQuery } from "../db/local";
import { randomBytes, createHash } from "crypto";

const COOKIE_NAME = "dsk_auth";
const REFRESH_COOKIE_NAME = "dsk_refresh";
const TOKEN_PREFIX = "dsk_";

// Chave para assinar JWTs (derivada de INTERNAL_SECRET)
async function getSigningKey(): Promise<Uint8Array> {
  const secret = env.INTERNAL_SECRET || "dev-secret-change-in-production";
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const hash = createHash("sha256").update(keyData).digest();
  return new Uint8Array(hash);
}

export interface LocalSession {
  userId: string;
  organizationId: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  organization_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  revoked_at: string | null;
}

/**
 * Gera access token JWT (15 min)
 */
export async function createAccessToken(session: Omit<LocalSession, "iat" | "exp">): Promise<string> {
  const key = await getSigningKey();
  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime("15m")
    .setNotBefore(now)
    .setIssuer("crmsgrafica-local")
    .sign(key);

  // Prefixo para identificação
  return TOKEN_PREFIX + token;
}

/**
 * Verifica e decodifica um access token
 */
export async function verifyAccessToken(token: string): Promise<LocalSession | null> {
  try {
    // Remove prefixo se existir
    const cleanToken = token.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : token;
    const key = await getSigningKey();

    const { payload } = await jwtVerify(cleanToken, key, {
      issuer: "crmsgrafica-local",
    });

    return {
      userId: payload.userId as string,
      organizationId: payload.organizationId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch (error) {
    console.error("[auth] Token inválido:", error);
    return null;
  }
}

/**
 * Cria refresh token (30 dias)
 */
export async function createRefreshToken(userId: string, organizationId: string): Promise<string> {
  const id = randomBytes(16).toString("hex");
  const tokenHash = createHash("sha256").update(id).digest("hex");

  await dbExecute(
    `INSERT INTO refresh_tokens (id, user_id, organization_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, datetime('now', '+30 days'), datetime('now'))`,
    [id, userId, organizationId, tokenHash],
  );

  return id;
}

/**
 * Verifica refresh token
 */
export async function verifyRefreshToken(tokenId: string, tokenHash: string): Promise<string | null> {
  const result = await dbQuery(
    `SELECT user_id, organization_id, revoked_at, expires_at
     FROM refresh_tokens
     WHERE id = ?`,
    [tokenId],
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0] as any;
  if (row.revoked_at) return null;
  if (new Date(row.expires_at) < new Date()) return null;

  const expectedHash = createHash("sha256").update(tokenId).digest("hex");
  if (expectedHash !== tokenHash) return null;

  return row.user_id as string;
}

/**
 * Revoga refresh token
 */
export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await dbExecute(
    `UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE id = ?`,
    [tokenId],
  );
}

/**
 * Cria admin inicial
 */
export async function createInitialAdmin(
  organizationName: string,
  adminEmail: string,
  adminPassword: string,
  adminName: string,
): Promise<{ organizationId: string; userId: string }> {
  const organizationId = randomBytes(16).toString("hex");
  const userId = randomBytes(16).toString("hex");
  const salt = randomBytes(16).toString("hex");
  const passwordHash = createHash("sha256")
    .update(salt)
    .update(":")
    .update(adminPassword)
    .digest("hex");

  const { dbExecute } = await import("../db/local");

  await dbExecute(
    `INSERT INTO organizations (id, name, cnpj, phone, address, business_hours, created_at)
     VALUES (?, ?, NULL, NULL, NULL, NULL, datetime('now'))`,
    [organizationId, organizationName],
  );

  await dbExecute(
    `INSERT INTO users (id, organization_id, name, email, password_hash, salt, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'dono', datetime('now'))`,
    [userId, organizationId, adminName, adminEmail.toLowerCase(), passwordHash, salt],
  );

  return { organizationId, userId };
}

// Tabela de refresh_tokens será criada no initSchema se necessário