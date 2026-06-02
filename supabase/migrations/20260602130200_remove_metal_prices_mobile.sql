-- Metal prices: email-only access (remove mobile everywhere)

-- Allowlist table
alter table dev.access_users
  drop constraint if exists access_users_mobile_unique;

drop index if exists dev.access_users_mobile_idx;

alter table dev.access_users
  drop column if exists mobile;

-- Store metal prices table
alter table dev.store_metal_prices
  drop column if exists created_by_mobile;

