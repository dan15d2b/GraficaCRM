-- manifest: 0633 — CRMGráfica licença e settings da organização
-- CRMGráfica 2.0 — Migração de Licenciamento e Configurações da Empresa
-- Tables:
--   organization_settings: endereço, telefone, horários da gráfica para notificação de retirada
--   license_keys: chaves de licença por instalação (self-host)

-- 1. Tabela de configurações da organização (localização da gráfica)
CREATE TABLE IF NOT EXISTS organization_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_name  TEXT NOT NULL DEFAULT 'Nossa Gráfica',
  address       TEXT NOT NULL DEFAULT 'Rua Principal, 123 - Centro',
  phone         TEXT NOT NULL DEFAULT '(11) 9999-9999',
  maps_link     TEXT NOT NULL DEFAULT 'https://maps.google.com',
  business_hours TEXT NOT NULL DEFAULT 'Seg-Sex: 8h às 18h',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT organization_settings_organization_id_key UNIQUE (organization_id)
);

COMMENT ON TABLE organization_settings IS 'Configurações de localização da empresa para notificação de pronta-retirada';

-- 2. Tabela de chaves de licença
CREATE TABLE IF NOT EXISTS license_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL DEFAULT '',
  plan            TEXT NOT NULL DEFAULT 'starter',
  modules         JSONB NOT NULL DEFAULT '["whatsapp","kanban"]',
  expires_at      TIMESTAMPTZ NOT NULL,
  blocked         BOOLEAN NOT NULL DEFAULT false,
  blocked_reason  TEXT,
  last_validation TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE license_keys IS 'Chaves de licença por instalação CRMGráfica 2.0';

-- 3. RLS policies
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;

-- Organization settings: apenas membros da org podem ler/escrever
CREATE POLICY "organization_settings_all" ON organization_settings
  FOR ALL USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

-- License keys: apenas admins da org podem gerenciar
CREATE POLICY "license_keys_admin_only" ON license_keys
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Trigger updated_at
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_organization_settings_updated ON organization_settings;
CREATE TRIGGER trg_organization_settings_updated
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_license_keys_updated ON license_keys;
CREATE TRIGGER trg_license_keys_updated
  BEFORE UPDATE ON license_keys
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
