-- manifest: 0633 — funis da gráfica (Comercial + Produção) e campos extras no lead
-- migration: 0633 — funis da gráfica (Comercial + Produção) e campos extras no lead
-- Cria DOIS pipelines padrão para organizações do nicho gráfica:
--   1. Comercial: lead → briefing → orçamento → negociação → ganho/perda
--   2. Produção: arte → aprovação → impressão → acabamento → entrega
-- Adiciona campos de negócio gráfico no crm_leads.

-- ============================================================================
-- PARTE A: Campos extras no crm_leads
-- ============================================================================

ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS tipo_servico text DEFAULT 'grafica_rapida',
  ADD COLUMN IF NOT EXISTS vendedor_responsavel uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS follow_up_status text DEFAULT 'em_dia',
  ADD COLUMN IF NOT EXISTS prazo_entrega date;

COMMENT ON COLUMN public.crm_leads.tipo_servico IS
  'Tipo de serviço gráfico: grafica_rapida, offset, comunicacao_visual, digital';
COMMENT ON COLUMN public.crm_leads.vendedor_responsavel IS
  'ID do usuário responsável pela venda (vendedor)';
COMMENT ON COLUMN public.crm_leads.follow_up_status IS
  'Status do follow-up: em_dia, hoje, atrasado';
COMMENT ON COLUMN public.crm_leads.prazo_entrega IS
  'Data prevista de entrega ao cliente';

-- Constraints
ALTER TABLE public.crm_leads
  DROP CONSTRAINT IF EXISTS crm_leads_tipo_servico_enum,
  ADD CONSTRAINT crm_leads_tipo_servico_enum CHECK (
    tipo_servico = ANY (ARRAY[
      'grafica_rapida'::text,
      'offset'::text,
      'comunicacao_visual'::text,
      'digital'::text
    ])
  );

ALTER TABLE public.crm_leads
  DROP CONSTRAINT IF EXISTS crm_leads_follow_up_status_enum,
  ADD CONSTRAINT crm_leads_follow_up_status_enum CHECK (
    follow_up_status = ANY (ARRAY[
      'em_dia'::text,
      'hoje'::text,
      'atrasado'::text
    ])
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_crm_leads_vendedor
  ON public.crm_leads (organization_id, vendedor_responsavel)
  WHERE vendedor_responsavel IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_leads_follow_up_status
  ON public.crm_leads (organization_id, follow_up_status)
  WHERE follow_up_status <> 'em_dia';

CREATE INDEX IF NOT EXISTS idx_crm_leads_prazo_entrega
  ON public.crm_leads (organization_id, prazo_entrega)
  WHERE prazo_entrega IS NOT NULL;

-- ============================================================================
-- PARTE B: Pipeline Comercial (semeadura)
-- ============================================================================

DO $$
DECLARE
  v_pipeline_id uuid;
BEGIN
  INSERT INTO public.crm_pipelines (
    organization_id, name, slug, description, is_default, is_client_pipeline, position, settings
  )
  SELECT o.id, 'Comercial', 'comercial',
    'Funil de vendas: desde o contato inicial até o fechamento', true, false, 0,
    jsonb_build_object(
      'vocabulary', jsonb_build_object('lead','negócio','leads','negócios','stage','etapa','stages','etapas','won','Fechado','lost','Perdido','lost_reason','motivo da perda'),
      'lost_reasons', jsonb_build_array(
        jsonb_build_object('id','preco','nome','Preço'),
        jsonb_build_object('id','concorrente','nome','Concorrente'),
        jsonb_build_object('id','necessidade','nome','Não há necessidade'),
        jsonb_build_object('id','tempo','nome','Prazo insuficiente'),
        jsonb_build_object('id','outro','nome','Outro')
      )
    )
  FROM public.organizations o
  LEFT JOIN public.crm_pipelines p ON p.organization_id = o.id AND p.slug = 'comercial'
  WHERE p.id IS NULL
  RETURNING id INTO v_pipeline_id;

  IF v_pipeline_id IS NOT NULL THEN
    INSERT INTO public.crm_stages (organization_id, pipeline_id, name, slug, position, is_won, is_lost, is_archived)
    SELECT o.id, v_pipeline_id, v.name, v.slug, v.position, v.is_won, v.is_lost, false
    FROM (VALUES
      ('Novo Lead','novo_lead',1000,false,false),
      ('Levantamento / Briefing','levantamento_briefing',2000,false,false),
      ('Orçamento Enviado','orcamento_enviado',3000,false,false),
      ('Em Negociação','em_negociacao',4000,false,false),
      ('Fechado (Ganho)','fechado_ganho',5000,true,false),
      ('Perdido','perdido',6000,false,true)
    ) AS v(name, slug, position, is_won, is_lost)
    CROSS JOIN public.organizations o
    LEFT JOIN public.crm_stages s ON s.pipeline_id = v_pipeline_id AND s.slug = v.slug
    WHERE s.id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- PARTE C: Pipeline Produção (pós-venda)
-- ============================================================================

DO $$
DECLARE
  v_pipeline_id uuid;
BEGIN
  INSERT INTO public.crm_pipelines (
    organization_id, name, slug, description, is_default, is_client_pipeline, position, settings
  )
  SELECT o.id, 'Produção', 'producao',
    'Funil de produção: acompanhamento do pedido desde a arte até a entrega', false, true, 1,
    jsonb_build_object(
      'vocabulary', jsonb_build_object('lead','pedido','leads','pedidos','stage','etapa','stages','etapas')
    )
  FROM public.organizations o
  LEFT JOIN public.crm_pipelines p ON p.organization_id = o.id AND p.slug = 'producao'
  WHERE p.id IS NULL
  RETURNING id INTO v_pipeline_id;

  IF v_pipeline_id IS NOT NULL THEN
    INSERT INTO public.crm_stages (organization_id, pipeline_id, name, slug, position, is_won, is_lost, is_archived)
    SELECT o.id, v_pipeline_id, v.name, v.slug, v.position, false, false, false
    FROM (VALUES
      ('Aguardando Arte','aguardando_arte',1000),
      ('Arte-Final','arte_final',2000),
      ('Aguardando Aprovação','aguardando_aprovacao',3000),
      ('Impressão','impressao',4000),
      ('Acabamento','acabamento',5000),
      ('Instalação / Expedição','instalacao_expedicao',6000),
      ('Entregue','entregue',7000)
    ) AS v(name, slug, position)
    CROSS JOIN public.organizations o
    LEFT JOIN public.crm_stages s ON s.pipeline_id = v_pipeline_id AND s.slug = v.slug
    WHERE s.id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- PARTE D: Atualiza o seed default para gráfica
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_seed_default_pipeline_for_org()
RETURNS trigger AS $$
DECLARE
  v_pipeline_id uuid;
BEGIN
  -- Cria pipeline Comercial
  INSERT INTO public.crm_pipelines (
    organization_id, name, slug, description, is_default, is_client_pipeline, position, settings
  ) VALUES (
    NEW.id, 'Comercial', 'comercial',
    'Funil de vendas: desde o contato inicial até o fechamento', true, false, 0,
    jsonb_build_object(
      'vocabulary', jsonb_build_object('lead','negócio','leads','negócios','stage','etapa','stages','etapas','won','Fechado','lost','Perdido','lost_reason','motivo da perda'),
      'lost_reasons', jsonb_build_array(
        jsonb_build_object('id','preco','nome','Preço'),
        jsonb_build_object('id','concorrente','nome','Concorrente'),
        jsonb_build_object('id','necessidade','nome','Não há necessidade'),
        jsonb_build_object('id','tempo','nome','Prazo insuficiente'),
        jsonb_build_object('id','outro','nome','Outro')
      )
    )
  ) RETURNING id INTO v_pipeline_id;

  IF v_pipeline_id IS NOT NULL THEN
    INSERT INTO public.crm_stages (organization_id, pipeline_id, name, slug, position, is_won, is_lost, is_archived)
    VALUES
      (NEW.id, v_pipeline_id, 'Novo Lead', 'novo_lead', 1000, false, false, false),
      (NEW.id, v_pipeline_id, 'Levantamento / Briefing', 'levantamento_briefing', 2000, false, false, false),
      (NEW.id, v_pipeline_id, 'Orçamento Enviado', 'orcamento_enviado', 3000, false, false, false),
      (NEW.id, v_pipeline_id, 'Em Negociação', 'em_negociacao', 4000, false, false, false),
      (NEW.id, v_pipeline_id, 'Fechado (Ganho)', 'fechado_ganho', 5000, true, false, false),
      (NEW.id, v_pipeline_id, 'Perdido', 'perdido', 6000, false, true, false);

    -- Cria pipeline Produção
    INSERT INTO public.crm_pipelines (
      organization_id, name, slug, description, is_default, is_client_pipeline, position, settings
    ) VALUES (
      NEW.id, 'Produção', 'producao',
      'Funil de produção: acompanhamento do pedido desde a arte até a entrega', false, true, 1,
      jsonb_build_object('vocabulary', jsonb_build_object('lead','pedido','leads','pedidos','stage','etapa','stages','etapas'))
    ) RETURNING id INTO v_pipeline_id;

    IF v_pipeline_id IS NOT NULL THEN
      INSERT INTO public.crm_stages (organization_id, pipeline_id, name, slug, position, is_won, is_lost, is_archived)
      VALUES
        (NEW.id, v_pipeline_id, 'Aguardando Arte', 'aguardando_arte', 1000, false, false, false),
        (NEW.id, v_pipeline_id, 'Arte-Final', 'arte_final', 2000, false, false, false),
        (NEW.id, v_pipeline_id, 'Aguardando Aprovação', 'aguardando_aprovacao', 3000, false, false, false),
        (NEW.id, v_pipeline_id, 'Impressão', 'impressao', 4000, false, false, false),
        (NEW.id, v_pipeline_id, 'Acabamento', 'acabamento', 5000, false, false, false),
        (NEW.id, v_pipeline_id, 'Instalação / Expedição', 'instalacao_expedicao', 6000, false, false, false),
        (NEW.id, v_pipeline_id, 'Entregue', 'entregue', 7000, false, false, false);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
