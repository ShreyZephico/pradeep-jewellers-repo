import fs from "node:fs";
import { Pool } from "pg";
import {
  completeSyncRun,
  createSyncRun,
  ensureLoggingTables,
  logSyncEvent,
} from "./lib/catalog-sync-logger.mjs";
import {
  getShopifyAdminToken,
  getShopifyStoreDomain,
  getShopifyStorefrontApiVersion,
} from "./lib/shopify-env.mjs";

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

const domain = getShopifyStoreDomain();
const adminToken = getShopifyAdminToken();
const apiVersion = getShopifyStorefrontApiVersion();
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://zephico:zephico_password@localhost:5435/zephico_jewels";

if (!domain || !adminToken) {
  console.error(
    "Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN in env."
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function shopifyAdminFetch(query, variables = {}) {
  const response = await fetch(
    `https://${domain}/admin/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": adminToken,
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new Error(JSON.stringify(json.errors ?? json, null, 2));
  }

  return json.data;
}

const PRODUCTS_QUERY = `
  query Products($cursor: String) {
    products(first: 100, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        handle
      }
    }
  }
`;

const PRODUCT_VARIANTS_QUERY = `
  query ProductVariants($id: ID!, $cursor: String) {
    product(id: $id) {
      variants(first: 250, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          inventoryItem {
            id
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

function buildShopifyOptionSignatureFromSelection(selectedOptions) {
  return selectedOptions
    .map((option) => `${option.name}:${option.value}`)
    .join("|");
}

function buildDbShopifySignature(variant) {
  return [
    `Size:${variant.sizeLabel}`,
    `Metal:${variant.caratName} ${variant.metalName}`,
    `Diamond Quality:${variant.diamondName}`,
  ].join("|");
}

async function fetchAllShopifyProducts() {
  const products = [];
  let cursor;

  do {
    const data = await shopifyAdminFetch(PRODUCTS_QUERY, { cursor });
    products.push(...data.products.nodes);
    cursor = data.products.pageInfo.hasNextPage
      ? data.products.pageInfo.endCursor
      : null;
  } while (cursor);

  return products;
}

async function fetchShopifyVariants(productId) {
  const variants = [];
  let cursor;

  do {
    const data = await shopifyAdminFetch(PRODUCT_VARIANTS_QUERY, {
      id: productId,
      cursor,
    });
    const connection = data.product?.variants;

    if (!connection) {
      break;
    }

    variants.push(...connection.nodes);
    cursor = connection.pageInfo.hasNextPage
      ? connection.pageInfo.endCursor
      : null;
  } while (cursor);

  return variants;
}

async function getDatabaseCatalog() {
  const { rows } = await pool.query(
    `SELECT
      product.id AS product_id,
      product.slug,
      product.name AS product_name,
      variant.id AS variant_id,
      size.label AS size_label,
      metal.name AS metal_name,
      diamond.name AS diamond_name,
      carat.name AS carat_name
    FROM products product
    LEFT JOIN variants variant ON variant.product_id = product.id
    LEFT JOIN sizes size ON size.id = variant.size_id
    LEFT JOIN metals metal ON metal.id = variant.metal_id
    LEFT JOIN diamond_qualities diamond ON diamond.id = variant.diamond_quality_id
    LEFT JOIN gold_carats carat ON carat.id = variant.gold_carat_id
    ORDER BY product.slug ASC`
  );
  const products = new Map();

  for (const row of rows) {
    if (!products.has(row.slug)) {
      products.set(row.slug, {
        productId: row.product_id,
        name: row.product_name,
        variants: new Map(),
      });
    }

    if (!row.variant_id) {
      continue;
    }

    const signature = buildDbShopifySignature({
      sizeLabel: row.size_label,
      metalName: row.metal_name,
      diamondName: row.diamond_name,
      caratName: row.carat_name,
    });

    products.get(row.slug).variants.set(signature, {
      variantId: row.variant_id,
    });
  }

  return products;
}

async function main() {
  await ensureLoggingTables(pool);
  const dbCatalog = await getDatabaseCatalog();
  const shopifyProducts = await fetchAllShopifyProducts();
  const syncRun = await createSyncRun(pool, {
    syncType: "shopify_to_db",
    sourceSystem: "shopify",
    targetSystem: "postgres",
    mode: "reconcile",
    productsTotal: shopifyProducts.length,
    notes: "Reconcile Shopify IDs back into Postgres",
  });
  let matchedProducts = 0;
  let matchedVariants = 0;
  let updatesCount = 0;

  try {
    for (const shopifyProduct of shopifyProducts) {
      const dbProduct = dbCatalog.get(shopifyProduct.handle);

      if (!dbProduct) {
        continue;
      }

      matchedProducts += 1;
      await pool.query(
        `UPDATE products
         SET shopify_product_id = $2,
             shopify_handle = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [dbProduct.productId, shopifyProduct.id, shopifyProduct.handle]
      );
      updatesCount += 1;
      await logSyncEvent(pool, {
        syncRunId: syncRun.id,
        entityType: "product",
        entityId: dbProduct.productId,
        entityName: dbProduct.name,
        action: "update",
        status: "success",
        productId: dbProduct.productId,
        shopifyProductId: shopifyProduct.id,
        message: "Updated DB product with Shopify product mapping",
        newData: { handle: shopifyProduct.handle },
      });

      const shopifyVariants = await fetchShopifyVariants(shopifyProduct.id);

      for (const shopifyVariant of shopifyVariants) {
        const signature = buildShopifyOptionSignatureFromSelection(
          shopifyVariant.selectedOptions
        );
        const dbVariant = dbProduct.variants.get(signature);

        if (!dbVariant) {
          continue;
        }

        matchedVariants += 1;

        await pool.query(
          `UPDATE variants
           SET shopify_variant_id = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [dbVariant.variantId, shopifyVariant.id]
        );

        await pool.query(
          `UPDATE sku
           SET shopify_inventory_item_id = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE variant_id = $1`,
          [dbVariant.variantId, shopifyVariant.inventoryItem?.id ?? null]
        );
        updatesCount += 2;
        await logSyncEvent(pool, {
          syncRunId: syncRun.id,
          entityType: "variant",
          entityId: dbVariant.variantId,
          action: "update",
          status: "success",
          variantId: dbVariant.variantId,
          shopifyProductId: shopifyProduct.id,
          shopifyVariantId: shopifyVariant.id,
          shopifyInventoryItemId: shopifyVariant.inventoryItem?.id ?? null,
          message: "Updated DB variant and SKU with Shopify mappings",
        });
      }
    }
    await completeSyncRun(pool, syncRun.id, {
      status: "success",
      productsProcessed: matchedProducts,
      variantsProcessed: matchedVariants,
      skusProcessed: matchedVariants,
      updatesCount,
    });
  } catch (error) {
    await logSyncEvent(pool, {
      syncRunId: syncRun.id,
      entityType: "run",
      action: "error",
      status: "failed",
      message: "shopify_to_db run failed",
      errorDetails: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
    await completeSyncRun(pool, syncRun.id, {
      status: "failed",
      productsProcessed: matchedProducts,
      variantsProcessed: matchedVariants,
      skusProcessed: matchedVariants,
      updatesCount,
      errorsCount: 1,
      notes: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  console.log(`Matched ${matchedProducts} Shopify products to DB.`);
  console.log(`Matched ${matchedVariants} Shopify variants to DB.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
