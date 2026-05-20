-- Run in Supabase SQL Editor (schema: dev — same as metal_prices)
create table if not exists dev.whatsapp_broadcast_subscribers (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  phone_e164 text not null,
  source text not null default 'social_section',
  created_at timestamptz not null default now()
);

create unique index if not exists whatsapp_broadcast_subscribers_phone_e164_idx
  on dev.whatsapp_broadcast_subscribers (phone_e164);

create index if not exists whatsapp_broadcast_subscribers_created_at_idx
  on dev.whatsapp_broadcast_subscribers (created_at desc);

grant usage on schema dev to service_role;
grant select, insert on dev.whatsapp_broadcast_subscribers to service_role;

alter table dev.whatsapp_broadcast_subscribers enable row level security;

drop policy if exists whatsapp_broadcast_service_role on dev.whatsapp_broadcast_subscribers;
create policy whatsapp_broadcast_service_role
  on dev.whatsapp_broadcast_subscribers
  for all
  to service_role
  using (true)
  with check (true);
