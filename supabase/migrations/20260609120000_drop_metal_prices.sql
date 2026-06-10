-- Remove legacy dev.metal_prices (replaced by dev.store_metal_prices).
-- App code reads/writes store_metal_prices only.

drop table if exists dev.metal_prices cascade;
