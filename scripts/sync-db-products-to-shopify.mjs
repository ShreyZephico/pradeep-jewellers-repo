import fs from "node:fs";
import { Pool } from "pg";
import {
  completeSyncRun,
  createSyncRun,
  ensureLoggingTables,
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

const args = process.argv.slice(2);
const shouldApply = args.includes("--apply");
const shouldResetStore = args.includes("--reset-store");
const productFilter = args
  .find((argument) => argument.startsWith("--product="))
  ?.split("=")[1];
const domain = process.env.SHOPIFY_STORE_DOMAIN;
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-04";
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://zephico:zephico_password@localhost:5435/zephico_jewels";

if (!domain || !adminToken) {
  console.error(
    "Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN in env."
  );
  process.exit(1);
}

/** Remote Postgres often uses TLS chains Node rejects unless relaxed. Set DATABASE_SSL_REJECT_UNAUTHORIZED=true to enforce verification. */
const localhostDb =
  /(^|@)localhost[\/:]/i.test(databaseUrl) ||
  /(^|@)127\.0\.0\.1[\/:]/i.test(databaseUrl);
const strictSsl = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true";
const relaxSsl =
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false" ||
  /sslmode=no-verify/i.test(databaseUrl) ||
  (!localhostDb && !strictSsl);

function pgPoolConnectionString(url) {
  if (!relaxSsl) {
    return url;
  }
  let out = url.replace(/([?&])sslmode=[^&]*/gi, (_m, lead) => lead);
  out = out.replace(/\?&/, "?");
  if (out.endsWith("?")) {
    out = out.slice(0, -1);
  }
  return out;
}

const pool = new Pool(
  relaxSsl
    ? {
        connectionString: pgPoolConnectionString(databaseUrl),
        ssl: { rejectUnauthorized: false },
      }
    : { connectionString: databaseUrl }
);

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

const PRODUCT_SET_MUTATION = `
  mutation ProductSet(
    $identifier: ProductSetIdentifiers
    $input: ProductSetInput!
    $synchronous: Boolean!
  ) {
    productSet(
      identifier: $identifier
      input: $input
      synchronous: $synchronous
    ) {
      product {
        id
        title
        handle
      }
      productSetOperation {
        id
        status
        userErrors {
          field
          message
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const PRODUCT_MEDIA_MUTATION = `
  mutation ProductCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
    productCreateMedia(productId: $productId, media: $media) {
      media {
        alt
        mediaContentType
        status
      }
      mediaUserErrors {
        field
        message
      }
    }
  }
`;

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

const PUBLICATIONS_QUERY = `
  query Publications {
    publications(first: 50) {
      nodes {
        id
        name
      }
    }
  }
`;

const PUBLISH_MUTATION = `
  mutation PublishablePublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      publishable {
        ... on Product {
          id
        }
      }
      shop {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const PRODUCT_DELETE_MUTATION = `
  mutation ProductDelete($input: ProductDeleteInput!) {
    productDelete(input: $input) {
      deletedProductId
      userErrors {
        field
        message
      }
    }
  }
`;

function formatMoney(value) {
  return String(Number(value).toFixed(2));
}

function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildShopifyMetalLabel(caratName, metalName) {
  return `${caratName} ${metalName}`;
}

function getShopifyOptionSignature({ sizeLabel, caratName, metalName, diamondName }) {
  return [
    `Size:${sizeLabel}`,
    `Metal:${buildShopifyMetalLabel(caratName, metalName)}`,
    `Diamond Quality:${diamondName}`,
  ].join("|");
}

async function getProductsFromDatabase() {
  const params = [];
  let whereClause = "";

  if (productFilter) {
    params.push(productFilter);
    whereClause = "WHERE product.slug = $1 OR product.product_code = $1";
  }

  const { rows } = await pool.query(
    `SELECT
      product.id AS product_id,
      product.product_code,
      product.name AS product_name,
      product.slug,
      product.description,
      product.short_description,
      product.vendor,
      product.base_price,
      product.compare_at_price AS product_compare_at_price,
      product.default_image_url,
      product.status AS product_status,
      product.shopify_product_id,
      product.shopify_handle,
      category.name AS category_name,
      category.code AS category_code,
      variant.id AS variant_id,
      variant.variant_name,
      variant.option_signature,
      variant.final_price,
      variant.compare_at_price,
      variant.stock_qty,
      variant.image_url,
      variant.shopify_variant_id,
      size.label AS size_label,
      metal.name AS metal_name,
      diamond.name AS diamond_name,
      carat.name AS carat_name,
      sku.sku,
      sku.sku_sequence,
      sku.inventory_qty,
      sku.shopify_inventory_item_id
    FROM products product
    JOIN categories category ON category.id = product.category_id
    JOIN variants variant ON variant.product_id = product.id
    JOIN sizes size ON size.id = variant.size_id
    JOIN metals metal ON metal.id = variant.metal_id
    JOIN diamond_qualities diamond ON diamond.id = variant.diamond_quality_id
    JOIN gold_carats carat ON carat.id = variant.gold_carat_id
    JOIN sku ON sku.variant_id = variant.id
    ${whereClause}
    ORDER BY
      product.product_code ASC,
      sku.sku_sequence ASC`,
    params
  );
  const products = new Map();

  for (const row of rows) {
    if (!products.has(row.product_id)) {
      products.set(row.product_id, {
        id: row.product_id,
        productCode: row.product_code,
        name: row.product_name,
        slug: row.slug,
        description: row.description,
        shortDescription: row.short_description,
        vendor: row.vendor,
        basePrice: Number(row.base_price),
        compareAtPrice: Number(row.product_compare_at_price),
        defaultImageUrl: row.default_image_url,
        status: row.product_status,
        shopifyProductId: row.shopify_product_id,
        shopifyHandle: row.shopify_handle,
        categoryName: row.category_name,
        categoryCode: row.category_code,
        variants: [],
      });
    }

    products.get(row.product_id).variants.push({
      id: row.variant_id,
      variantName: row.variant_name,
      optionSignature: row.option_signature,
      finalPrice: Number(row.final_price),
      compareAtPrice: Number(row.compare_at_price),
      stockQty: Number(row.stock_qty),
      imageUrl: row.image_url,
      shopifyVariantId: row.shopify_variant_id,
      sizeLabel: row.size_label,
      metalName: row.metal_name,
      diamondName: row.diamond_name,
      caratName: row.carat_name,
      sku: row.sku,
      skuSequence: row.sku_sequence,
      inventoryQty: Number(row.inventory_qty),
      shopifyInventoryItemId: row.shopify_inventory_item_id,
    });
  }

  return [...products.values()];
}

function buildProductSetInput(product) {
  const sizeValues = [...new Set(product.variants.map((variant) => variant.sizeLabel))];
  const metalValues = [
    ...new Set(
      product.variants.map((variant) =>
        buildShopifyMetalLabel(variant.caratName, variant.metalName)
      )
    ),
  ];
  const diamondValues = [
    ...new Set(product.variants.map((variant) => variant.diamondName)),
  ];

  return {
    title: product.name,
    handle: product.slug,
    descriptionHtml: `<p>${htmlEscape(product.description)}</p>`,
    vendor: product.vendor || "Pradeep Jewellery",
    productType: product.categoryName,
    status: "ACTIVE",
    tags: ["pradeep-catalog-sync", `category-${product.categoryCode.toLowerCase()}`],
    productOptions: [
      {
        name: "Size",
        position: 1,
        values: sizeValues.map((value) => ({ name: value })),
      },
      {
        name: "Metal",
        position: 2,
        values: metalValues.map((value) => ({ name: value })),
      },
      {
        name: "Diamond Quality",
        position: 3,
        values: diamondValues.map((value) => ({ name: value })),
      },
    ],
    variants: product.variants.map((variant, index) => ({
      optionValues: [
        { optionName: "Size", name: variant.sizeLabel },
        {
          optionName: "Metal",
          name: buildShopifyMetalLabel(variant.caratName, variant.metalName),
        },
        { optionName: "Diamond Quality", name: variant.diamondName },
      ],
      price: formatMoney(variant.finalPrice),
      compareAtPrice:
        variant.compareAtPrice > 0 ? formatMoney(variant.compareAtPrice) : null,
      sku: variant.sku,
      position: index + 1,
      inventoryPolicy: "CONTINUE",
    })),
  };
}

async function fetchAllShopifyProducts() {
  const products = [];
  let cursor;

  do {
    const data = await shopifyAdminFetch(PRODUCTS_QUERY, { cursor });
    products.push(...data.products.nodes);
    cursor = data.products.pageInfo.endCursor;
  } while (cursor);

  return products;
}

async function deleteAllShopifyProducts(syncRunId) {
  const products = await fetchAllShopifyProducts();

  if (products.length === 0) {
    console.log("No Shopify products to delete.");
    return;
  }

  console.log(`Deleting ${products.length} Shopify products before reseed.`);

  for (const product of products) {
    const data = await shopifyAdminFetch(PRODUCT_DELETE_MUTATION, {
      input: { id: product.id },
    });
    const errors = data.productDelete.userErrors ?? [];

    if (errors.length > 0) {
      throw new Error(
        `Unable to delete ${product.title}: ${errors
          .map((error) => error.message)
          .join(", ")}`
      );
    }

    console.log(`  deleted ${product.title}`);
    await logSyncEvent(pool, {
      syncRunId,
      entityType: "product",
      entityId: product.id,
      entityName: product.title,
      action: "delete",
      status: "success",
      shopifyProductId: product.id,
      message: "Deleted Shopify product during reset sync",
      oldData: { handle: product.handle },
    });
  }
}

async function uploadProductImage(productId, product) {
  if (!product.defaultImageUrl) {
    return;
  }

  const data = await shopifyAdminFetch(PRODUCT_MEDIA_MUTATION, {
    productId,
    media: [
      {
        alt: product.name,
        mediaContentType: "IMAGE",
        originalSource: product.defaultImageUrl,
      },
    ],
  });
  const errors = data.productCreateMedia.mediaUserErrors ?? [];

  if (errors.length > 0) {
    console.warn(
      `  image upload skipped for ${product.name}: ${errors
        .map((error) => error.message)
        .join(", ")}`
    );
  }
}

async function fetchProductVariants(productId) {
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

let publicationIdPromise;

async function getHeadlessPublicationId() {
  if (!publicationIdPromise) {
    publicationIdPromise = (async () => {
      const data = await shopifyAdminFetch(PUBLICATIONS_QUERY);
      const publication = data.publications.nodes.find((node) =>
        /pradeep jewellery headless/i.test(node.name)
      );

      if (!publication) {
        throw new Error(
          "Could not find the Shopify publication named Pradeep Jewellery Headless."
        );
      }

      return publication.id;
    })();
  }

  return publicationIdPromise;
}

async function publishProductToHeadless(productId) {
  try {
    const publicationId = await getHeadlessPublicationId();
    const data = await shopifyAdminFetch(PUBLISH_MUTATION, {
      id: productId,
      input: [{ publicationId }],
    });
    const errors = data.publishablePublish.userErrors ?? [];

    if (errors.length > 0) {
      throw new Error(errors.map((error) => error.message).join(", "));
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to publish product to the headless Shopify channel.";

    if (
      message.includes("write_publications") ||
      message.includes("read_publications")
    ) {
      throw new Error(
        "Shopify Admin token is missing publication scopes required for headless publishing."
      );
    }

    throw error;
  }
}

async function syncProduct(product, syncRunId) {
  const input = buildProductSetInput(product);
  const identifier = product.shopifyProductId
    ? { id: product.shopifyProductId }
    : { handle: product.slug };

  console.log(
    `${shouldApply ? "Syncing" : "Dry run"}: ${product.name} (${product.variants.length} variants)`
  );
  console.log(
    `  options: Size=[${[...new Set(product.variants.map((variant) => variant.sizeLabel))].join(", ")}]; Metal=[${[
      ...new Set(
        product.variants.map((variant) =>
          buildShopifyMetalLabel(variant.caratName, variant.metalName)
        )
      ),
    ].join(", ")}]; Diamond Quality=[${[
      ...new Set(product.variants.map((variant) => variant.diamondName)),
    ].join(", ")}]`
  );

  if (!shouldApply) {
    return;
  }

  const data = await shopifyAdminFetch(PRODUCT_SET_MUTATION, {
    identifier,
    input,
    synchronous: true,
  });
  const payload = data.productSet;
  const operationErrors = payload.productSetOperation?.userErrors ?? [];
  const errors = [...payload.userErrors, ...operationErrors];

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join(", "));
  }

  if (!payload.product?.id) {
    throw new Error(`Shopify did not return a product for ${product.name}.`);
  }

  await pool.query(
    `UPDATE products
     SET shopify_product_id = $2,
         shopify_handle = $3,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [product.id, payload.product.id, payload.product.handle]
  );

  await uploadProductImage(payload.product.id, product);
  await publishProductToHeadless(payload.product.id);

  const shopifyVariants = await fetchProductVariants(payload.product.id);
  const variantMap = new Map();

  for (const shopifyVariant of shopifyVariants) {
    const signature = shopifyVariant.selectedOptions
      .map((option) => `${option.name}:${option.value}`)
      .join("|");

    variantMap.set(signature, {
      shopifyVariantId: shopifyVariant.id,
      inventoryItemId: shopifyVariant.inventoryItem?.id ?? null,
    });
  }

  for (const variant of product.variants) {
    const shopifySignature = getShopifyOptionSignature(variant);
    const match = variantMap.get(shopifySignature);

    if (!match) {
      console.warn(`  Shopify variant not found for ${variant.sku}`);
      await logSyncEvent(pool, {
        syncRunId,
        entityType: "variant",
        entityId: variant.id,
        entityName: variant.variantName,
        action: "link",
        status: "warning",
        productId: product.id,
        variantId: variant.id,
        message: `Shopify variant not found for ${variant.sku}`,
      });
      continue;
    }

    await pool.query(
      `UPDATE variants
       SET shopify_variant_id = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [variant.id, match.shopifyVariantId]
    );

    await pool.query(
      `UPDATE sku
       SET shopify_inventory_item_id = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE variant_id = $1`,
      [variant.id, match.inventoryItemId]
    );

    await logSyncEvent(pool, {
      syncRunId,
      entityType: "variant",
      entityId: variant.id,
      entityName: variant.variantName,
      action: "update",
      status: "success",
      productId: product.id,
      variantId: variant.id,
      shopifyProductId: payload.product.id,
      shopifyVariantId: match.shopifyVariantId,
      shopifyInventoryItemId: match.inventoryItemId,
      message: "Linked DB variant to Shopify variant and inventory item",
      newData: {
        sku: variant.sku,
      },
    });
  }

  await logSyncEvent(pool, {
    syncRunId,
    entityType: "product",
    entityId: product.id,
    entityName: product.name,
    action: "upsert",
    status: "success",
    productId: product.id,
    shopifyProductId: payload.product.id,
    message: "Upserted product to Shopify",
    newData: {
      handle: payload.product.handle,
      variants_count: product.variants.length,
    },
  });

  console.log(`  synced Shopify product: ${payload.product.id}`);
}

async function main() {
  await ensureLoggingTables(pool);
  const products = await getProductsFromDatabase();
  const syncRun = await createSyncRun(pool, {
    syncType: "db_to_shopify",
    sourceSystem: "postgres",
    targetSystem: "shopify",
    mode: shouldApply ? (shouldResetStore ? "reset_store" : "apply") : "dry_run",
    productsTotal: products.length,
    notes: "Sync Postgres catalog to Shopify",
  });
  const summary = {
    productsProcessed: 0,
    variantsProcessed: 0,
    skusProcessed: 0,
    insertsCount: 0,
    updatesCount: 0,
    deletesCount: 0,
    skipsCount: 0,
    errorsCount: 0,
  };

  if (products.length === 0) {
    console.log("No products found in Postgres.");
    await completeSyncRun(pool, syncRun.id, {
      status: "success",
      notes: "No products found in Postgres.",
    });
    return;
  }

  if (!shouldApply) {
    console.log("Running in dry-run mode. Add --apply to update Shopify.");
  }

  if (shouldResetStore && !productFilter) {
    if (!shouldApply) {
      console.log("Dry run: store reset skipped.");
      summary.skipsCount += 1;
    } else {
      await deleteAllShopifyProducts(syncRun.id);
      summary.deletesCount += 1;
      await pool.query(
        `UPDATE products
         SET shopify_product_id = NULL,
             shopify_handle = NULL,
             updated_at = CURRENT_TIMESTAMP`
      );
      await pool.query(
        `UPDATE variants
         SET shopify_variant_id = NULL,
             updated_at = CURRENT_TIMESTAMP`
      );
      await pool.query(
        `UPDATE sku
         SET shopify_inventory_item_id = NULL,
             updated_at = CURRENT_TIMESTAMP`
      );
    }
  }

  try {
    for (const product of products) {
      await syncProduct(product, syncRun.id);
      summary.productsProcessed += 1;
      summary.variantsProcessed += product.variants.length;
      summary.skusProcessed += product.variants.length;
      summary.updatesCount += product.variants.length + 1;
    }
    await completeSyncRun(pool, syncRun.id, {
      status: "success",
      ...summary,
    });
  } catch (error) {
    summary.errorsCount += 1;
    await logSyncEvent(pool, {
      syncRunId: syncRun.id,
      entityType: "run",
      action: "error",
      status: "failed",
      message: "db_to_shopify run failed",
      errorDetails: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
    await completeSyncRun(pool, syncRun.id, {
      status: "failed",
      ...summary,
      notes: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
