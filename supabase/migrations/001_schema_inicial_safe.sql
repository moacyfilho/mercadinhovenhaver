-- ============================================================
-- SCHEMA INICIAL (SAFE - pode rodar mesmo se já existir)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('administrador', 'gerente', 'caixa', 'estoquista'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('dinheiro', 'pix', 'debito', 'credito', 'fiado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE sale_status AS ENUM ('aberta', 'finalizada', 'cancelada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE account_status AS ENUM ('pendente', 'pago', 'vencido'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE movement_type AS ENUM ('entrada', 'saida', 'ajuste_positivo', 'ajuste_negativo', 'inventario'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE cash_register_status AS ENUM ('aberto', 'fechado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE unit_type AS ENUM ('un', 'kg', 'g', 'l', 'ml', 'cx', 'pct', 'dz'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TABELAS
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'caixa',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_name TEXT NOT NULL,
  company_name TEXT,
  document TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  contact_name TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  document TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  birth_date DATE,
  credit_limit NUMERIC(10,2) NOT NULL DEFAULT 0,
  current_debt NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  unit unit_type NOT NULL DEFAULT 'un',
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_qty NUMERIC(10,3) NOT NULL DEFAULT 0,
  min_stock NUMERIC(10,3) NOT NULL DEFAULT 0,
  expiry_date DATE,
  description TEXT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT positive_prices CHECK (cost_price >= 0 AND sale_price >= 0)
);

-- Adicionar colunas faltantes em products (caso a tabela já exista parcialmente)
DO $$ BEGIN ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE products ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE products ADD COLUMN unit unit_type NOT NULL DEFAULT 'un'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE products ADD COLUMN sku TEXT UNIQUE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE products ADD COLUMN barcode TEXT UNIQUE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE products ADD COLUMN cost_price NUMERIC(10,2) NOT NULL DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE products ADD COLUMN sale_price NUMERIC(10,2) NOT NULL DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE products ADD COLUMN stock_qty NUMERIC(10,3) NOT NULL DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE products ADD COLUMN min_stock NUMERIC(10,3) NOT NULL DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE products ADD COLUMN expiry_date DATE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE products ADD COLUMN description TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE products ADD COLUMN image_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE products ADD COLUMN active BOOLEAN NOT NULL DEFAULT true; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE OR REPLACE VIEW products_with_margin AS
SELECT
  p.*,
  c.name AS category_name,
  b.name AS brand_name,
  CASE
    WHEN p.sale_price > 0 AND p.cost_price > 0
    THEN ROUND(((p.sale_price - p.cost_price) / p.sale_price) * 100, 2)
    ELSE 0
  END AS margin_percent,
  (p.sale_price - p.cost_price) AS margin_value,
  (p.stock_qty <= p.min_stock) AS low_stock
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id;

CREATE TABLE IF NOT EXISTS cash_registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  status cash_register_status NOT NULL DEFAULT 'aberto',
  initial_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_balance NUMERIC(10,2),
  cash_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
  pix_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
  debit_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
  credit_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_sangria NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_suprimento NUMERIC(10,2) NOT NULL DEFAULT 0,
  difference NUMERIC(10,2),
  notes TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('sangria', 'suprimento')),
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_number SERIAL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  cash_register_id UUID REFERENCES cash_registers(id),
  status sale_status NOT NULL DEFAULT 'finalizada',
  payment_method payment_method NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  surcharge NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  change_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  cancel_reason TEXT,
  cancelled_by UUID REFERENCES profiles(id),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type movement_type NOT NULL,
  quantity NUMERIC(10,3) NOT NULL,
  quantity_before NUMERIC(10,3) NOT NULL,
  quantity_after NUMERIC(10,3) NOT NULL,
  unit_cost NUMERIC(10,2),
  total_cost NUMERIC(10,2),
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts_payable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Outros',
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  paid_amount NUMERIC(10,2),
  status account_status NOT NULL DEFAULT 'pendente',
  installment_current INT,
  installment_total INT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts_receivable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  received_date DATE,
  status account_status NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Mercadinho Venha Ver',
  document TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  logo_url TEXT,
  receipt_footer TEXT DEFAULT 'Obrigado pela preferência!',
  max_discount_cashier NUMERIC(5,2) DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar colunas faltantes em store_settings
DO $$ BEGIN ALTER TABLE store_settings ADD COLUMN name TEXT NOT NULL DEFAULT 'Mercadinho Venha Ver'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE store_settings ADD COLUMN document TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE store_settings ADD COLUMN phone TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE store_settings ADD COLUMN address TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE store_settings ADD COLUMN city TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE store_settings ADD COLUMN state TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE store_settings ADD COLUMN logo_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE store_settings ADD COLUMN receipt_footer TEXT DEFAULT 'Obrigado pela preferência!'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE store_settings ADD COLUMN max_discount_cashier NUMERIC(5,2) DEFAULT 5; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

INSERT INTO store_settings (name)
SELECT 'Mercadinho Venha Ver'
WHERE NOT EXISTS (SELECT 1 FROM store_settings);

-- FUNÇÕES E TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON profiles;
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS tr_products_updated_at ON products;
CREATE TRIGGER tr_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS tr_customers_updated_at ON customers;
CREATE TRIGGER tr_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS tr_suppliers_updated_at ON suppliers;
CREATE TRIGGER tr_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS tr_ap_updated_at ON accounts_payable;
CREATE TRIGGER tr_ap_updated_at BEFORE UPDATE ON accounts_payable FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS tr_ar_updated_at ON accounts_receivable;
CREATE TRIGGER tr_ar_updated_at BEFORE UPDATE ON accounts_receivable FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'caixa')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_auth_user_created ON auth.users;
CREATE TRIGGER tr_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION process_sale_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'finalizada' AND (OLD.status IS NULL OR OLD.status != 'finalizada') THEN
    UPDATE products p
    SET stock_qty = p.stock_qty - si.quantity
    FROM sale_items si
    WHERE si.sale_id = NEW.id AND si.product_id = p.id;

    INSERT INTO stock_movements (product_id, user_id, type, quantity, quantity_before, quantity_after, unit_cost, sale_id)
    SELECT
      si.product_id,
      NEW.user_id,
      'saida',
      si.quantity,
      p.stock_qty,
      p.stock_qty - si.quantity,
      si.cost_price,
      NEW.id
    FROM sale_items si
    JOIN products p ON p.id = si.product_id
    WHERE si.sale_id = NEW.id;
  END IF;

  IF NEW.status = 'cancelada' AND OLD.status = 'finalizada' THEN
    UPDATE products p
    SET stock_qty = p.stock_qty + si.quantity
    FROM sale_items si
    WHERE si.sale_id = NEW.id AND si.product_id = p.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sale_stock ON sales;
CREATE TRIGGER tr_sale_stock
AFTER INSERT OR UPDATE ON sales
FOR EACH ROW EXECUTE FUNCTION process_sale_stock();

CREATE OR REPLACE FUNCTION update_customer_debt()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_method = 'fiado' AND NEW.status = 'finalizada' THEN
    UPDATE customers SET current_debt = current_debt + NEW.total WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sale_fiado ON sales;
CREATE TRIGGER tr_sale_fiado
AFTER INSERT ON sales
FOR EACH ROW EXECUTE FUNCTION update_customer_debt();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "authenticated_access" ON profiles FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "authenticated_access" ON products FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "authenticated_access" ON categories FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "authenticated_access" ON brands FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "authenticated_access" ON suppliers FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "authenticated_access" ON customers FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "authenticated_access" ON sales FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "authenticated_access" ON sale_items FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "authenticated_access" ON stock_movements FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "authenticated_access" ON cash_registers FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "authenticated_access" ON cash_movements FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "authenticated_access" ON accounts_payable FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "authenticated_access" ON accounts_receivable FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "authenticated_access" ON audit_logs FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "authenticated_access" ON store_settings FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_due ON accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_status ON accounts_payable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_customer ON accounts_receivable(customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status ON accounts_receivable(status);

-- SEED (só insere se não existir)
INSERT INTO categories (name)
SELECT unnest(ARRAY['Alimentos','Bebidas','Limpeza','Higiene','Frios e Laticínios','Padaria','Carnes','Hortifruti','Mercearia','Outros'])
ON CONFLICT (name) DO NOTHING;

INSERT INTO brands (name)
SELECT unnest(ARRAY['Nestlé','Unilever','P&G','Ambev','JBS','BRF','Kraft Heinz','Kellogg''s','Coca-Cola','Sem Marca'])
ON CONFLICT (name) DO NOTHING;
