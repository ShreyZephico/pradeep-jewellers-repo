import type { Product } from "@/types/product";

const CACHE_KEY_PREFIX = "pj-product-detail:v2:";
export const PRODUCT_DETAIL_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedProductEntry = {
  product: Product;
  cachedAt: number;
};

function cacheKey(slug: string): string {
  return `${CACHE_KEY_PREFIX}${slug}`;
}

export function readProductDetailCache(slug: string): Product | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(cacheKey(slug));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedProductEntry | Product;
    const parsed =
      entry && typeof entry === "object" && "product" in entry && "cachedAt" in entry
        ? (entry as CachedProductEntry).product
        : (entry as Product);
    const cachedAt =
      entry && typeof entry === "object" && "cachedAt" in entry
        ? (entry as CachedProductEntry).cachedAt
        : 0;
    if (cachedAt && Date.now() - cachedAt > PRODUCT_DETAIL_CACHE_TTL_MS) {
      sessionStorage.removeItem(cacheKey(slug));
      return null;
    }
    const handle = parsed.slug ?? parsed.handle;
    return handle === slug || parsed.id === slug ? parsed : null;
  } catch {
    return null;
  }
}

export function writeProductDetailCache(slug: string, product: Product): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedProductEntry = { product, cachedAt: Date.now() };
    sessionStorage.setItem(cacheKey(slug), JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}
