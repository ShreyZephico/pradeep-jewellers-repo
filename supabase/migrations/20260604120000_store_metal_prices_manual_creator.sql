-- Manual-only store rates: creator email/mobile, clear legacy import rows
truncate table dev.store_metal_prices;

alter table dev.store_metal_prices
  drop column if exists created_by;

alter table dev.store_metal_prices
  add column if not exists created_by_email text,
  add column if not exists created_by_mobile text,
  add column if not exists source text not null default 'manual';

update dev.store_metal_prices set source = 'manual' where source is null;

delete from dev.store_metal_prices where source <> 'manual';
