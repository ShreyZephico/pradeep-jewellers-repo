CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS price_update_jobs CASCADE;
DROP TABLE IF EXISTS catalog_file_change_logs CASCADE;
DROP TABLE IF EXISTS catalog_sync_events CASCADE;
DROP TABLE IF EXISTS catalog_sync_runs CASCADE;
DROP TABLE IF EXISTS sku CASCADE;
DROP TABLE IF EXISTS variants CASCADE;
DROP TABLE IF EXISTS product_colors CASCADE;
DROP TABLE IF EXISTS product_diamond_carats CASCADE;
DROP TABLE IF EXISTS product_gold_carats CASCADE;
DROP TABLE IF EXISTS product_diamond_qualities CASCADE;
DROP TABLE IF EXISTS product_metals CASCADE;
DROP TABLE IF EXISTS product_sizes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS colors CASCADE;
DROP TABLE IF EXISTS diamond_carats CASCADE;
DROP TABLE IF EXISTS gold_carats CASCADE;
DROP TABLE IF EXISTS diamond_qualities CASCADE;
DROP TABLE IF EXISTS metals CASCADE;
DROP TABLE IF EXISTS sizes CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS sku_counters CASCADE;

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(4) NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(50) NOT NULL UNIQUE,
  mm_value VARCHAR(50),
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE metals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) UNIQUE,
  price_adjustment NUMERIC(12,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE diamond_qualities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) UNIQUE,
  price_adjustment NUMERIC(12,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gold_carats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  code VARCHAR(20) UNIQUE,
  price_adjustment NUMERIC(12,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE diamond_carats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  code VARCHAR(20) UNIQUE,
  carat_value NUMERIC(8,3),
  price_adjustment NUMERIC(12,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) UNIQUE,
  price_adjustment NUMERIC(12,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(50) UNIQUE NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  vendor VARCHAR(100),
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  making_charge NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  compare_at_price NUMERIC(12,2),
  default_image_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  customizable BOOLEAN NOT NULL DEFAULT FALSE,
  shopify_product_id TEXT UNIQUE,
  shopify_handle VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_sizes (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_id UUID NOT NULL REFERENCES sizes(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, size_id)
);

CREATE TABLE product_metals (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  metal_id UUID NOT NULL REFERENCES metals(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, metal_id)
);

CREATE TABLE product_diamond_qualities (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  diamond_quality_id UUID NOT NULL REFERENCES diamond_qualities(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, diamond_quality_id)
);

CREATE TABLE product_gold_carats (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  gold_carat_id UUID NOT NULL REFERENCES gold_carats(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, gold_carat_id)
);

CREATE TABLE product_diamond_carats (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  diamond_carat_id UUID NOT NULL REFERENCES diamond_carats(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, diamond_carat_id)
);

CREATE TABLE product_colors (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_id UUID NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, color_id)
);

CREATE TABLE variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_id UUID REFERENCES sizes(id),
  metal_id UUID REFERENCES metals(id),
  diamond_quality_id UUID REFERENCES diamond_qualities(id),
  gold_carat_id UUID REFERENCES gold_carats(id),
  diamond_carat_id UUID REFERENCES diamond_carats(id),
  color_id UUID REFERENCES colors(id),
  option_signature TEXT NOT NULL,
  variant_name VARCHAR(255),
  price_adjustment NUMERIC(12,2) NOT NULL DEFAULT 0,
  final_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(12,2),
  stock_qty INTEGER NOT NULL DEFAULT 0,
  weight NUMERIC(10,3),
  image_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  shopify_variant_id TEXT UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_variant_signature UNIQUE (product_id, option_signature)
);

CREATE TABLE sku (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  sku_sequence INTEGER NOT NULL,
  category_code VARCHAR(4) NOT NULL,
  barcode VARCHAR(100),
  hs_code VARCHAR(50),
  unit_price NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  inventory_qty INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  warehouse_location VARCHAR(100),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  discontinued_at TIMESTAMP NULL,
  shopify_inventory_item_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_sku_variant UNIQUE (variant_id)
);

CREATE TABLE sku_counters (
  category_code VARCHAR(4) PRIMARY KEY,
  last_sequence INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE price_update_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(100) NOT NULL,
  run_time TIMESTAMP NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE catalog_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type VARCHAR(50) NOT NULL,
  source_system VARCHAR(50) NOT NULL,
  target_system VARCHAR(50) NOT NULL,
  mode VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'running',
  triggered_by VARCHAR(100),
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMPTZ NULL,
  duration_ms BIGINT,
  products_total INTEGER NOT NULL DEFAULT 0,
  products_processed INTEGER NOT NULL DEFAULT 0,
  variants_processed INTEGER NOT NULL DEFAULT 0,
  skus_processed INTEGER NOT NULL DEFAULT 0,
  inserts_count INTEGER NOT NULL DEFAULT 0,
  updates_count INTEGER NOT NULL DEFAULT 0,
  deletes_count INTEGER NOT NULL DEFAULT 0,
  skips_count INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE catalog_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id UUID NOT NULL REFERENCES catalog_sync_runs(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id TEXT,
  entity_name TEXT,
  action VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'success',
  product_id UUID NULL REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID NULL REFERENCES variants(id) ON DELETE SET NULL,
  sku_id UUID NULL REFERENCES sku(id) ON DELETE SET NULL,
  shopify_product_id TEXT,
  shopify_variant_id TEXT,
  shopify_inventory_item_id TEXT,
  message TEXT,
  old_data JSONB,
  new_data JSONB,
  error_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration_ms BIGINT
);

CREATE TABLE catalog_file_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id UUID NULL REFERENCES catalog_sync_runs(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  catalog_version INTEGER,
  file_hash_before TEXT,
  file_hash_after TEXT NOT NULL,
  products_count INTEGER NOT NULL DEFAULT 0,
  diff_summary JSONB,
  raw_snapshot JSONB,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_variants_product_id ON variants(product_id);
CREATE INDEX idx_variants_shopify_variant_id ON variants(shopify_variant_id);
CREATE INDEX idx_sku_product_id ON sku(product_id);
CREATE INDEX idx_sku_category_code_sequence ON sku(category_code, sku_sequence);
CREATE INDEX idx_catalog_sync_runs_type_started ON catalog_sync_runs(sync_type, started_at DESC);
CREATE INDEX idx_catalog_sync_events_run_created ON catalog_sync_events(sync_run_id, created_at DESC);
CREATE INDEX idx_catalog_sync_events_entity ON catalog_sync_events(entity_type, action, created_at DESC);

CREATE OR REPLACE FUNCTION prevent_sku_delete()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'SKU rows cannot be deleted. Mark them inactive or discontinued instead.';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_sku_identity_update()
RETURNS trigger AS $$
BEGIN
  IF NEW.sku <> OLD.sku THEN
    RAISE EXCEPTION 'SKU code cannot be updated.';
  END IF;

  IF NEW.sku_sequence <> OLD.sku_sequence THEN
    RAISE EXCEPTION 'SKU sequence cannot be updated.';
  END IF;

  IF NEW.category_code <> OLD.category_code THEN
    RAISE EXCEPTION 'SKU category code cannot be updated.';
  END IF;

  IF NEW.variant_id <> OLD.variant_id THEN
    RAISE EXCEPTION 'SKU variant mapping cannot be updated.';
  END IF;

  IF NEW.product_id <> OLD.product_id THEN
    RAISE EXCEPTION 'SKU product mapping cannot be updated.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_sku_delete ON sku;
DROP TRIGGER IF EXISTS trg_prevent_sku_identity_update ON sku;

CREATE TRIGGER trg_prevent_sku_delete
BEFORE DELETE ON sku
FOR EACH ROW
EXECUTE FUNCTION prevent_sku_delete();

CREATE TRIGGER trg_prevent_sku_identity_update
BEFORE UPDATE ON sku
FOR EACH ROW
EXECUTE FUNCTION prevent_sku_identity_update();
