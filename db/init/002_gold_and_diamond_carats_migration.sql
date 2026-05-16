CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.gold_carats') IS NULL
     AND to_regclass('public.carats') IS NOT NULL THEN
    ALTER TABLE public.carats RENAME TO gold_carats;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.gold_carats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  code VARCHAR(20) UNIQUE,
  price_adjustment NUMERIC(12,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.diamond_carats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  code VARCHAR(20) UNIQUE,
  carat_value NUMERIC(8,3),
  price_adjustment NUMERIC(12,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF to_regclass('public.product_gold_carats') IS NULL
     AND to_regclass('public.product_carats') IS NOT NULL THEN
    ALTER TABLE public.product_carats RENAME TO product_gold_carats;
  END IF;

  IF to_regclass('public.product_gold_carats') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'product_gold_carats'
         AND column_name = 'carat_id'
     ) THEN
    ALTER TABLE public.product_gold_carats RENAME COLUMN carat_id TO gold_carat_id;
  END IF;

  IF to_regclass('public.variants') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'variants'
         AND column_name = 'carat_id'
     ) THEN
    ALTER TABLE public.variants RENAME COLUMN carat_id TO gold_carat_id;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.product_gold_carats (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  gold_carat_id UUID NOT NULL REFERENCES public.gold_carats(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, gold_carat_id)
);

CREATE TABLE IF NOT EXISTS public.product_diamond_carats (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  diamond_carat_id UUID NOT NULL REFERENCES public.diamond_carats(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, diamond_carat_id)
);

ALTER TABLE public.variants
  ADD COLUMN IF NOT EXISTS diamond_carat_id UUID NULL;

DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  IF to_regclass('public.product_gold_carats') IS NOT NULL THEN
    FOR constraint_record IN
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = 'product_gold_carats'
        AND kcu.column_name = 'gold_carat_id'
    LOOP
      EXECUTE format(
        'ALTER TABLE public.product_gold_carats DROP CONSTRAINT IF EXISTS %I',
        constraint_record.constraint_name
      );
    END LOOP;

    ALTER TABLE public.product_gold_carats
      ADD CONSTRAINT product_gold_carats_gold_carat_id_fkey
      FOREIGN KEY (gold_carat_id)
      REFERENCES public.gold_carats(id)
      ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.variants') IS NOT NULL THEN
    FOR constraint_record IN
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = 'variants'
        AND kcu.column_name = 'gold_carat_id'
    LOOP
      EXECUTE format(
        'ALTER TABLE public.variants DROP CONSTRAINT IF EXISTS %I',
        constraint_record.constraint_name
      );
    END LOOP;

    ALTER TABLE public.variants
      ADD CONSTRAINT variants_gold_carat_id_fkey
      FOREIGN KEY (gold_carat_id)
      REFERENCES public.gold_carats(id);

    FOR constraint_record IN
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = 'variants'
        AND kcu.column_name = 'diamond_carat_id'
    LOOP
      EXECUTE format(
        'ALTER TABLE public.variants DROP CONSTRAINT IF EXISTS %I',
        constraint_record.constraint_name
      );
    END LOOP;

    ALTER TABLE public.variants
      ADD CONSTRAINT variants_diamond_carat_id_fkey
      FOREIGN KEY (diamond_carat_id)
      REFERENCES public.diamond_carats(id);
  END IF;
END $$;

COMMIT;
