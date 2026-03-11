-- ═══════════════════════════════════════════════════════════════════════════
-- SCHEMA - Dr. Murilo do Valle Estética
-- Execute no Supabase SQL Editor antes do primeiro deploy
-- ═══════════════════════════════════════════════════════════════════════════

-- Locais de atendimento
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_default boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text DEFAULT '',
  email text DEFAULT '',
  birthdate date,
  notes text DEFAULT '',
  status text DEFAULT 'ok'
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text DEFAULT 'un',
  total_qty numeric DEFAULT 0,
  avg_cost numeric DEFAULT 0,
  min_stock numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  qty numeric NOT NULL,
  total_cost numeric NOT NULL,
  cost_per_unit numeric NOT NULL,
  supplier text DEFAULT '',
  date date NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric DEFAULT 0,
  duration integer DEFAULT 60,
  active boolean DEFAULT true,
  needs_return boolean DEFAULT false,
  return_type text DEFAULT '',
  return_days integer DEFAULT 0,
  return_note text DEFAULT ''
);

CREATE TABLE IF NOT EXISTS costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text DEFAULT 'variable',
  amount numeric NOT NULL,
  frequency text DEFAULT 'monthly',
  date date NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id),
  service_id uuid REFERENCES services(id),
  date date NOT NULL,
  time time NOT NULL,
  status text DEFAULT 'scheduled',
  sale_id uuid,
  location text DEFAULT 'Clínica',
  duration integer DEFAULT 60,
  appointment_type text DEFAULT 'consulta'
);

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id),
  service_id uuid REFERENCES services(id),
  appointment_id uuid,
  professional text DEFAULT '',
  date date NOT NULL,
  price numeric NOT NULL,
  payment_method text NOT NULL,
  card_brand text DEFAULT '',
  installments integer DEFAULT 1,
  paid_installments integer DEFAULT 1,
  credit_fee_rate numeric DEFAULT 0,
  net_amount numeric DEFAULT 0,
  location_id uuid REFERENCES locations(id),
  down_payment_amount numeric DEFAULT 0,
  down_payment_method text DEFAULT '',
  notes text DEFAULT '',
  quotation_id uuid,
  sale_services jsonb
);

CREATE TABLE IF NOT EXISTS sale_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  qty numeric DEFAULT 0,
  cost_at_sale numeric DEFAULT 0,
  session_type text DEFAULT 'initial'
);

CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id),
  appointment_id uuid REFERENCES appointments(id),
  professional text DEFAULT '',
  date date NOT NULL,
  valid_until date,
  location text DEFAULT '',
  status text DEFAULT 'pending',
  total numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total_with_discount numeric DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid REFERENCES quotations(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id),
  service_name text NOT NULL,
  price numeric NOT NULL,
  final_price numeric NOT NULL,
  note text DEFAULT '',
  sort_order integer DEFAULT 0
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users" ON locations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth users" ON patients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth users" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth users" ON stock_entries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth users" ON services FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth users" ON costs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth users" ON appointments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth users" ON sales FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth users" ON sale_products FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users" ON quotations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth users" ON quotation_items FOR ALL USING (auth.role() = 'authenticated');

-- ── Suppliers ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users" ON suppliers FOR ALL USING (auth.role() = 'authenticated');

-- ── Atendimentos ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  date date NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid NOT NULL REFERENCES attendances(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id),
  service_name text NOT NULL,
  qty_used numeric NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS attendance_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid NOT NULL REFERENCES attendances(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  qty numeric NOT NULL,
  cost_at_use numeric NOT NULL DEFAULT 0,
  note text DEFAULT ''
);

ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users" ON attendances FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth users" ON attendance_procedures FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth users" ON attendance_products FOR ALL USING (auth.role() = 'authenticated');

-- ── Tarefas ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  urgency text DEFAULT 'normal',
  due_date date,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users" ON tasks FOR ALL USING (auth.role() = 'authenticated');

-- ── Migrations (run these on existing DB) ────────────────────────────────────
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration integer DEFAULT 60;
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type text DEFAULT 'consulta';
-- ALTER TABLE sales ADD COLUMN IF NOT EXISTS quotation_id uuid;
-- ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_services jsonb;
-- Run suppliers table above if not yet created.
