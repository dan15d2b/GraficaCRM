-- migration: 0632 — planos e assinaturas do revendedor (painel central)
-- Permite ao dono do GraficaCRM gerenciar as gráficas clientes:
-- plano, status (ativo/suspenso), uso mensal, vencimento.
-- manifest: PK em revendedor_planos e revendedor_assinaturas — a FK da
-- assinatura exige constraint única no alvo, e o create original falhava em
-- banco novo (toda instalação fresca morria nesta migration).

CREATE TABLE IF NOT EXISTS "public"."revendedor_planos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "preco_mensal_cents" bigint NOT NULL DEFAULT 0,
    "limite_usuarios" integer NOT NULL DEFAULT 3,
    "limite_conversas_mes" integer NOT NULL DEFAULT 500,
    "limite_ia_mes" integer NOT NULL DEFAULT 1000,
    "ativo" boolean NOT NULL DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "revendedor_planos_preco_positivo" CHECK ("preco_mensal_cents" >= 0),
    CONSTRAINT "revendedor_planos_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."revendedor_planos" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."revendedor_assinaturas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL REFERENCES "public"."organizations"("id") ON DELETE CASCADE,
    "plano_id" "uuid" NOT NULL REFERENCES "public"."revendedor_planos"("id"),
    "status" "text" NOT NULL DEFAULT 'ativo', -- ativo, suspenso, cancelado
    "valor_mensal_cents" bigint NOT NULL DEFAULT 0,
    "dia_vencimento" integer NOT NULL DEFAULT 10,
    "proximo_vencimento" date NOT NULL,
    "taxa_implantação_cents" bigint NOT NULL DEFAULT 0,
    "implantação_paga" boolean NOT NULL DEFAULT false,
    "usuarios_ativos" integer NOT NULL DEFAULT 0,
    "conversas_mes" integer NOT NULL DEFAULT 0,
    "ia_mes" integer NOT NULL DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "revendedor_assinaturas_status_valido" CHECK (
        "status" = ANY (ARRAY['ativo'::text, 'suspenso'::text, 'cancelado'::text])
    ),
    CONSTRAINT "revendedor_assinaturas_dia_valido" CHECK (
        "dia_vencimento" >= 1 AND "dia_vencimento" <= 28
    ),
    CONSTRAINT "revendedor_assinaturas_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."revendedor_assinaturas" OWNER TO "postgres";

CREATE UNIQUE INDEX IF NOT EXISTS "idx_revendedor_assinaturas_org_unica"
    ON "public"."revendedor_assinaturas" ("organization_id")
    WHERE ("status" <> 'cancelado');

CREATE INDEX IF NOT EXISTS "idx_revendedor_assinaturas_status"
    ON "public"."revendedor_assinaturas" ("status");

CREATE INDEX IF NOT EXISTS "idx_revendedor_assinaturas_vencimento"
    ON "public"."revendedor_assinaturas" ("proximo_vencimento");

COMMENT ON COLUMN "public"."revendedor_assinaturas"."status" IS
  'ativo, suspenso (inadimplência), cancelado';
COMMENT ON COLUMN "public"."revendedor_assinaturas"."taxa_implantação_cents" IS
  'Taxa única de implantação (setup)';
COMMENT ON COLUMN "public"."revendedor_assinaturas"."implantação_paga" IS
  'Se a taxa de implantação já foi paga';

-- Trigger de updated_at
DROP TRIGGER IF EXISTS trg_revendedor_planos_updated_at ON "public"."revendedor_planos";
CREATE TRIGGER trg_revendedor_planos_updated_at
    BEFORE UPDATE ON "public"."revendedor_planos"
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_revendedor_assinaturas_updated_at ON "public"."revendedor_assinaturas";
CREATE TRIGGER trg_revendedor_assinaturas_updated_at
    BEFORE UPDATE ON "public"."revendedor_assinaturas"
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- RLS
ALTER TABLE "public"."revendedor_planos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."revendedor_assinaturas" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS revendedor_planos_tenant_isolation_all ON "public"."revendedor_planos";
CREATE POLICY revendedor_planos_tenant_isolation_all ON "public"."revendedor_planos"
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS revendedor_assinaturas_tenant_isolation_all ON "public"."revendedor_assinaturas";
CREATE POLICY revendedor_assinaturas_tenant_isolation_all ON "public"."revendedor_assinaturas"
    FOR ALL
    USING (true)
    WITH CHECK (true);