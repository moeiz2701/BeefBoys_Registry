-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create table if not exists public.orders (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  customer_name text        not null check (length(trim(customer_name)) > 0),
  payment_method text       not null check (payment_method in ('cash', 'online')),
  items         jsonb       not null,
  total         numeric(10, 2) not null,
  received      numeric(10, 2),
  change_due    numeric(10, 2),
  served        boolean     not null default false,
  served_at     timestamptz
);

create index if not exists orders_unserved_idx
  on public.orders (created_at) where served = false;

-- The app talks to Supabase with the publishable (anon) key, so allow the
-- anon role to read, create, mark as served and delete orders.
alter table public.orders enable row level security;

drop policy if exists "orders_select" on public.orders;
drop policy if exists "orders_insert" on public.orders;
drop policy if exists "orders_update" on public.orders;
drop policy if exists "orders_delete" on public.orders;

create policy "orders_select" on public.orders
  for select to anon, authenticated using (true);
create policy "orders_insert" on public.orders
  for insert to anon, authenticated with check (true);
create policy "orders_update" on public.orders
  for update to anon, authenticated using (true) with check (true);
create policy "orders_delete" on public.orders
  for delete to anon, authenticated using (true);

-- Enable realtime so the serving page updates instantly.
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;
