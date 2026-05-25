-- ============================================================
-- Chuchu SaaS multi-tenant schema
-- Run this in Supabase SQL Editor (one time).
-- ============================================================

-- Extensions ------------------------------------------------
create extension if not exists "pgcrypto";

-- Tables ----------------------------------------------------
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  logo_url    text,
  active      boolean not null default true,
  rate_mode   text not null default 'binance',  -- binance | bcv | euro | custom
  custom_rate numeric(12,4),
  created_at  timestamptz not null default now()
);
-- For existing databases:
alter table public.companies add column if not exists active boolean not null default true;
alter table public.companies add column if not exists rate_mode text not null default 'binance';
alter table public.companies add column if not exists custom_rate numeric(12,4);
-- Subscription: trial runs TRIAL_DAYS from created_at; paid_until extends access
-- by BILLING_DAYS per validated payment (see src/lib/billing.ts).
alter table public.companies add column if not exists paid_until timestamptz;

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  emoji       text default '🏷️',
  created_at  timestamptz not null default now()
);
create index if not exists idx_categories_company on public.categories(company_id);

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  role        text not null default 'admin' check (role in ('owner','admin')),
  company_id  uuid references public.companies(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Tracks free-trial claims by hashed IP to prevent unlimited retries
-- with different emails from the same network.
create table if not exists public.trial_ip_claims (
  id                 uuid primary key default gen_random_uuid(),
  ip_hash            text not null unique,
  first_email        text,
  first_company_name text,
  company_id         uuid references public.companies(id) on delete set null,
  created_at         timestamptz not null default now()
);
create index if not exists idx_trial_ip_claims_created on public.trial_ip_claims(created_at desc);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  price       numeric(10,2) not null default 0,
  stock       int not null default 0,
  emoji       text default '🍬',
  image_url   text,
  expires_at  date,
  rate_mode   text,             -- null = inherit company; else binance|bcv|euro|custom
  custom_rate numeric(12,4),
  active      boolean not null default true,
  category_id uuid references public.categories(id) on delete set null,
  created_at  timestamptz not null default now()
);
-- For existing databases:
alter table public.products add column if not exists expires_at date;
alter table public.products add column if not exists rate_mode text;
alter table public.products add column if not exists custom_rate numeric(12,4);
alter table public.products add column if not exists active boolean not null default true;
alter table public.products add column if not exists category_id uuid references public.categories(id) on delete set null;

create table if not exists public.combos (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  name            text not null,
  description     text,
  price_offer     numeric(10,2) not null default 0,
  original_price  numeric(10,2) not null default 0,
  on_tv           boolean not null default false,
  created_at      timestamptz not null default now()
);

create table if not exists public.combo_items (
  combo_id    uuid not null references public.combos(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  primary key (combo_id, product_id)
);

create table if not exists public.sales (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  combo_id    uuid references public.combos(id) on delete set null,
  qty         int not null default 1,
  unit_price  numeric(10,2) not null default 0,
  sold_at     timestamptz not null default now()
);

create index if not exists idx_products_company on public.products(company_id);
create index if not exists idx_combos_company   on public.combos(company_id);
create index if not exists idx_sales_company    on public.sales(company_id);
create index if not exists idx_sales_product    on public.sales(product_id);
create index if not exists idx_sales_sold_at    on public.sales(sold_at);

-- Helper functions (security definer to avoid RLS recursion) -
create or replace function public.current_company_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_owner()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'owner')
$$;

-- Row Level Security ----------------------------------------
alter table public.companies   enable row level security;
alter table public.profiles    enable row level security;
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.combos      enable row level security;
alter table public.combo_items enable row level security;
alter table public.sales       enable row level security;

-- profiles: read own (owner reads all)
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles
  for select using (id = auth.uid() or public.is_owner());

-- companies: tenant reads own, owner reads all
drop policy if exists "companies_read" on public.companies;
create policy "companies_read" on public.companies
  for select using (id = public.current_company_id() or public.is_owner());

-- categories: tenant-scoped
drop policy if exists "categories_rw" on public.categories;
create policy "categories_rw" on public.categories
  for all using (company_id = public.current_company_id() or public.is_owner())
  with check (company_id = public.current_company_id() or public.is_owner());

-- generic tenant-scoped policies (products/combos/sales)
drop policy if exists "products_rw" on public.products;
create policy "products_rw" on public.products
  for all using (company_id = public.current_company_id() or public.is_owner())
  with check (company_id = public.current_company_id() or public.is_owner());

drop policy if exists "combos_rw" on public.combos;
create policy "combos_rw" on public.combos
  for all using (company_id = public.current_company_id() or public.is_owner())
  with check (company_id = public.current_company_id() or public.is_owner());

drop policy if exists "sales_rw" on public.sales;
create policy "sales_rw" on public.sales
  for all using (company_id = public.current_company_id() or public.is_owner())
  with check (company_id = public.current_company_id() or public.is_owner());

drop policy if exists "combo_items_rw" on public.combo_items;
create policy "combo_items_rw" on public.combo_items
  for all using (
    exists (select 1 from public.combos c
            where c.id = combo_id
              and (c.company_id = public.current_company_id() or public.is_owner())))
  with check (
    exists (select 1 from public.combos c
            where c.id = combo_id
              and (c.company_id = public.current_company_id() or public.is_owner())));

-- Payments (landing checkout + in-app subscription renewals) -
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid references public.companies(id) on delete set null, -- null = anonymous landing checkout
  plan         text not null,                       -- 'basic' | 'pro'
  amount_usd   numeric(10,2) not null,
  amount_bs    numeric(14,2),
  dolar_rate   numeric(12,4),
  declared_amount numeric(14,2),
  expected_amount numeric(14,2),
  expected_currency text,                           -- 'USD' | 'Bs'
  ai_is_payment boolean,
  ai_method    text,                                -- 'binance' | 'pagomovil' | 'transferencia' | 'desconocido'
  ai_amount    numeric(14,2),
  ai_currency  text,                                -- 'USD' | 'Bs' | 'desconocido'
  ai_reason    text,
  ai_method_match boolean,
  ai_amount_match boolean,
  method       text not null,                       -- 'binance' | 'pagomovil' | 'transferencia'
  reference    text,
  proof_url    text,
  buyer_name   text,
  buyer_email  text,
  buyer_phone  text,
  status       text not null default 'pending',     -- pending | validated | rejected
  created_at   timestamptz not null default now()
);
create index if not exists idx_payments_created on public.payments(created_at desc);
-- For existing databases:
alter table public.payments add column if not exists company_id uuid references public.companies(id) on delete set null;
alter table public.payments add column if not exists declared_amount numeric(14,2);
alter table public.payments add column if not exists expected_amount numeric(14,2);
alter table public.payments add column if not exists expected_currency text;
alter table public.payments add column if not exists ai_is_payment boolean;
alter table public.payments add column if not exists ai_method text;
alter table public.payments add column if not exists ai_amount numeric(14,2);
alter table public.payments add column if not exists ai_currency text;
alter table public.payments add column if not exists ai_reason text;
alter table public.payments add column if not exists ai_method_match boolean;
alter table public.payments add column if not exists ai_amount_match boolean;
create index if not exists idx_payments_company on public.payments(company_id);

alter table public.trial_ip_claims enable row level security;
drop policy if exists "trial_ip_claims_owner_read" on public.trial_ip_claims;
create policy "trial_ip_claims_owner_read" on public.trial_ip_claims
  for select using (public.is_owner());

grant all on public.trial_ip_claims to service_role;
grant select on public.trial_ip_claims to authenticated;

alter table public.payments enable row level security;
-- Only the owner can read/update. Inserts happen server-side via service role.
drop policy if exists "payments_owner_read" on public.payments;
create policy "payments_owner_read" on public.payments
  for select using (public.is_owner());

-- A tenant admin can read their own company's payments (subscription history).
drop policy if exists "payments_company_read" on public.payments;
create policy "payments_company_read" on public.payments
  for select using (company_id = public.current_company_id());
drop policy if exists "payments_owner_update" on public.payments;
create policy "payments_owner_update" on public.payments
  for update using (public.is_owner()) with check (public.is_owner());

grant all on public.payments to service_role;
grant select, update on public.payments to authenticated;

-- Storage bucket for payment proofs (public read) -----------
insert into storage.buckets (id, name, public)
values ('payments', 'payments', true)
on conflict (id) do nothing;

drop policy if exists "payments_public_read" on storage.objects;
create policy "payments_public_read" on storage.objects
  for select using (bucket_id = 'payments');

-- Storage bucket for logos (public read) --------------------
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "logos_public_read" on storage.objects;
create policy "logos_public_read" on storage.objects
  for select using (bucket_id = 'logos');

-- Storage bucket for product images (public read) -----------
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "products_public_read" on storage.objects;
create policy "products_public_read" on storage.objects
  for select using (bucket_id = 'products');

-- NOTE: logo uploads are performed server-side with the SERVICE ROLE key,
-- which bypasses RLS, so no insert policy is needed for the owner flow.

-- Table privileges (PostgREST roles) ------------------------
-- Without these the data API returns 42501 "permission denied".
-- RLS still restricts which ROWS 'authenticated' can touch.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

-- ============================================================
-- Bootstrap the OWNER account (run AFTER creating the auth user)
-- 1) In Supabase Dashboard > Authentication > Users > Add user
--    (email + password, mark "Auto Confirm").
-- 2) Copy its UUID and run:
--
--    insert into public.profiles (id, email, role)
--    values ('<AUTH_USER_UUID>', '<owner-email>', 'owner')
--    on conflict (id) do update set role = 'owner';
-- ============================================================
