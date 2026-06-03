-- Allowlist for /metal-prices (schema: dev)
create table if not exists dev.access_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  mobile text not null,
  created_at timestamptz not null default now(),
  constraint access_users_email_lower unique (email),
  constraint access_users_mobile_unique unique (mobile)
);

create index if not exists access_users_email_idx on dev.access_users (lower(email));
create index if not exists access_users_mobile_idx on dev.access_users (mobile);

grant usage on schema dev to postgres, service_role, authenticator;
grant select, insert, update, delete on dev.access_users to postgres, service_role;

alter table dev.access_users enable row level security;

drop policy if exists access_users_service_role on dev.access_users;
create policy access_users_service_role
  on dev.access_users
  for all
  to service_role
  using (true)
  with check (true);

-- Test user (run once; safe to re-run)
insert into dev.access_users (name, email, mobile)
values (
  'shrey',
  'shreyshahworld@gmail.com',
  '8866873390'
)
on conflict (email) do update
set name = excluded.name,
    mobile = excluded.mobile;
