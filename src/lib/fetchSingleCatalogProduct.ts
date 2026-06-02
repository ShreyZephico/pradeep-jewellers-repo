import { products as staticFallbackProducts } from "@/data/products";
import {
  getProductByHandle,
  getProductById,
} from "@/lib/shopify";
import type { Product } from "@/types/product";

const SHOPIFY_PRODUCT_GID_RE = /^gid:\/\/shopify\/Product\//i;

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

  try {
    const byHandle = await getProductByHandle(key);
    if (byHandle) {
      return byHandle;
    }
  } catch (error) {
    console.warn("Shopify product by handle failed, trying fallbacks:", key, error);
  }

  const staticMatch = staticFallbackProducts.find(
    (p) => p.slug === key || p.id === key || p.handle === key
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
