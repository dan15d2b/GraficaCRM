/**
 * CRMGráfica 2.0 — Configuração de ambiente
 *
 * Variáveis obrigatórias para operação:
 * - DATABASE_URL: URL de conexão com o banco PostgreSQL
 * - NEXTAUTH_SECRET: Secret para autenticação
 * - LICENSE_SERVER_URL: URL do servidor de licenciamento
 * - LICENSE_VALIDATION_INTERVAL: Intervalo em horas para validação (padrão: 24)
 */
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

const required = (name: string) =>
  isProd
    ? z.string().min(1, `${name} é obrigatória em produção`)
    : z.string().default("");

const requiredAlways = (name: string) => z.string().min(1, `${name} é obrigatória`);

export const env = z
  .object({
    // Database
    DATABASE_URL: requiredAlways("DATABASE_URL"),

    // Auth
    NEXTAUTH_URL: required("NEXTAUTH_URL"),
    NEXTAUTH_SECRET: requiredAlways("NEXTAUTH_SECRET"),

    // License
    LICENSE_SERVER_URL: requiredAlways("LICENSE_SERVER_URL"),
    LICENSE_VALIDATION_INTERVAL: z.string().default("24"),

    // Branding (sem verde por padrão)
    APP_NAME: z.string().default("CRMGráfica"),
    APP_LOGO_URL: z.string().optional(),
    APP_ACCENT_HEX: z.string().default("#2563EB"), // Azul profissional como padrão

    // AI Agents
    AI_PROVIDER: z.string().default("anthropic"),
    AI_MODEL: z.string().default("claude-sonnet-4"),

    // WhatsApp (WAHA)
    WAHA_URL: z.string().optional(),
    WAHA_TOKEN: z.string().optional(),

    // Security
    ENCRYPTION_KEY: requiredAlways("ENCRYPTION_KEY"),
    INTERNAL_CRON_SECRET: requiredAlways("INTERNAL_CRON_SECRET"),
  })
  .parse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    LICENSE_SERVER_URL: process.env.LICENSE_SERVER_URL,
    LICENSE_VALIDATION_INTERVAL: process.env.LICENSE_VALIDATION_INTERVAL,
    APP_NAME: process.env.APP_NAME,
    APP_LOGO_URL: process.env.APP_LOGO_URL,
    APP_ACCENT_HEX: process.env.APP_ACCENT_HEX,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    WAHA_URL: process.env.WAHA_URL,
    WAHA_TOKEN: process.env.WAHA_TOKEN,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    INTERNAL_CRON_SECRET: process.env.INTERNAL_CRON_SECRET,
  });