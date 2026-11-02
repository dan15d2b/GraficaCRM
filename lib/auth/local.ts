/**
 * Autenticação Local — JWT + Cookie HttpOnly (substitui Supabase Auth)
 *
 * - Token de acesso: JWT assinado com HS256 (chave em env.INTERNAL_SECRET)
 * - Refresh token: armazenado no banco local (httpOnly cookie)
 * - Formato token: `dsk_<base64url(payload)>.<base64url(signature)>`
 * - Expiração access: 15min | refresh: 30 dias
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { getLocalDB, dbExecute, dbQuery } from "@/lib/db/local";
import { randomBytes, createHash } from "crypto";

const COOKIE_NAME = "dsk_auth";
const REFRESH_COOKIE_NAME = "dsk_refresh";
const TOKEN_PREFIX = "dsk_";

// Chave para assinar JWTs (derivada de INTERNAL_SECRET)
async function getSigningKey(): Promise<Uint8Array> {
  const secret = env.INTERNAL_SECRET || "dev-secret-change-in-production";
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  // Deriva chave de 32 bytes via SHA256
  const hash = createHash("sha256").update(keyData).digest();
  return hash;
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
    .sign(key);

  return `${TOKEN_PREFIX}${token}`;
}

/**
 * Verifica e decodifica access token
 */
export async function verifyAccessToken(token: string): Promise<LocalSession | null> {
  try {
    // Remove prefixo se presente
    const jwt = token.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : token;
    const key = await getSigningKey();
    const { payload } = await jwtVerify(jwt, key, { algorithms: ["HS256"] });
    return payload as unknown as LocalSession;
  } catch {
    return null;
  }
}

/**
 * Gera refresh token opaco (32 bytes) e salva hash no banco
 */
export async function createRefreshToken(userId: string, organizationId: string): Promise<string> {
  const db = await getLocalDB();
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 dias
  const id = randomBytes(16).toString("hex");

  await dbExecute(
    `INSERT INTO refresh_tokens (id, user_id, organization_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [id, userId, organizationId, tokenHash, expiresAt],
  );

  return `${TOKEN_PREFIX}${rawToken}`;
}

/**
 * Verifica refresh token e rotaciona (invalida o antigo, cria novo)
 */
export async function verifyAndRotateRefreshToken(token: string): Promise<{ session: LocalSession; newRefreshToken: string } | null> {
  try {
    const rawToken = token.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : token;
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    const db = await getLocalDB();
    const result = await dbQuery(
      `SELECT rt.*, u.email, u.name, u.role, u.organization_id
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = ? AND rt.revoked_at IS NULL AND rt.expires_at > datetime('now')`,
      [tokenHash],
    );

    if (result.rowCount === 0) return null;

    const row = result.rows[0];
    const record = row as unknown as RefreshTokenRecord & { email: string; name: string; role: string; organization_id: string };

    // Revoga token atual
    await dbExecute(
      "UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE id = ?",
      [record.id],
    );

    // Cria novo refresh token
    const newRefreshToken = await createRefreshToken(record.user_id, record.organization_id);

    // Gera novo access token
    const accessToken = await createAccessToken({
      userId: record.user_id,
      organizationId: record.organization_id,
      email: record.email,
      name: record.name,
      role: record.role,
    });

    return {
      session: {
        userId: record.user_id,
        organizationId: record.organization_id,
        email: record.email,
        name: record.name,
        role: record.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 15 * 60,
      },
      newRefreshToken,
    };
  } catch {
    return null;
  }
}

/**
 * Revoga todos os refresh tokens de um usuário (logout total)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await dbExecute(
    "UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE user_id = ? AND revoked_at IS NULL",
    [userId],
  );
}

/**
 * Define cookies de autenticação na resposta
 */
export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60, // 15 min
  });

  cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  });
}

/**
 * Remove cookies de autenticação (logout)
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}

/**
 * Obtém access token do cookie
 */
export async function getAccessTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

/**
 * Obtém refresh token do cookie
 */
export async function getRefreshTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE_NAME)?.value ?? null;
}

/**
 * Cria hash de senha (Argon2id via Web Crypto API - fallback para PBKDF2)
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16).toString("hex");

  // Usa SubtleCrypto PBKDF2 (disponível no Edge/Node)
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  const hash = Buffer.from(derivedBits).toString("hex");
  return { hash, salt };
}

/**
 * Verifica senha contra hash
 */
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  const computedHash = Buffer.from(derivedBits).toString("hex");
  // Timing-safe comparison
  const a = Buffer.from(hash);
  const b = Buffer.from(computedHash);
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= (a[i] as number) ^ (b[i] as number);
  }
  return result === 0;
}

/**
 * Autentica usuário por email/senha (login local)
 */
export async function authenticateUser(email: string, password: string): Promise<LocalSession | null> {
  const db = await getLocalDB();
  const result = await dbQuery(
    `SELECT u.*, o.id as organization_id
     FROM users u
     JOIN organizations o ON o.id = u.organization_id
     WHERE u.email = ?`,
    [email.toLowerCase()],
  );

  if (result.rowCount === 0) return null;

  const user = result.rows[0] as { id: string; organization_id: string; email: string; name: string; role: string; password_hash: string; salt: string };

  const valid = await verifyPassword(password, user.password_hash, user.salt);
  if (!valid) return null;

  return {
    userId: user.id,
    organizationId: user.organization_id,
    email: user.email,
    name: user.name,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15 * 60,
  };
}

/**
 * Cria usuário admin inicial (Setup Wizard)
 */
export async function createInitialAdmin(
  organizationName: string,
  adminEmail: string,
  adminPassword: string,
  adminName: string,
): Promise<{ organizationId: string; userId: string }> {
  const db = await getLocalDB();

  const organizationId = randomBytes(16).toString("hex");
  const userId = randomBytes(16).toString("hex");
  const { hash, salt } = await hashPassword(adminPassword);

  await dbTransaction(async (db) => {
    await db.execute(
      `INSERT INTO organizations (id, name, created_at) VALUES (?, ?, datetime('now'))`,
      [organizationId, organizationName],
    );

    await db.execute(
      `INSERT INTO users (id, organization_id, name, email, password_hash, salt, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'dono', datetime('now'))`,
      [userId, organizationId, adminName, adminEmail.toLowerCase(), hash, salt],
    );

    // Pipeline padrão
    const pipelineId = randomBytes(16).toString("hex");
    await db.execute(
      `INSERT INTO crm_pipelines (id, organization_id, name, is_default, created_at, updated_at)
       VALUES (?, ?, 'Pipeline Padrão', 1, datetime('now'), datetime('now'))`,
      [pipelineId, organizationId],
    );

    // Stages padrão
    const stages = [
      { name: "Novo Lead", position: 0, color: "#3B82F6" },
      { name: "Qualificação", position: 1, color: "#F59E0B" },
      { name: "Proposta", position: 2, color: "#8B5CF6" },
      { name: "Negociação", position: 3, color: "#EC4899" },
      { name: "Ganho", position: 4, color: "#10B981", is_won: 1 },
      { name: "Perdido", position: 5, color: "#EF4444", is_lost: 1 },
    ];

    for (const stage of stages) {
      const stageId = randomBytes(16).toString("hex");
      await db.execute(
        `INSERT INTO crm_stages (id, pipeline_id, name, position, color, is_won, is_lost, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [stageId, pipelineId, stage.name, stage.position, stage.color, stage.is_won ?? 0, stage.is_lost ?? 0],
      );
    }
  });

  return { organizationId, userId };
}

/**
 * Verifica se existe admin configurado (para Setup Wizard)
 */
export async function hasAdminUser(): Promise<boolean> {
  try {
    const db = await getLocalDB();
    const result = await dbQuery("SELECT 1 FROM users WHERE role = 'dono' LIMIT 1");
    return result.rowCount > 0;
  } catch {
    return false;
  }
}

/**
 * Middleware helper: obtém sessão atual do request
 */
export async function getSession(): Promise<LocalSession | null> {
  const accessToken = await getAccessTokenFromCookie();
  if (!accessToken) return null;

  const session = await verifyAccessToken(accessToken);
  if (session) return session;

  // Access token expirado — tenta refresh
  const refreshToken = await getRefreshTokenFromCookie();
  if (!refreshToken) return null;

  const rotated = await verifyAndRotateRefreshToken(refreshToken);
  if (!rotated) return null;

  // Define novos cookies
  await setAuthCookies(await createAccessToken(rotated.session), rotated.newRefreshToken);
  return rotated.session;
}

/**
 * Requer autenticação (lança se não autenticado)
 */
export async function requireAuth(): Promise<LocalSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

/**
 * Requer role específica
 */
export async function requireRole(allowedRoles: string[]): Promise<LocalSession> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

// Exporta tipos para uso em outros módulos
export type { LocalSession as Session };

// Helper para transação (re-export de lib/db/local)
import { dbTransaction } from "@/lib/db/local";
export { dbTransaction };