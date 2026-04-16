-- Supabase schema for Stage B (RetailCRM -> Supabase sync)
-- Run in Supabase SQL Editor.

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  external_id text not null unique,
  retailcrm_id bigint,
  order_number text,
  status text,
  order_type text,
  order_method text,
  customer_first_name text,
  customer_last_name text,
  phone text,
  email text,
  total_kzt numeric(14,2) not null default 0,
  created_at timestamptz,
  updated_at timestamptz,
  synced_at timestamptz not null default now(),
  raw_payload jsonb not null
);

create index if not exists orders_created_at_idx on public.orders (created_at);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_synced_at_idx on public.orders (synced_at);
