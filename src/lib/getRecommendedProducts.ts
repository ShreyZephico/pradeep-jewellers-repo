import { fetchSingleCatalogProduct } from "@/lib/fetchSingleCatalogProduct";
import { pickRecommendedProducts } from "@/lib/productRecommendations";
import { fetchAllShopifyProducts } from "@/lib/shopify";
import type { Product } from "@/types/product";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;
const CATALOG_MAX = 250;

export type RecommendedProductsResult = {
  products: Product[];
  sourceProductId: string;
};

export async function getRecommendedProducts(
  identifier: string,
  limit = DEFAULT_LIMIT
): Promise<RecommendedProductsResult | null> {
  const key = decodeURIComponent(identifier).trim();
  if (!key) {
    return null;
  }

  const cap = Math.max(1, Math.min(limit, MAX_LIMIT));
  const source = await fetchSingleCatalogProduct(key);
  if (!source) {
    return null;
  }

  const catalog = await fetchAllShopifyProducts({ maxProducts: CATALOG_MAX });
  const products = pickRecommendedProducts(source, catalog, cap);

  return {
    products,
    sourceProductId: source.id,
  };
}
