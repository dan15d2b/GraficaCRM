/**
 * Validação de env vars com Zod.
 *
 * Chamada implicitamente no startup do Next via import. Variáveis de
 * instalação (licença, admin local, chaves IA) são OPCIONAIS aqui — o
 * Setup Wizard preenche no banco local. Apenas variáveis de infraestrutura
 * de runtime (WAHA, Resend, SMTP, etc.) têm validação mais estrita.
 *
 * Uso: import { env } from "@/lib/env";
 */

import { z } from "zod";

import { RETENCAO_TETO_DIAS } from "@/lib/retencao/politica";

const isProd = process.env.NODE_ENV === "production";

/**
 * Durante `next build` (NEXT_PHASE=phase-production-build) os segredos de runtime
 * ainda não existem — só as NEXT_PUBLIC_* são embutidas no bundle. Nessa fase
 * afrouxamos a validação (via seed de placeholders no parse abaixo) pra gerar a
 * imagem Docker (self-host) sem passar segredos como ARG, que vazariam nas
 * camadas. O boot real (sem essa fase) cobra os valores verdadeiros.
 *
 * A leniência é feita SÓ no parse — os validadores continuam com tipos Zod
 * estáveis, senão `z.infer` degrada `env.*` pra `{}` (uniões quebram `.url()`).
 */
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

/**
 * Em produção exigimos vars de infraestrutura crítica. Em dev, algumas são opcionais
 * pra permitir setup parcial (ex: dev sem WAHA quando trabalhando só na UI).
 */
const requiredInfra = (name: string) =>
  isProd
    ? z.string().min(1, `${name} é obrigatória em produção`)
    : z.string().default("");


/**
 * Knob de retenção em dias: NUNCA derruba o app.
 *
 * `z.coerce.number().int().positive()` lança para `=0`, que é justamente o que
 * o operador da VPS escreve quando quer desligar a poda — e `lib/env.ts` roda
 * no import do Next, então o throw vira 500 em TODAS as telas, com o contêiner
 * `healthy` e nada dizendo o porquê. Falha fechada na AÇÃO (o valor inválido
 * não vale) e aberta na INFORMAÇÃO (o app sobe e diz alto o que ignorou).
 *
 * Desligar a poda não é isto: se tiver de existir, é decisão de produto e vem
 * com nome próprio, não com um zero que o schema recusa.
 *
 * ─── E o teto ──────────────────────────────────────────────────────────────
 *
 * Sem teto, um `WEBHOOK_LOG_BODY_RETENTION_DAYS=9999999` (medido na #2612)
 * vira `new Date(Date.now() - 9999999 * 86_400_000)` em `limiteEm`, ou seja,
 * um corte no ano −25353 indo ao PostgREST; um `1e9` estoura a faixa de
 * `Date` e lança `RangeError: Invalid time value` antes de chegar lá. Por isso
 * o valor lido aqui passa por `RETENCAO_TETO_DIAS` (`lib/retencao/politica.ts`
 * — a MESMA constante dos demais prazos, importada, nunca reimplementada).
 * Acima do teto: o teto vale e o aviso sai AQUI, no lugar em que o valor é
 * lido, uma vez só no boot — no formato `chave=valor está acima do teto de N
 * dias — usando N`, o mesmo do teto de `interpretarRetencao` (#2603). Dentro
 * do intervalo, o número passa intacto, sem aviso.
 */
const diasDeRetencao = (nome: string, padrao: number) =>
  z.coerce
    .number()
    .int()
    .positive()
    .default(padrao)
    .catch(({ error }) => {
      console.warn(
        `[env] ${nome} inválida (${JSON.stringify(process.env[nome])}) — usando o padrão ${padrao} dias. ` +
          `Só número inteiro maior que zero vale aqui; "0" não desliga a poda. ` +
          `(${error.issues[0]?.message ?? "valor recusado"})`,
      );
      return padrao;
    })
    .transform((valor) => {
      // O teto é aplicado DEPOIS do catch: `catch` devolve o padrão só para
      // valor inválido, e um `9999999` é um número VÁLIDO demais — ele passaria
      // pelo catch como estava. Transform é o único ponto em que os dois
      // desfechos (inválido → padrão, gigante → teto) convivem sem um comer o
      // outro, e ambos com aviso.
      if (valor > RETENCAO_TETO_DIAS) {
        console.warn(
          `[env] ${nome}=${valor} está acima do teto de ${RETENCAO_TETO_DIAS} dias — usando ${RETENCAO_TETO_DIAS}.`,
        );
        return RETENCAO_TETO_DIAS;
      }
      return valor;
    });

const schema = z.object({
  // Node
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // ─── Banco de Dados Local (SQLite / LibSQL) ────────────────────────────────
  //
  // URL de conexão com o banco local. Formatos suportados:
  //   - file:./data/app.db           (SQLite arquivo local, modo WAL)
  //   - libsql://localhost:8080      (LibSQL server local)
  //   - sqlite://./data/app.db       (alias para file:)
  //
  // NÃO é obrigatório no boot — se ausente, o Setup Wizard cria o banco
  // e salva a URL. O app sobe sem banco e redireciona para /setup.
  DATABASE_URL: z.string().optional().default(""),

  // ─── Supabase (OPCIONAL — legado / migração) ───────────────────────────────
  //
  // Mantido para compatibilidade durante transição. Se preenchido, o app
  // pode operar em modo híbrido (Supabase + local). NÃO derruba o boot.
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().default(""),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  SUPABASE_SERVER_URL: z.string().optional().default(""),
  SUPABASE_DB_URL: z.string().optional().default(""),
  SUPABASE_DB_ADMIN_URL: z.string().optional().default(""),

  // ─── Cron / Interno ────────────────────────────────────────────────────────
  INTERNAL_SECRET: requiredInfra("INTERNAL_SECRET"),
  INTERNAL_CRON_SECRET: z.string().optional().default(""),
  TENANT_PROVISIONING_SECRET: z.string().optional().default(""),

  // Laboratório local de extensões
  EXTENSIONS_LOCAL_CATALOG_ORIGIN: z.string().optional().default(""),

  // Retenção webhook logs
  WEBHOOK_LOG_BODY_RETENTION_DAYS: diasDeRetencao("WEBHOOK_LOG_BODY_RETENTION_DAYS", 7),
  WEBHOOK_LOG_ROW_RETENTION_DAYS: diasDeRetencao("WEBHOOK_LOG_ROW_RETENTION_DAYS", 90),
  LEAD_CAPTURE_RETENTION_DAYS: z.string().optional().default(""),

  // Encryption keys
  CPF_ENCRYPTION_KEY: requiredInfra("CPF_ENCRYPTION_KEY"),
  WAHA_BYO_ENCRYPTION_KEY: requiredInfra("WAHA_BYO_ENCRYPTION_KEY"),
  AI_CRED_AES_KEY: requiredInfra("AI_CRED_AES_KEY"),

  // ─── WAHA ──────────────────────────────────────────────────────────────────
  WAHA_API_BASE_URL: requiredInfra("WAHA_API_BASE_URL"),
  WAHA_API_KEY: requiredInfra("WAHA_API_KEY"),
  WAHA_WEBHOOK_BASE_URL: requiredInfra("WAHA_WEBHOOK_BASE_URL"),
  WAHA_HMAC_SECRET: z.string().optional().default(""),
  WAHA_WEBHOOK_REQUIRE_SIGNATURE: z.string().optional().default("false"),

  // ─── WaCalls (voz WhatsApp) — OPCIONAL ─────────────────────────────────────
  WACALLS_API_BASE_URL: z.string().optional().default(""),
  WACALLS_API_TOKEN: z.string().optional().default(""),
  WACALLS_PUBLIC_IP: z.string().optional().default(""),
  WACALLS_WEBRTC_UDP_PORT: z.coerce.number().int().min(1).max(65535).optional().default(7881),

  // ─── Jitsi Meet (videochamada) — OPCIONAL ──────────────────────────────────
  JITSI_SERVER_URL: z
    .string()
    .optional()
    .default("")
    .refine((v) => v.trim() === "" || /^https?:\/\/\S+$/i.test(v.trim()), {
      message: "precisa ser uma URL http(s) como https://meet.jit.si",
    })
    .catch(({ error }) => {
      console.warn(
        `[env] JITSI_SERVER_URL inválida (${JSON.stringify(process.env.JITSI_SERVER_URL)}) — videochamada DESLIGADA. ` +
          `Ela vira o link da sala no botão "Vídeo", então só http(s) vale (ex.: https://meet.jit.si). ` +
          `(${error.issues[0]?.message ?? "valor recusado"})`,
      );
      return "";
    }),

  // ─── Datafy (canal parceiro) — OPCIONAL ────────────────────────────────────
  DATAFY_ENABLED: z.string().optional().default(""),

  // ─── Upstash Redis (OPCIONAL — rate limit local via SQLite se ausente) ─────
  UPSTASH_REDIS_REST_URL: z.string().optional().default(""),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(""),

  // ─── AI Providers (OPCIONAIS no env — configuradas no Setup Wizard) ────────
  AI_GATEWAY_API_KEY: z.string().optional().default(""),
  AI_GATEWAY_BASE_URL: z.string().optional().default(""),
  OPENROUTER_API_KEY: z.string().optional().default(""),
  OPENROUTER_BASE_URL: z.string().optional().default(""),
  OPENROUTER_APP_URL: z.string().optional().default(""),
  OPENROUTER_APP_TITLE: z.string().optional().default(""),
  VERCEL_AI_GATEWAY_URL: z.string().optional().default(""),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_REASONING_EFFORT: z.string().optional().default(""),
  TRANSCRIPTION_API_KEY: z.string().optional().default(""),
  TRANSCRIPTION_BASE_URL: z.string().optional().default(""),
  TRANSCRIPTION_MODEL: z.string().optional().default(""),
  TRANSCRIPTION_LANGUAGES: z.string().optional().default(""),
  JEV_API_BASE_URL: z.string().optional().default(""),

  // ─── Cobrança (teste) ──────────────────────────────────────────────────────
  COBRANCA_API_BASE_URL_TESTE: z.string().optional().default(""),

  // ─── Destinos internos autorizados (piso) ──────────────────────────────────
  IA_DESTINOS_INTERNOS_PERMITIDOS: z.string().optional().default(""),

  // ─── Agent Engine ──────────────────────────────────────────────────────────
  AGENT_DISPATCH_CONSUMER: z.enum(["engine", "native"]).optional().default("engine"),
  EVENT_LOG_WORKER_DRAINS: z.string().optional().default(""),

  // ─── AI Budget Kill Switch ─────────────────────────────────────────────────
  AI_BUDGET_ENFORCEMENT: z.string().optional().default("on"),

  // ─── Disclosure / Promise Semantic (piso da instalação) ────────────────────
  DISCLOSURE_MODE: z.string().optional(),
  PROMISE_SEMANTIC_ENABLED: z.string().optional(),

  // ─── Internal Agent Run Stub ───────────────────────────────────────────────
  INTERNAL_AGENT_RUN_STUB: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((v) => v === "true"),

  // ─── Sentry ────────────────────────────────────────────────────────────────
  SENTRY_DSN: z.string().optional().default(""),

  // ─── Resend (e-mail transacional) ──────────────────────────────────────────
  RESEND_API_KEY: z.string().optional().default(""),
  RESEND_FROM_EMAIL: z.string().optional().default(""),

  // ─── SMTP (segundo transporte) ─────────────────────────────────────────────
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional().default(587),
  SMTP_SECURITY: z.enum(["starttls", "tls", "none"]).optional().default("starttls"),
  SMTP_USERNAME: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  SMTP_FROM_EMAIL: z.string().optional().default(""),
  SMTP_FROM_NAME: z.string().optional().default(""),

  // ─── Support Email ─────────────────────────────────────────────────────────
  SUPPORT_EMAIL: z.string().optional().default(""),

  // ─── Impersonate ───────────────────────────────────────────────────────────
  IMPERSONATE_COOKIE_SECRET: z.string().optional().default(""),

  // ─── Retenções diversas (string — interpretação em lib/retencao/politica.ts) ─
  JOB_QUEUE_RETENTION_DAYS: z.string().optional().default(""),
  AUDIT_LOG_RETENTION_DAYS: z.string().optional().default(""),
  CASE_CHAT_RETENTION_DAYS: z.string().optional().default(""),
  PASSAGEM_RETENTION_DAYS: z.string().optional().default(""),
  CASE_ALERT_RETENTION_DAYS: z.string().optional().default(""),
  PROSPECCAO_RETENTION_DAYS: z.string().optional().default(""),
  JEV_OBSERVACOES_RETENTION_DAYS: z.string().optional().default(""),
  DRAFT_RETENTION_DAYS: z.string().optional().default(""),
  GOLDEN_CANDIDATES_RETENTION_DAYS: z.string().optional().default(""),
  AI_TELEMETRY_RETENTION_DAYS: z.string().optional().default(""),
  PACING_LEDGER_RETENTION_DAYS: z.string().optional().default(""),
  OUTBOUND_COPIES_RETENTION_DAYS: z.string().optional().default(""),
  LEAD_CHECKPOINT_RETENTION_DAYS: z.string().optional().default(""),

  // ─── LGPD ──────────────────────────────────────────────────────────────────
  LGPD_SIGNING_KEY: z.string().optional().default(""),
  LGPD_EXPORT_EXPIRES_HOURS: z.string().optional().default("72"),
  LGPD_DPO_EMAIL: z.string().optional().default(""),

  // ─── Google Calendar / Ads ─────────────────────────────────────────────────
  GOOGLE_CALENDAR_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_ADS_DEVELOPER_TOKEN: z.string().optional().default(""),
  GOOGLE_ADS_OAUTH_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_ADS_OAUTH_CLIENT_SECRET: z.string().optional().default(""),

  // ─── Nuvemshop ─────────────────────────────────────────────────────────────
  NUVEMSHOP_APP_ID: z.string().optional().default(""),
  NUVEMSHOP_CLIENT_ID: z.string().optional().default(""),
  NUVEMSHOP_CLIENT_SECRET: z.string().optional().default(""),
  NUVEMSHOP_OAUTH_ENCRYPTION_KEY: z.string().optional().default(""),
  NUVEMSHOP_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((v) => v === "true"),

  // ─── App URLs ──────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),
  NEXT_PUBLIC_ADMIN_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),
  META_WEBHOOK_BASE_URL: z.string().optional().default(""),
  META_GRAPH_BASE_URL: z.string().optional().default(""),
  META_ADS_GRAPH_BASE_URL: z.string().optional().default(""),

  // ─── White-label / Branding ────────────────────────────────────────────────
  APP_NAME: z.string().optional().default(""),
  APP_LOGO_URL: z.string().optional().default(""),
  APP_ACCENT_HEX: z.string().optional().default(""),

  // ─── CRM Gráfica — Licenciamento ───────────────────────────────────────────
  CRMGRAFICA_SKIP_ONBOARDING: z.string().optional().default(""),
  LICENSE_SERVER_URL: z.string().optional().default(""),
  LICENSE_VALIDATION_INTERVAL_HOURS: z.string().optional().default("24"),

  // ─── Signup Mode (piso — banco prevalece) ──────────────────────────────────
  SIGNUP_MODE: z.string().optional().default(""),

  // ─── VAPID Web Push ────────────────────────────────────────────────────────
  VAPID_PUBLIC_KEY: z.string().optional().default(""),
  VAPID_PRIVATE_KEY: z.string().optional().default(""),
});

let parsed = schema.safeParse(process.env);

// Na fase de build da imagem Docker, semeia placeholders pras vars que faltam
// (URL válida, passa .url()/.min(1)) e revalida — permite `next build` sem os
// segredos de runtime. NUNCA acontece em runtime: lá process.env está completo
// e este bloco não roda, então o boot real continua cobrando tudo.
if (!parsed.success && isBuildPhase) {
  const seeded: Record<string, string | undefined> = { ...process.env };
  for (const key of Object.keys(parsed.error.flatten().fieldErrors)) {
    if (!seeded[key]) seeded[key] = "https://build-placeholder.invalid";
  }
  parsed = schema.safeParse(seeded);
}

// IMPORTANTE: Não lançar erro no boot por vars de instalação faltantes.
// Apenas log estruturado. O Setup Wizard (/setup) trata a configuração.
if (!parsed.success) {
  const fieldErrors = parsed.error.flatten().fieldErrors;
  const infraErrors: string[] = [];
  const installErrors: string[] = [];

  // Separar erros de infraestrutura (críticos) vs instalação (Wizard resolve)
  const installKeys = new Set([
    "DATABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_DB_URL",
    "AI_GATEWAY_API_KEY",
    "ANTHROPIC_API_KEY",
    "OPENROUTER_API_KEY",
    "OPENAI_API_KEY",
    "LICENSE_SERVER_URL",
    "LICENSE_VALIDATION_INTERVAL_HOURS",
  ]);

  for (const [key, errors] of Object.entries(fieldErrors)) {
    if (installKeys.has(key)) {
      installErrors.push(`${key}: ${errors.join(", ")}`);
    } else {
      infraErrors.push(`${key}: ${errors.join(", ")}`);
    }
  }

  if (infraErrors.length > 0) {
    console.error("[env] Falha de validação de variáveis de INFRAESTRUTURA:");
    infraErrors.forEach((e) => console.error(`  - ${e}`));
    throw new Error(
      "Variáveis de infraestrutura inválidas. Veja erros acima e ajuste .env.local (ou .env em produção).",
    );
  }

  if (installErrors.length > 0) {
    console.warn("[env] Variáveis de INSTALAÇÃO ausentes/inválidas (Setup Wizard vai tratar):");
    installErrors.forEach((e) => console.warn(`  - ${e}`));
    // Não lança erro — permite boot para o Setup Wizard
  }
}

// Se chegou aqui, parsed.data existe (ou falhou só em vars de instalação, que são opcionais)
export const env = parsed.data!;

// Copia CRON_SECRET do Vercel para INTERNAL_CRON_SECRET em produção
if (env.NODE_ENV === "production") {
  const vercelCron = process.env.CRON_SECRET?.trim();
  if (vercelCron) {
    env.INTERNAL_CRON_SECRET = vercelCron;
  }
}

// Avisos informativos (não bloqueiam)
if (
  !env.AI_GATEWAY_API_KEY &&
  !env.ANTHROPIC_API_KEY &&
  !env.OPENROUTER_API_KEY &&
  !env.OPENAI_API_KEY
) {
  console.warn(
    "[env] Nenhuma chave de IA configurada no ambiente " +
      "(AI_GATEWAY_API_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY ou OPENAI_API_KEY). " +
      "Isto não prova que o agente está sem credencial: cada organização pode ter uma chave " +
      "cadastrada em IA › Credenciais. A falta real só é conhecida quando a resolução completa " +
      "do turno não encontra chave em nenhum degrau.",
  );
}

if (!env.OPENAI_API_KEY) {
  console.warn(
    "[env] OPENAI_API_KEY ausente — ela é o ÚLTIMO degrau da escada de chave da OpenAI " +
      "(preparo de material do acervo e transcrição de áudio). Se alguma organização já " +
      "cadastrou a chave em IA › Credenciais, os dois seguem funcionando por ela; se não " +
      "cadastrou nenhuma, ambos ficam parados até que alguém cadastre — pela tela ou aqui.",
  );
}

if (!env.IMPERSONATE_COOKIE_SECRET || env.IMPERSONATE_COOKIE_SECRET.length < 32) {
  console.warn(
    "[env] IMPERSONATE_COOKIE_SECRET not set or shorter than 32 chars — impersonate flow will return 503 at runtime.",
  );
}

// Flag para o middleware saber se o setup foi completado
// (Lida do banco local em runtime, não do env)
export const isSetupComplete = (): boolean => {
  // Será implementado em lib/instalacao/status.ts lendo do banco local
  return false;
};

export type Env = typeof env;