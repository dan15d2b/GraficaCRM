/**
 * Configurações de ambiente.
 */

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "./data/app.db",
  PORT: parseInt(process.env.PORT || "3000", 10),
  INTERNAL_SECRET: process.env.INTERNAL_SECRET || "dev-secret-change-in-production",
  INTERNAL_CRON_SECRET: process.env.INTERNAL_CRON_SECRET || "",
  AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY || "",
  AI_GATEWAY_BASE_URL: process.env.AI_GATEWAY_BASE_URL || "",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || "",
  OPENROUTER_APP_URL: process.env.OPENROUTER_APP_URL || "",
  OPENROUTER_APP_TITLE: process.env.OPENROUTER_APP_TITLE || "",
  WAHA_API_BASE_URL: process.env.WAHA_API_BASE_URL || "",
  WAHA_API_KEY: process.env.WAHA_API_KEY || "",
  LICENSE_SERVER_URL: process.env.LICENSE_SERVER_URL || "https://license.seudominio.com",
  CPF_ENCRYPTION_KEY: process.env.CPF_ENCRYPTION_KEY || "",
  AI_CRED_AES_KEY: process.env.AI_CRED_AES_KEY || "",
};