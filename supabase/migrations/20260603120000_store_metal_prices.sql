-- Manual store rates (admin /metal-prices) — used site-wide
create table if not exists dev.store_metal_prices (
  id uuid primary key default gen_random_uuid(),
  metal text not null,
  purity_label text not null,
  unit text not null,
  price numeric not null check (price > 0),
  created_at timestamptz not null default now(),
  created_by_email text,
  created_by_mobile text,
  source text not null default 'manual'
);

create index if not exists store_metal_prices_lookup_idx
  on dev.store_metal_prices (metal, purity_label, unit, created_at desc);

grant usage on schema dev to postgres, service_role, authenticator;
grant select, insert on dev.store_metal_prices to postgres, service_role;
grant select on dev.store_metal_prices to anon, authenticated;

alter table dev.store_metal_prices enable row level security;

drop policy if exists store_metal_prices_service_role on dev.store_metal_prices;
create policy store_metal_prices_service_role
  on dev.store_metal_prices
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists store_metal_prices_postgres on dev.store_metal_prices;
create policy store_metal_prices_postgres
  on dev.store_metal_prices
  for all
  to postgres
  using (true)
  with check (true);
