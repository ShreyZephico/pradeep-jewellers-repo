-- Suvarna Vridhhi scheme callback enquiries (/scheme/enquiry)
create table if not exists dev.vridhhi_enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  contact_number text not null,
  monthly_installment integer not null check (monthly_installment > 0),
  plan text not null,
  consent_agreed boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists vridhhi_enquiries_created_at_idx
  on dev.vridhhi_enquiries (created_at desc);

create index if not exists vridhhi_enquiries_contact_number_idx
  on dev.vridhhi_enquiries (contact_number);

grant usage on schema dev to postgres, service_role, authenticator;
grant select, insert on dev.vridhhi_enquiries to postgres, service_role;

alter table dev.vridhhi_enquiries enable row level security;

drop policy if exists vridhhi_enquiries_service_role on dev.vridhhi_enquiries;
create policy vridhhi_enquiries_service_role
  on dev.vridhhi_enquiries
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists vridhhi_enquiries_postgres on dev.vridhhi_enquiries;
create policy vridhhi_enquiries_postgres
  on dev.vridhhi_enquiries
  for all
  to postgres
  using (true)
  with check (true);
