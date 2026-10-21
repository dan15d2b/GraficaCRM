-- CRMGráfica 2.0 — Schema Inicial
-- Banco: PostgreSQL com Supabase

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations (gráficas)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(14) UNIQUE,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  theme_config JSONB DEFAULT '{"primary":"#2563EB","isDark":false}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users (funcionários)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'atendimento',
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- License Keys
CREATE TABLE license_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(64) UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'starter',
  modules TEXT[] NOT NULL DEFAULT ARRAY['whatsapp', 'kanban'],
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  last_validation TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients (clientes da gráfica)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  document VARCHAR(50), -- CPF/CNPJ
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders (pedidos de produção)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'prospect',
  -- Status: prospect, qualificacao,triagem,impressao,acabamento,qa,pronto,entregue
  priority INTEGER DEFAULT 0,
  due_date TIMESTAMP WITH TIME ZONE,
  total_value DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items (itens do pedido)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organizations_cnpj ON organizations(cnpj);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_license_keys_key ON license_keys(key);
CREATE INDEX idx_license_keys_organization ON license_keys(organization_id);
CREATE INDEX idx_clients_organization ON clients(organization_id);
CREATE INDEX idx_orders_organization ON orders(organization_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- RLS (Row Level Security)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own org data" ON users
  FOR SELECT USING (auth.uid()::uuid = organization_id OR role = 'admin');

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid()::uuid);

CREATE POLICY "Organization admins manage all" ON organizations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.organization_id = organizations.id AND users.id = auth.uid()::uuid AND users.role = 'admin')
  );

-- RLS policies for clients
CREATE POLICY "Users can view own org clients" ON clients
  FOR SELECT USING (auth.uid()::uuid IN (SELECT id FROM users WHERE users.organization_id = clients.organization_id));

CREATE POLICY "Users can insert own org clients" ON clients
  FOR INSERT WITH CHECK (auth.uid()::uuid IN (SELECT id FROM users WHERE users.organization_id = clients.organization_id));

CREATE POLICY "Users can update own org clients" ON clients
  FOR UPDATE USING (auth.uid()::uuid IN (SELECT id FROM users WHERE users.organization_id = clients.organization_id));

CREATE POLICY "Users can delete own org clients" ON clients
  FOR DELETE USING (auth.uid()::uuid IN (SELECT id FROM users WHERE users.organization_id = clients.organization_id));

-- RLS policies for orders
CREATE POLICY "Users can view own org orders" ON orders
  FOR SELECT USING (auth.uid()::uuid IN (SELECT id FROM users WHERE users.organization_id = orders.organization_id));

CREATE POLICY "Users can insert own org orders" ON orders
  FOR INSERT WITH CHECK (auth.uid()::uuid IN (SELECT id FROM users WHERE users.organization_id = orders.organization_id));

CREATE POLICY "Users can update own org orders" ON orders
  FOR UPDATE USING (auth.uid()::uuid IN (SELECT id FROM users WHERE users.organization_id = orders.organization_id));

CREATE POLICY "Users can delete own org orders" ON orders
  FOR DELETE USING (auth.uid()::uuid IN (SELECT id FROM users WHERE users.organization_id = orders.organization_id));

-- RLS policies for order_items
CREATE POLICY "Users can view own org order_items" ON order_items
  FOR SELECT USING (
    auth.uid()::uuid IN (
      SELECT id FROM users WHERE users.organization_id = orders.organization_id
      JOIN orders ON orders.id = order_items.order_id
    )
  );

CREATE POLICY "Users can insert own org order_items" ON order_items
  FOR INSERT WITH CHECK (
    auth.uid()::uuid IN (
      SELECT id FROM users WHERE users.organization_id = orders.organization_id
      JOIN orders ON orders.id = order_items.order_id
    )
  );

CREATE POLICY "Users can update own org order_items" ON order_items
  FOR UPDATE USING (
    auth.uid()::uuid IN (
      SELECT id FROM users WHERE users.organization_id = orders.organization_id
      JOIN orders ON orders.id = order_items.order_id
    )
  );

CREATE POLICY "Users can delete own org order_items" ON order_items
  FOR DELETE USING (
    auth.uid()::uuid IN (
      SELECT id FROM users WHERE users.organization_id = orders.organization_id
      JOIN orders ON orders.id = order_items.order_id
    )
  );

-- RLS policies for license_keys
CREATE POLICY "Admins can view license keys" ON license_keys
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::uuid AND users.role = 'admin')
  );

CREATE POLICY "Admins can manage license keys" ON license_keys
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::uuid AND users.role = 'admin')
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
