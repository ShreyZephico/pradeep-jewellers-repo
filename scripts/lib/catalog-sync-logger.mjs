import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";

export async function ensureLoggingTables(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS catalog_sync_runs (
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

    CREATE TABLE IF NOT EXISTS catalog_sync_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sync_run_id UUID NOT NULL REFERENCES catalog_sync_runs(id) ON DELETE CASCADE,
      entity_type VARCHAR(50) NOT NULL,
      entity_id TEXT,
      entity_name TEXT,
      action VARCHAR(30) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'success',
      product_id UUID NULL,
      variant_id UUID NULL,
      sku_id UUID NULL,
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

    CREATE TABLE IF NOT EXISTS catalog_file_change_logs (
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
  `);
}

export async function createSyncRun(client, payload) {
  const { rows } = await client.query(
    `INSERT INTO catalog_sync_runs (
      id, sync_type, source_system, target_system, mode, status, triggered_by,
      products_total, notes
    )
    VALUES ($1, $2, $3, $4, $5, 'running', $6, $7, $8)
    RETURNING id, started_at`,
    [
      randomUUID(),
      payload.syncType,
      payload.sourceSystem,
      payload.targetSystem,
      payload.mode,
      payload.triggeredBy ?? "manual",
      payload.productsTotal ?? 0,
      payload.notes ?? null,
    ]
  );

  return rows[0];
}

export async function logSyncEvent(client, payload) {
  await client.query(
    `INSERT INTO catalog_sync_events (
      id, sync_run_id, entity_type, entity_id, entity_name, action, status,
      product_id, variant_id, sku_id, shopify_product_id, shopify_variant_id,
      shopify_inventory_item_id, message, old_data, new_data, error_details, duration_ms
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18
    )`,
    [
      randomUUID(),
      payload.syncRunId,
      payload.entityType,
      payload.entityId ?? null,
      payload.entityName ?? null,
      payload.action,
      payload.status ?? "success",
      payload.productId ?? null,
      payload.variantId ?? null,
      payload.skuId ?? null,
      payload.shopifyProductId ?? null,
      payload.shopifyVariantId ?? null,
      payload.shopifyInventoryItemId ?? null,
      payload.message ?? null,
      payload.oldData ? JSON.stringify(payload.oldData) : null,
      payload.newData ? JSON.stringify(payload.newData) : null,
      payload.errorDetails ? JSON.stringify(payload.errorDetails) : null,
      payload.durationMs ?? null,
    ]
  );
}

export async function completeSyncRun(client, syncRunId, payload) {
  await client.query(
    `UPDATE catalog_sync_runs
     SET status = $2,
         finished_at = CURRENT_TIMESTAMP,
         duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) * 1000,
         products_processed = $3,
         variants_processed = $4,
         skus_processed = $5,
         inserts_count = $6,
         updates_count = $7,
         deletes_count = $8,
         skips_count = $9,
         errors_count = $10,
         notes = COALESCE($11, notes),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [
      syncRunId,
      payload.status,
      payload.productsProcessed ?? 0,
      payload.variantsProcessed ?? 0,
      payload.skusProcessed ?? 0,
      payload.insertsCount ?? 0,
      payload.updatesCount ?? 0,
      payload.deletesCount ?? 0,
      payload.skipsCount ?? 0,
      payload.errorsCount ?? 0,
      payload.notes ?? null,
    ]
  );
}

export function hashFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

export async function logCatalogFileChange(client, payload) {
  await client.query(
    `INSERT INTO catalog_file_change_logs (
      id, sync_run_id, file_path, catalog_version, file_hash_before, file_hash_after,
      products_count, diff_summary, raw_snapshot
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      randomUUID(),
      payload.syncRunId ?? null,
      payload.filePath,
      payload.catalogVersion ?? null,
      payload.fileHashBefore ?? null,
      payload.fileHashAfter,
      payload.productsCount ?? 0,
      payload.diffSummary ? JSON.stringify(payload.diffSummary) : null,
      payload.rawSnapshot ? JSON.stringify(payload.rawSnapshot) : null,
    ]
  );
}
