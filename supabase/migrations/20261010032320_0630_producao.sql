-- manifest: 0630 — produção, prioridade e SLA no lead (Gráfica / Comunicação Visual)
-- migration: 0630 — produção, prioridade e SLA no lead (Gráfica / Comunicação Visual)
-- Adiciona campos de controle de produção ao crm_leads:
--   producao_prioridade: baixa | normal | alta | urgente
--   producao_status: na_fila | em_producao | concluido | entregue
--   producao_sla_dias: prazo em dias para entrega/instalação
--   producao_data_prevista: data prevista de conclusão
--   producao_responsavel: usuário responsável pela etapa de produção

ALTER TABLE "public"."crm_leads"
ADD COLUMN IF NOT EXISTS "producao_prioridade" text DEFAULT 'normal' NOT NULL,
ADD COLUMN IF NOT EXISTS "producao_status" text DEFAULT 'na_fila' NOT NULL,
ADD COLUMN IF NOT EXISTS "producao_sla_dias" integer,
ADD COLUMN IF NOT EXISTS "producao_data_prevista" date,
ADD COLUMN IF NOT EXISTS "producao_responsavel" uuid;

COMMENT ON COLUMN "public"."crm_leads"."producao_prioridade" IS
  'Prioridade de produção: baixa, normal, alta, urgente';
COMMENT ON COLUMN "public"."crm_leads"."producao_status" IS
  'Status de produção: na_fila, em_producao, concluido, entregue';
COMMENT ON COLUMN "public"."crm_leads"."producao_sla_dias" IS
  'Prazo de produção em dias (SLA)';
COMMENT ON COLUMN "public"."crm_leads"."producao_data_prevista" IS
  'Data prevista de conclusão da produção/instalação';
COMMENT ON COLUMN "public"."crm_leads"."producao_responsavel" IS
  'ID do usuário responsável pela produção';

-- Constraints de valores válidos
ALTER TABLE "public"."crm_leads"
DROP CONSTRAINT IF EXISTS crm_leads_producao_prioridade_enum,
ADD CONSTRAINT crm_leads_producao_prioridade_enum CHECK (
  "producao_prioridade" = ANY (ARRAY['baixa'::text, 'normal'::text, 'alta'::text, 'urgente'::text])
);

ALTER TABLE "public"."crm_leads"
DROP CONSTRAINT IF EXISTS crm_leads_producao_status_enum,
ADD CONSTRAINT crm_leads_producao_status_enum CHECK (
  "producao_status" = ANY (ARRAY['na_fila'::text, 'em_producao'::text, 'concluido'::text, 'entregue'::text])
);

CREATE INDEX IF NOT EXISTS "idx_crm_leads_producao_status"
ON "public"."crm_leads" ("organization_id", "producao_status")
WHERE ("producao_status" <> 'entregue');

CREATE INDEX IF NOT EXISTS "idx_crm_leads_producao_prioridade"
ON "public"."crm_leads" ("organization_id", "producao_prioridade")
WHERE ("producao_prioridade" <> 'normal');
