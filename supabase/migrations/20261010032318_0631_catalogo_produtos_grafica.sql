-- migration: 0631 — catálogo de produtos e serviços da gráfica
-- Tabela de produtos/serviços com preços tabelados, usada na geração de
-- orçamentos. Cada organização (gráfica) cadastra os seus próprios itens.

CREATE TABLE IF NOT EXISTS "public"."catalogo_produtos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL REFERENCES "public"."organizations"("id") ON DELETE CASCADE,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "categoria" "text" NOT NULL,
    "unidade" "text" NOT NULL DEFAULT 'unidade',
    "preco_cents" bigint NOT NULL DEFAULT 0,
    "moeda" "text" NOT NULL DEFAULT 'BRL',
    "ativo" boolean NOT NULL DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "catalogo_produtos_preco_positivo" CHECK ("preco_cents" >= 0),
    CONSTRAINT "catalogo_produtos_categoria_valida" CHECK (
        "categoria" = ANY (ARRAY[
            'grafica'::text,
            'comunicacao_visual'::text,
            'acabamento'::text,
            'instalacao'::text,
            'arte'::text,
            'outro'::text
        ])
    )
);

ALTER TABLE "public"."catalogo_produtos" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "idx_catalogo_produtos_org_ativo"
    ON "public"."catalogo_produtos" ("organization_id", "ativo");

CREATE INDEX IF NOT EXISTS "idx_catalogo_produtos_org_categoria"
    ON "public"."catalogo_produtos" ("organization_id", "categoria");

COMMENT ON COLUMN "public"."catalogo_produtos"."categoria" IS
  'grafica, comunicacao_visual, acabamento, instalacao, arte, outro';
COMMENT ON COLUMN "public"."catalogo_produtos"."unidade" IS
  'unidade, metro, metro_quadro, pacote, hora, conjunto';
COMMENT ON COLUMN "public"."catalogo_produtos"."preco_cents" IS
  'Preço unitário em centavos (ex: 1500 = R$ 15,00)';

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_catalogo_produtos_updated_at ON "public"."catalogo_produtos";
CREATE TRIGGER trg_catalogo_produtos_updated_at
    BEFORE UPDATE ON "public"."catalogo_produtos"
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- RLS
ALTER TABLE "public"."catalogo_produtos" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catalogo_produtos_tenant_isolation_all ON "public"."catalogo_produtos";
CREATE POLICY catalogo_produtos_tenant_isolation_all ON "public"."catalogo_produtos"
    FOR ALL
    USING ("organization_id" IN (SELECT public.fn_user_org_ids()))
    WITH CHECK ("organization_id" IN (SELECT public.fn_user_org_ids()));