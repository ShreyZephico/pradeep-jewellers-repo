# Pradeep Jewellers Ecom

Headless jewellery storefront built with Next.js and Shopify, backed by a PostgreSQL catalog system for structured products, variants, SKUs, sync logging, and Shopify reconciliation.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- PostgreSQL
- Shopify Storefront API
- Shopify Admin API
- Docker

## Current Architecture

The project now uses a **database-first catalog model** for structured catalog ownership and **Shopify as the selling layer**.

High-level flow:

```text
catalog.json
↓
incremental catalog sync into Postgres
↓
DB → Shopify sync
↓
Shopify Storefront API
↓
Next.js frontend
```

The frontend reads products from Shopify. The backend catalog, SKU generation, pricing structure, and sync logs live in Postgres.

## Core Features

- Shopify-backed product listing and product modal
- Variant-aware product display
- PostgreSQL catalog schema for:
  - categories
  - sizes
  - metals
  - diamond qualities
  - carats
  - colors
  - products
  - variants
  - sku
- Category-based SKU generation
- Immutable SKU protection in the database
- Incremental JSON-driven catalog loading
- DB → Shopify product and variant sync
- Shopify → DB reconciliation sync
- Catalog sync run and event logging

## Prerequisites

- Node.js 20+
- npm
- Docker Desktop
- Shopify store
- Shopify Storefront API access token
- Shopify Admin API access token

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Required values:

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_access_token
SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_api_access_token
SHOPIFY_STOREFRONT_API_VERSION=2026-04
DATABASE_URL=postgresql://zephico:zephico_password@localhost:5435/zephico_jewels
```

Do not commit real credentials.

## Shopify Scopes

Recommended Admin API scopes for the current catalog and publication flow:

- `read_products`
- `write_products`
- `read_publications`
- `write_publications`

Optional, depending on future flows:

- `read_draft_orders`
- `write_draft_orders`
- inventory/location scopes

Storefront access should allow product, variant, and image reads.

## Database Setup

Start Postgres:

```bash
docker compose up -d
```

Default local database:

```text
Host: localhost
Port: 5435
Database: zephico_jewels
User: zephico
Password: zephico_password
```

The current schema file is:

```text
db/init/001_catalog_schema.sql
```

This file creates:

- master catalog tables
- product and assignment tables
- variants and sku tables
- sku counters
- price update job table
- sync logging tables
- SKU protection triggers

## Catalog Source

The editable catalog input file is:

```text
data/catalog.json
```

This file is the source for:

- master option data
- products
- per-product variant inputs

Important:

- `product_code` is the stable product identity
- the current incremental loader adds and updates safely
- removed entries are **not auto-deleted**
- SKU rows are **not recreated** for existing variants

## Running Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### Local development

Use `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env` or `.env.local`. Google OAuth needs `http://localhost:3000/api/auth/google/callback` in Google Cloud Console when testing login locally.

## Script Reference

### App commands

```bash
npm run dev
```

Start the Next.js development server.

```bash
npm run build
```

Build the production app.

```bash
npm run start
```

Start the production server after build.

```bash
npm run lint
```

Run ESLint.

### Catalog and database commands

```bash
npm run db:reset
```

Destroy and recreate the Docker Postgres volume.

```bash
npm run seed:catalog
```

Run the incremental JSON-driven catalog loader.

```bash
npm run catalog:sync
```

Alias for `npm run seed:catalog`.

```bash
npm run catalog:rebuild
```

Reset the database and then run the catalog sync from `data/catalog.json`.

### Shopify sync commands

```bash
npm run sync:shopify
```

Dry-run the DB → Shopify sync without changing Shopify.

```bash
npm run sync:shopify:apply
```

Apply DB → Shopify changes.

```bash
npm run sync:shopify:reset
```

Delete the Shopify catalog and rebuild it from the database. Use carefully.

```bash
npm run sync:db
```

Reconcile Shopify product, variant, and inventory mappings back into Postgres.

### Single-product Shopify sync

```bash
npm run sync:shopify -- --product=radiant-heart-diamond-ring
npm run sync:shopify:apply -- --product=radiant-heart-diamond-ring
```

## Data Model Summary

### Master tables

- `categories`
- `sizes`
- `metals`
- `diamond_qualities`
- `carats`
- `colors`

### Main tables

- `products`
- `variants`
- `sku`
- `sku_counters`

### Assignment tables

- `product_sizes`
- `product_metals`
- `product_diamond_qualities`
- `product_carats`
- `product_colors`

### Operational/logging tables

- `price_update_jobs`
- `catalog_sync_runs`
- `catalog_sync_events`
- `catalog_file_change_logs`

## SKU Rules

SKU format:

```text
SKU-{CATEGORY_CODE}-{SEQUENCE}
```

Example:

```text
SKU-RING-00001
```

Current protections:

- SKU cannot be deleted
- SKU identity fields cannot be updated
- one variant can have only one SKU
- SKU numbering is category-based
- SKU numbers are not reused

## Logging

Catalog and sync scripts now log automatically.

### `catalog_sync_runs`

Stores one row per script execution with:

- sync type
- status
- timing
- counts
- notes

### `catalog_sync_events`

Stores detailed row-level events such as:

- insert
- update
- delete
- skip
- publish
- mapping/link results

### `catalog_file_change_logs`

Stores:

- file path
- catalog version
- file hash
- product count
- raw snapshot metadata

## Frontend Data Flow

The frontend currently reads products from Shopify:

```text
Shopify Storefront API
↓
src/lib/shopify.ts
↓
Next.js page/components
```

This means catalog visibility on the storefront depends on Shopify publication, not just local DB state.

## Shopify Sync Flow

### DB → Shopify

```text
Postgres catalog
↓
scripts/sync-db-products-to-shopify.mjs
↓
Shopify Admin API
↓
publication to headless channel
```

### Shopify → DB

```text
Shopify Admin API
↓
scripts/sync-shopify-products-to-db.mjs
↓
Postgres mapping updates
```

## Important Notes

- `scripts/seed-catalog-db.mjs` is now incremental, not a destructive full reseed for day-to-day usage.
- `data/catalog.json` is the editable catalog input file.
- The current schema file is `db/init/001_catalog_schema.sql`, not the old seed SQL.
- The old `db/init/001_seed_products.sql` has been replaced by the new schema + JSON-driven catalog flow.
- Run the dry-run Shopify sync before the apply sync whenever possible.
- `sync:shopify:reset` is destructive for the Shopify catalog and should be used intentionally.

## Suggested Day-to-Day Workflow

### Change catalog data

1. Edit `data/catalog.json`
2. Run:

```bash
npm run catalog:sync
```

3. Preview Shopify changes:

```bash
npm run sync:shopify
```

4. Apply Shopify changes:

```bash
npm run sync:shopify:apply
```

### Reconcile Shopify IDs back into DB

```bash
npm run sync:db
```

## Deployment Notes

Recommended deployment split:

- Vercel for Next.js
- Shopify for storefront selling, checkout, and customer commerce
- PostgreSQL for catalog ownership and sync logging

Set the same environment variables on the deployment platform and ensure the Shopify app token has the required publication and product scopes.
