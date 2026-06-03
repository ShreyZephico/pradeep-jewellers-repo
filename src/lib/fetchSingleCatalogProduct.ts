import { products as staticFallbackProducts } from "@/data/products";
import {
  getProductByHandle,
  getProductById,
} from "@/lib/shopify";
import type { Product } from "@/types/product";

const SHOPIFY_PRODUCT_GID_RE = /^gid:\/\/shopify\/Product\//i;
/** Catalog URLs may append a stable hash suffix after the Shopify handle. */
const TRAILING_CATALOG_HASH_RE = /-[a-f0-9]{32}$/i;

function handleLookupKeys(identifier: string): string[] {
  const keys = [identifier];
  const withoutHash = identifier.replace(TRAILING_CATALOG_HASH_RE, "");
  if (withoutHash && withoutHash !== identifier) {
    keys.push(withoutHash);
  }
  return keys;
}

/**
 * Loads one product from Shopify Storefront GraphQL (by handle or product GID), then static fallback.
 */
export async function fetchSingleCatalogProduct(
  identifier: string
): Promise<Product | null> {
  const key = decodeURIComponent(identifier).trim();
  if (!key) {
    return null;
  }

  if (SHOPIFY_PRODUCT_GID_RE.test(key)) {
    try {
      const byGid = await getProductById(key);
      if (byGid) {
        return byGid;
      }
    } catch (error) {
      console.warn("Shopify product by GID failed:", key, error);
    }
  }

  for (const handleKey of handleLookupKeys(key)) {
    try {
      const byHandle = await getProductByHandle(handleKey);
      if (byHandle) {
        return byHandle;
      }
    } catch (error) {
      console.warn(
        "Shopify product by handle failed, trying fallbacks:",
        handleKey,
        error
      );
    }
  }

  const staticMatch = staticFallbackProducts.find(
    (p) =>
      handleLookupKeys(key).some(
        (k) => p.slug === k || p.id === k || p.handle === k
      )
  );
  if (
    staticMatch &&
    (process.env.ALLOW_STATIC_PRODUCT_FALLBACK === "true" ||
      process.env.NODE_ENV === "development")
  ) {
    return staticMatch;
  }

  return null;
}
