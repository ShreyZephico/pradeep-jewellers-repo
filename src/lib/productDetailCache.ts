import type { Product } from "@/types/product";

const CACHE_KEY_PREFIX = "pj-product-detail:v2:";
export const PRODUCT_DETAIL_CACHE_TTL_MS = 5 * 60 * 1000;
export const PRODUCT_DETAIL_CACHE_EVENT = "pj-product-cache";

type CachedProductEntry = {
  product: Product;
  cachedAt: number;
};

type MemoryEntry = {
  product: Product;
  serialized: string;
  cachedAt: number;
};

const memoryBySlug = new Map<string, MemoryEntry>();

function cacheKey(slug: string): string {
  return `${CACHE_KEY_PREFIX}${slug}`;
}

function serializeProduct(product: Product): string {
  return JSON.stringify(product);
}

function isFresh(cachedAt: number): boolean {
  return !cachedAt || Date.now() - cachedAt <= PRODUCT_DETAIL_CACHE_TTL_MS;
}

export function readProductDetailCache(slug: string): Product | null {
  if (typeof window === "undefined") return null;

  const memory = memoryBySlug.get(slug);
  if (memory && isFresh(memory.cachedAt)) {
    return memory.product;
  }

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
    if (!isFresh(cachedAt)) {
      sessionStorage.removeItem(cacheKey(slug));
      memoryBySlug.delete(slug);
      return null;
    }
    const handle = parsed.slug ?? parsed.handle;
    if (handle !== slug && parsed.id !== slug) {
      return null;
    }
    const serialized = serializeProduct(parsed);
    memoryBySlug.set(slug, { product: parsed, serialized, cachedAt });
    return parsed;
  } catch {
    return null;
  }
}

export function writeProductDetailCache(slug: string, product: Product): void {
  if (typeof window === "undefined") return;

  const serialized = serializeProduct(product);
  const existing = memoryBySlug.get(slug);
  if (existing?.serialized === serialized) {
    return;
  }

  try {
    const cachedAt = Date.now();
    const payload: CachedProductEntry = { product, cachedAt };
    sessionStorage.setItem(cacheKey(slug), JSON.stringify(payload));
    memoryBySlug.set(slug, { product, serialized, cachedAt });
    window.dispatchEvent(new Event(PRODUCT_DETAIL_CACHE_EVENT));
  } catch {
    /* ignore quota / private mode */
  }
}
