import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import {
  completeSyncRun,
  createSyncRun,
  ensureLoggingTables,
  hashFile,
  logCatalogFileChange,
  logSyncEvent,
} from "./lib/catalog-sync-logger.mjs";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!fs.existsSync(file)) {
      continue;
    }

    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separator = trimmed.indexOf("=");

      if (separator === -1) {
        continue;
      }

      const key = trimmed.slice(0, separator);
      const value = trimmed.slice(separator + 1).replace(/^['"]|['"]$/g, "");
      process.env[key] = process.env[key] ?? value;
    }
  }
}

loadEnv();

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://zephico:zephico_password@localhost:5435/zephico_jewels";
const catalogPath = path.resolve(process.cwd(), "data/catalog.json");

const pool = new Pool({ connectionString: databaseUrl });

function loadCatalog() {
  return JSON.parse(fs.readFileSync(catalogPath, "utf8"));
}

function assertExists(value, message) {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

function getCompareAtPrice(price, ratio = 1.17) {
  return Math.round(Number(price) * ratio);
}

function getStockQuantity(productIndex, sizeIndex, metalIndex, diamondIndex, caratIndex) {
  return (
    ((productIndex + 1) * 7 +
      sizeIndex * 3 +
      metalIndex * 5 +
      diamondIndex * 11 +
      caratIndex * 13) %
    16
  );
}

function getWeight(sizeIndex, metalIndex, caratIndex) {
  return Number(
    (2.15 + sizeIndex * 0.04 + metalIndex * 0.08 + caratIndex * 0.12).toFixed(3)
  );
}

function formatSku(categoryCode, sequence) {
  return `SKU-${categoryCode}-${String(sequence).padStart(5, "0")}`;
}

async function upsertCategory(client, category) {
  const { rows } = await client.query(
    `INSERT INTO categories (id, name, code, description, active)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (code) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       active = EXCLUDED.active,
       updated_at = CURRENT_TIMESTAMP
     RETURNING id, code`,
    [
      randomUUID(),
      category.name,
      category.code,
      category.description ?? null,
      category.active ?? true,
    ]
  );

  return rows[0];
}

async function upsertSize(client, size) {
  const { rows } = await client.query(
    `INSERT INTO sizes (id, label, mm_value, display_order, active)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (label) DO UPDATE SET
       mm_value = EXCLUDED.mm_value,
       display_order = EXCLUDED.display_order,
       active = EXCLUDED.active,
       updated_at = CURRENT_TIMESTAMP
     RETURNING id, label, display_order`,
    [
      randomUUID(),
      size.label,
      size.mm_value ?? null,
      size.display_order ?? 0,
      size.active ?? true,
    ]
  );

  return rows[0];
}

async function upsertOptionByCode(
  client,
  table,
  option,
  extraColumns = []
) {
  const columnNames = ["id", "name", "code", ...extraColumns, "active"];
  const values = [
    randomUUID(),
    option.name,
    option.code,
    ...extraColumns.map((column) => option[column] ?? 0),
    option.active ?? true,
  ];
  const updateSet = [
    "name = EXCLUDED.name",
    ...extraColumns.map((column) => `${column} = EXCLUDED.${column}`),
    "active = EXCLUDED.active",
    "updated_at = CURRENT_TIMESTAMP",
  ];
  const placeholders = columnNames.map((_, index) => `$${index + 1}`);
  const { rows } = await client.query(
    `INSERT INTO ${table} (${columnNames.join(", ")})
     VALUES (${placeholders.join(", ")})
     ON CONFLICT (code) DO UPDATE SET
       ${updateSet.join(", ")}
     RETURNING id, code, name`,
    values
  );

  return rows[0];
}

async function ensureSkuCounter(client, categoryCode) {
  await client.query(
    `INSERT INTO sku_counters (category_code, last_sequence)
     VALUES ($1, 0)
     ON CONFLICT (category_code) DO NOTHING`,
    [categoryCode]
  );
}

async function getNextSkuSequence(client, categoryCode) {
  await ensureSkuCounter(client, categoryCode);
  const { rows } = await client.query(
    `UPDATE sku_counters
     SET last_sequence = last_sequence + 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE category_code = $1
     RETURNING last_sequence`,
    [categoryCode]
  );

  return rows[0].last_sequence;
}

async function upsertProduct(client, product, categoryId, defaults) {
  const basePrice = Number(product.base_price);
  const makingCharge = Number(
    product.making_charge ?? defaults.making_charge ?? 15
  );
  const compareAtPrice = Number(
    product.compare_at_price ?? getCompareAtPrice(basePrice)
  );
  const { rows } = await client.query(
    `INSERT INTO products (
      id,
      product_code,
      category_id,
      name,
      slug,
      description,
      short_description,
      vendor,
      base_price,
      making_charge,
      compare_at_price,
      default_image_url,
      status,
      customizable
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    )
    ON CONFLICT (product_code) DO UPDATE SET
      category_id = EXCLUDED.category_id,
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description,
      short_description = EXCLUDED.short_description,
      vendor = EXCLUDED.vendor,
      base_price = EXCLUDED.base_price,
      making_charge = EXCLUDED.making_charge,
      compare_at_price = EXCLUDED.compare_at_price,
      default_image_url = EXCLUDED.default_image_url,
      status = EXCLUDED.status,
      customizable = EXCLUDED.customizable,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id`,
    [
      randomUUID(),
      product.product_code,
      categoryId,
      product.name,
      product.slug,
      product.description ?? null,
      product.short_description ?? null,
      product.vendor ?? defaults.vendor ?? null,
      basePrice,
      makingCharge,
      compareAtPrice,
      product.default_image_url ?? null,
      product.status ?? defaults.status ?? "active",
      product.customizable ?? defaults.customizable ?? false,
    ]
  );

  return {
    id: rows[0].id,
    basePrice,
    compareAtPrice,
    defaultImageUrl: product.default_image_url ?? null,
  };
}

async function upsertVariant(client, variant) {
  const { rows } = await client.query(
    `INSERT INTO variants (
      id,
      product_id,
      size_id,
      metal_id,
      diamond_quality_id,
      gold_carat_id,
      color_id,
      option_signature,
      variant_name,
      price_adjustment,
      final_price,
      compare_at_price,
      stock_qty,
      weight,
      image_url,
      status
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    )
    ON CONFLICT (product_id, option_signature) DO UPDATE SET
      size_id = EXCLUDED.size_id,
      metal_id = EXCLUDED.metal_id,
      diamond_quality_id = EXCLUDED.diamond_quality_id,
      gold_carat_id = EXCLUDED.gold_carat_id,
      color_id = EXCLUDED.color_id,
      variant_name = EXCLUDED.variant_name,
      price_adjustment = EXCLUDED.price_adjustment,
      final_price = EXCLUDED.final_price,
      compare_at_price = EXCLUDED.compare_at_price,
      stock_qty = EXCLUDED.stock_qty,
      weight = EXCLUDED.weight,
      image_url = EXCLUDED.image_url,
      status = EXCLUDED.status,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id`,
    [
      randomUUID(),
      variant.productId,
      variant.sizeId,
      variant.metalId,
      variant.diamondQualityId,
      variant.caratId,
      variant.colorId,
      variant.optionSignature,
      variant.variantName,
      variant.priceAdjustment,
      variant.finalPrice,
      variant.compareAtPrice,
      variant.stockQty,
      variant.weight,
      variant.imageUrl,
      variant.status,
    ]
  );

  return rows[0].id;
}

async function upsertSku(client, payload) {
  const existing = await client.query(
    `SELECT id, sku
     FROM sku
     WHERE variant_id = $1`,
    [payload.variantId]
  );

  if (existing.rows.length > 0) {
    await client.query(
      `UPDATE sku
       SET unit_price = $2,
           inventory_qty = $3,
           reorder_level = $4,
           warehouse_location = $5,
           active = $6,
           status = $7,
           discontinued_at = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE variant_id = $1`,
      [
        payload.variantId,
        payload.unitPrice,
        payload.inventoryQty,
        payload.reorderLevel,
        payload.warehouseLocation,
        payload.active,
        payload.status,
        payload.discontinuedAt,
      ]
    );

    return { action: "updated", sku: existing.rows[0].sku };
  }

  const sequence = await getNextSkuSequence(client, payload.categoryCode);
  const sku = formatSku(payload.categoryCode, sequence);

  await client.query(
    `INSERT INTO sku (
      id,
      product_id,
      variant_id,
      sku,
      sku_sequence,
      category_code,
      barcode,
      hs_code,
      unit_price,
      currency,
      inventory_qty,
      reorder_level,
      warehouse_location,
      active,
      status,
      discontinued_at,
      shopify_inventory_item_id
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, NULL, $7, $8, $9, $10, $11, $12, $13, $14, NULL, NULL
    )`,
    [
      randomUUID(),
      payload.productId,
      payload.variantId,
      sku,
      sequence,
      payload.categoryCode,
      payload.hsCode,
      payload.unitPrice,
      "INR",
      payload.inventoryQty,
      payload.reorderLevel,
      payload.warehouseLocation,
      payload.active,
      payload.status,
    ]
  );

  return { action: "inserted", sku };
}

async function main() {
  const catalog = loadCatalog();
  const client = await pool.connect();
  const fileHash = hashFile(catalogPath);

  const summary = {
    categories: 0,
    sizes: 0,
    metals: 0,
    diamondQualities: 0,
    carats: 0,
    colors: 0,
    products: 0,
    variantsInsertedOrUpdated: 0,
    skusInserted: 0,
    skusUpdated: 0,
    skips: 0,
    errors: 0,
  };
  let syncRun;

  try {
    await client.query("BEGIN");
    await ensureLoggingTables(client);
    syncRun = await createSyncRun(client, {
      syncType: "catalog_json_to_db",
      sourceSystem: "json",
      targetSystem: "postgres",
      mode: "apply",
      productsTotal: catalog.products?.length ?? 0,
      notes: "Incremental catalog load from data/catalog.json",
    });
    await logCatalogFileChange(client, {
      syncRunId: syncRun.id,
      filePath: catalogPath,
      catalogVersion: catalog.version ?? null,
      fileHashBefore: null,
      fileHashAfter: fileHash,
      productsCount: catalog.products?.length ?? 0,
      diffSummary: {
        categories: catalog.categories?.length ?? 0,
        sizes: catalog.sizes?.length ?? 0,
        metals: catalog.metals?.length ?? 0,
        diamond_qualities: catalog.diamond_qualities?.length ?? 0,
        carats: catalog.carats?.length ?? 0,
        colors: catalog.colors?.length ?? 0,
      },
      rawSnapshot: {
        version: catalog.version ?? null,
        defaults: catalog.defaults ?? {},
      },
    });

    const categoryMap = new Map();
    for (const category of catalog.categories ?? []) {
      const row = await upsertCategory(client, category);
      categoryMap.set(row.code, row.id);
      summary.categories += 1;
    }

    const sizeMap = new Map();
    const sizeOrderMap = new Map();
    for (const size of catalog.sizes ?? []) {
      const row = await upsertSize(client, size);
      sizeMap.set(row.label, row.id);
      sizeOrderMap.set(row.label, row.display_order);
      summary.sizes += 1;
    }

    const metalMap = new Map();
    const metalOrderMap = new Map();
    for (const [index, metal] of (catalog.metals ?? []).entries()) {
      const row = await upsertOptionByCode(client, "metals", metal, [
        "price_adjustment",
      ]);
      metalMap.set(row.code, {
        id: row.id,
        name: row.name,
        priceAdjustment: Number(metal.price_adjustment ?? 0),
      });
      metalOrderMap.set(row.code, index);
      summary.metals += 1;
    }

    const diamondMap = new Map();
    const diamondOrderMap = new Map();
    for (const [index, quality] of (catalog.diamond_qualities ?? []).entries()) {
      const row = await upsertOptionByCode(client, "diamond_qualities", quality, [
        "price_adjustment",
      ]);
      diamondMap.set(row.code, {
        id: row.id,
        name: row.name,
        priceAdjustment: Number(quality.price_adjustment ?? 0),
      });
      diamondOrderMap.set(row.code, index);
      summary.diamondQualities += 1;
    }

    const caratMap = new Map();
    const caratOrderMap = new Map();
    for (const [index, carat] of (catalog.carats ?? []).entries()) {
      const row = await upsertOptionByCode(client, "gold_carats", carat, [
        "price_adjustment",
      ]);
      caratMap.set(row.code, {
        id: row.id,
        name: row.name,
        priceAdjustment: Number(carat.price_adjustment ?? 0),
      });
      caratOrderMap.set(row.code, index);
      summary.carats += 1;
    }

    const colorMap = new Map();
    const colorOrderMap = new Map();
    for (const [index, color] of (catalog.colors ?? []).entries()) {
      const row = await upsertOptionByCode(client, "colors", color, [
        "price_adjustment",
      ]);
      colorMap.set(row.code, {
        id: row.id,
        name: row.name,
        priceAdjustment: Number(color.price_adjustment ?? 0),
      });
      colorOrderMap.set(row.code, index);
      summary.colors += 1;
    }

    for (const [productIndex, product] of (catalog.products ?? []).entries()) {
      const defaults = catalog.defaults ?? {};
      const categoryCode = product.category_code ?? defaults.category_code;
      const categoryId = assertExists(
        categoryMap.get(categoryCode),
        `Unknown category code ${categoryCode} for ${product.product_code}`
      );
      const productRecord = await upsertProduct(client, product, categoryId, defaults);
      summary.products += 1;
      await logSyncEvent(client, {
        syncRunId: syncRun.id,
        entityType: "product",
        entityId: product.product_code,
        entityName: product.name,
        action: "upsert",
        status: "success",
        productId: productRecord.id,
        message: "Upserted product from catalog.json",
        newData: {
          slug: product.slug,
          base_price: product.base_price,
          making_charge: product.making_charge ?? defaults.making_charge ?? 15,
        },
      });

      const sizeCodes = product.sizes ?? defaults.sizes ?? [];
      const metalCodes = product.metals ?? defaults.metals ?? [];
      const diamondCodes =
        product.diamond_qualities ?? defaults.diamond_qualities ?? [];
      const caratCodes = product.carats ?? defaults.carats ?? [];
      const colorCodes = product.colors ?? defaults.colors ?? [];

      const resolvedSizes = sizeCodes.map((label) => ({
        label,
        id: assertExists(
          sizeMap.get(label),
          `Unknown size ${label} for ${product.product_code}`
        ),
        order: sizeOrderMap.get(label) ?? 0,
      }));
      const resolvedMetals = metalCodes.map((code) => ({
        code,
        ...assertExists(
          metalMap.get(code),
          `Unknown metal ${code} for ${product.product_code}`
        ),
        order: metalOrderMap.get(code) ?? 0,
      }));
      const resolvedDiamonds = diamondCodes.map((code) => ({
        code,
        ...assertExists(
          diamondMap.get(code),
          `Unknown diamond quality ${code} for ${product.product_code}`
        ),
        order: diamondOrderMap.get(code) ?? 0,
      }));
      const resolvedCarats = caratCodes.map((code) => ({
        code,
        ...assertExists(
          caratMap.get(code),
          `Unknown carat ${code} for ${product.product_code}`
        ),
        order: caratOrderMap.get(code) ?? 0,
      }));
      const resolvedColors =
        colorCodes.length > 0
          ? colorCodes.map((code) => ({
              code,
              ...assertExists(
                colorMap.get(code),
                `Unknown color ${code} for ${product.product_code}`
              ),
              order: colorOrderMap.get(code) ?? 0,
            }))
          : [null];

      for (const size of resolvedSizes) {
        for (const metal of resolvedMetals) {
          for (const diamond of resolvedDiamonds) {
            for (const carat of resolvedCarats) {
              for (const color of resolvedColors) {
                const optionSignature = [
                  `size:${size.label}`,
                  `metal:${metal.code}`,
                  `diamond:${diamond.code}`,
                  `carat:${carat.code}`,
                  color ? `color:${color.code}` : null,
                ]
                  .filter(Boolean)
                  .join("|");
                const priceAdjustment =
                  metal.priceAdjustment +
                  diamond.priceAdjustment +
                  carat.priceAdjustment +
                  (color?.priceAdjustment ?? 0);
                const finalPrice = productRecord.basePrice + priceAdjustment;
                const compareAtPrice = Number(
                  product.compare_at_price_ratio
                    ? getCompareAtPrice(finalPrice, product.compare_at_price_ratio)
                    : getCompareAtPrice(finalPrice)
                );
                const stockQty = getStockQuantity(
                  productIndex,
                  size.order,
                  metal.order,
                  diamond.order,
                  carat.order
                );
                const weight = getWeight(size.order, metal.order, carat.order);
                const variantName = [
                  product.name,
                  `Size ${size.label}`,
                  `${carat.name} ${metal.name}`,
                  diamond.name,
                  color?.name,
                ]
                  .filter(Boolean)
                  .join(" / ");
                const variantId = await upsertVariant(client, {
                  productId: productRecord.id,
                  sizeId: size.id,
                  metalId: metal.id,
                  diamondQualityId: diamond.id,
                  caratId: carat.id,
                  colorId: color?.id ?? null,
                  optionSignature,
                  variantName,
                  priceAdjustment,
                  finalPrice,
                  compareAtPrice,
                  stockQty,
                  weight,
                  imageUrl: product.variant_image_url ?? productRecord.defaultImageUrl,
                  status: product.variant_status ?? "active",
                });
                summary.variantsInsertedOrUpdated += 1;
                await logSyncEvent(client, {
                  syncRunId: syncRun.id,
                  entityType: "variant",
                  entityId: optionSignature,
                  entityName: variantName,
                  action: "upsert",
                  status: "success",
                  productId: productRecord.id,
                  variantId,
                  message: "Upserted product variant from catalog.json",
                  newData: {
                    final_price: finalPrice,
                    stock_qty: stockQty,
                    weight,
                  },
                });

                const skuResult = await upsertSku(client, {
                  productId: productRecord.id,
                  variantId,
                  categoryCode,
                  hsCode: product.hs_code ?? "711319",
                  unitPrice: finalPrice,
                  inventoryQty: stockQty,
                  reorderLevel: product.reorder_level ?? 2,
                  warehouseLocation:
                    product.warehouse_location ??
                    `RING-A${String((productIndex % 8) + 1).padStart(2, "0")}`,
                  active: true,
                  status: "active",
                  discontinuedAt: null,
                });

                if (skuResult.action === "inserted") {
                  summary.skusInserted += 1;
                } else {
                  summary.skusUpdated += 1;
                }
                await logSyncEvent(client, {
                  syncRunId: syncRun.id,
                  entityType: "sku",
                  entityId: skuResult.sku,
                  entityName: skuResult.sku,
                  action: skuResult.action === "inserted" ? "insert" : "update",
                  status: "success",
                  productId: productRecord.id,
                  variantId,
                  message:
                    skuResult.action === "inserted"
                      ? "Created SKU for new variant"
                      : "Updated mutable SKU fields",
                  newData: {
                    sku: skuResult.sku,
                    unit_price: finalPrice,
                    inventory_qty: stockQty,
                  },
                });
              }
            }
          }
        }
      }
    }

    await completeSyncRun(client, syncRun.id, {
      status: "success",
      productsProcessed: summary.products,
      variantsProcessed: summary.variantsInsertedOrUpdated,
      skusProcessed: summary.skusInserted + summary.skusUpdated,
      insertsCount: summary.skusInserted,
      updatesCount:
        summary.skusUpdated + summary.variantsInsertedOrUpdated + summary.products,
      deletesCount: 0,
      skipsCount: summary.skips,
      errorsCount: summary.errors,
    });

    await client.query("COMMIT");

    console.log(
      `Processed ${summary.products} products from ${catalogPath}.`
    );
    console.log(
      `Upserted masters: ${summary.categories} categories, ${summary.sizes} sizes, ${summary.metals} metals, ${summary.diamondQualities} diamond qualities, ${summary.carats} carats, ${summary.colors} colors.`
    );
    console.log(
      `Processed ${summary.variantsInsertedOrUpdated} product variants.`
    );
    console.log(
      `SKU results: ${summary.skusInserted} inserted, ${summary.skusUpdated} updated.`
    );
  } catch (error) {
    summary.errors += 1;
    if (syncRun?.id) {
      try {
        await client.query("ROLLBACK");
      } catch {}
      await client.query("BEGIN");
      await ensureLoggingTables(client);
      await logSyncEvent(client, {
        syncRunId: syncRun.id,
        entityType: "run",
        action: "error",
        status: "failed",
        message: "catalog_json_to_db run failed",
        errorDetails: {
          message: error instanceof Error ? error.message : String(error),
        },
      });
      await completeSyncRun(client, syncRun.id, {
        status: "failed",
        productsProcessed: summary.products,
        variantsProcessed: summary.variantsInsertedOrUpdated,
        skusProcessed: summary.skusInserted + summary.skusUpdated,
        insertsCount: summary.skusInserted,
        updatesCount:
          summary.skusUpdated + summary.variantsInsertedOrUpdated + summary.products,
        deletesCount: 0,
        skipsCount: summary.skips,
        errorsCount: summary.errors,
        notes: error instanceof Error ? error.message : String(error),
      });
      await client.query("COMMIT");
    } else {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
