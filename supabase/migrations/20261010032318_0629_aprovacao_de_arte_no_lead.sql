-- migration: 0629 — aprovação de arte no lead (Gráfica / Comunicação Visual)
-- Adiciona campos formais de aprovação de arte ao crm_leads, permitindo
-- acompanhar quem aprovou, quando e em qual versão, com status:
--   pendente -> aguardando o cliente aprovar
--   aprovado -> cliente aprovou (botão/status formal)
--   ajuste_solicitado -> cliente pediu mudança, volta para revisão

ALTER TABLE "public"."crm_leads"
ADD COLUMN IF NOT EXISTS "arte_status" text DEFAULT 'pendente' NOT NULL,
ADD COLUMN IF NOT EXISTS "arte_versao" text DEFAULT 'V1' NOT NULL,
ADD COLUMN IF NOT EXISTS "arte_aprovado_em" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "arte_aprovado_por" uuid,
ADD COLUMN IF NOT EXISTS "arte_observacoes" text;

COMMENT ON COLUMN "public"."crm_leads"."arte_status" IS
  'Status da aprovação de arte: pendente, aprovado, ajuste_solicitado';
COMMENT ON COLUMN "public"."crm_leads"."arte_versao" IS
  'Versão da arte enviada ao cliente (ex: V1, V2, V3)';
COMMENT ON COLUMN "public"."crm_leads"."arte_aprovado_em" IS
  'Data/hora em que o cliente aprovou a arte';
COMMENT ON COLUMN "public"."crm_leads"."arte_aprovado_por" IS
  'ID do usuário da organização que registrou a aprovação';
COMMENT ON COLUMN "public"."crm_leads"."arte_observacoes" IS
  'Observações do cliente sobre a arte (ex: "muda a cor do logo")';

-- Garante valores válidos no status
ALTER TABLE "public"."crm_leads"
DROP CONSTRAINT IF EXISTS crm_leads_arte_status_enum,
ADD CONSTRAINT crm_leads_arte_status_enum CHECK (
  "arte_status" = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'ajuste_solicitado'::text])
);

CREATE INDEX IF NOT EXISTS "idx_crm_leads_arte_status"
ON "public"."crm_leads" ("organization_id", "arte_status")
WHERE ("arte_status" <> 'aprovado');
