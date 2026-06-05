-- Coupon popup email leads (10% off making charges offer)
create table if not exists dev.coupon_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source_page text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists coupon_leads_email_idx
  on dev.coupon_leads (lower(trim(email)));

create index if not exists coupon_leads_created_at_idx
  on dev.coupon_leads (created_at desc);

grant usage on schema dev to postgres, service_role, authenticator;
grant select, insert on dev.coupon_leads to postgres, service_role;

alter table dev.coupon_leads enable row level security;

drop policy if exists coupon_leads_service_role on dev.coupon_leads;
create policy coupon_leads_service_role
  on dev.coupon_leads
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists coupon_leads_postgres on dev.coupon_leads;
create policy coupon_leads_postgres
  on dev.coupon_leads
  for all
  to postgres
  using (true)
  with check (true);
