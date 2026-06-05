-- Anonymous visitor geo analytics (IP → country / state / city)
create table if not exists dev.visitor_locations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  ip_address text,
  country text,
  country_code text,
  region text,
  city text,
  latitude numeric,
  longitude numeric,
  timezone text,
  source_page text not null default '/',
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists visitor_locations_created_at_idx
  on dev.visitor_locations (created_at desc);

create index if not exists visitor_locations_geo_idx
  on dev.visitor_locations (country_code, region, city);

create index if not exists visitor_locations_session_idx
  on dev.visitor_locations (session_id, created_at desc);

grant usage on schema dev to postgres, service_role, authenticator;
grant select, insert on dev.visitor_locations to postgres, service_role;

alter table dev.visitor_locations enable row level security;

drop policy if exists visitor_locations_service_role on dev.visitor_locations;
create policy visitor_locations_service_role
  on dev.visitor_locations
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists visitor_locations_postgres on dev.visitor_locations;
create policy visitor_locations_postgres
  on dev.visitor_locations
  for all
  to postgres
  using (true)
  with check (true);
