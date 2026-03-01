-- ============================================================
-- SCHEMA — Dr. Murilo do Valle Estética
-- Cole este script no SQL Editor do Supabase e execute tudo
-- ============================================================

-- Pacientes
create table patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  birthdate date,
  notes text,
  status text default 'ok',
  created_at timestamptz default now()
);

-- Produtos
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null,
  total_qty numeric default 0,
  avg_cost numeric default 0,
  min_stock numeric default 0,
  created_at timestamptz default now()
);

-- Entradas de estoque (histórico de compras)
create table stock_entries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  qty numeric not null,
  total_cost numeric not null,
  cost_per_unit numeric not null,
  supplier text,
  date date not null,
  created_at timestamptz default now()
);

-- Procedimentos
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  duration integer,
  active boolean default true,
  needs_return boolean default false,
  return_type text,
  return_days integer default 0,
  return_note text,
  created_at timestamptz default now()
);

-- Custos operacionais
create table costs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  amount numeric not null,
  frequency text not null,
  date date not null,
  created_at timestamptz default now()
);

-- Agendamentos
create table appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id),
  service_id uuid references services(id),
  date date not null,
  time text not null,
  status text default 'scheduled',
  sale_id uuid,
  created_at timestamptz default now()
);

-- Vendas
create table sales (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id),
  service_id uuid references services(id),
  appointment_id uuid references appointments(id),
  professional text,
  date date not null,
  price numeric not null,
  payment_method text not null,
  installments integer default 1,
  paid_installments integer default 1,
  credit_fee_rate numeric default 0,
  created_at timestamptz default now()
);

-- Produtos consumidos por venda
create table sale_products (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references sales(id) on delete cascade,
  product_id uuid references products(id),
  qty numeric not null,
  cost_at_sale numeric not null,
  session_type text
);

-- ── RLS (Row Level Security) ─────────────────────────────────
-- Habilita RLS em todas as tabelas
alter table patients         enable row level security;
alter table products         enable row level security;
alter table stock_entries    enable row level security;
alter table services         enable row level security;
alter table costs            enable row level security;
alter table appointments     enable row level security;
alter table sales            enable row level security;
alter table sale_products    enable row level security;

-- Políticas: apenas usuários autenticados têm acesso total
create policy "auth_only" on patients         for all using (auth.role() = 'authenticated');
create policy "auth_only" on products         for all using (auth.role() = 'authenticated');
create policy "auth_only" on stock_entries    for all using (auth.role() = 'authenticated');
create policy "auth_only" on services         for all using (auth.role() = 'authenticated');
create policy "auth_only" on costs            for all using (auth.role() = 'authenticated');
create policy "auth_only" on appointments     for all using (auth.role() = 'authenticated');
create policy "auth_only" on sales            for all using (auth.role() = 'authenticated');
create policy "auth_only" on sale_products    for all using (auth.role() = 'authenticated');
