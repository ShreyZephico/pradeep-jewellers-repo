import {
  readProductDetailCache,
  writeProductDetailCache,
} from "@/lib/productDetailCache";
import { parseJsonResponse } from "@/lib/parseJsonResponse";
import type { Product } from "@/types/product";

const inflight = new Map<string, Promise<Product | null>>();

async function fetchAndCacheProduct(slug: string): Promise<Product | null> {
  const response = await fetch(`/api/product/${encodeURIComponent(slug)}`);
  const data = await parseJsonResponse<{
    success?: boolean;
    product?: Product;
  }>(response);

  if (!response.ok || !data?.success || !data.product) {
    return null;
  }

  writeProductDetailCache(slug, data.product);
  return data.product;
}

/** Warm product detail API + session cache before navigation (hover / focus). */
export function prefetchProductDetail(slug: string): void {
  const key = slug.trim();
  if (!key || typeof window === "undefined") return;
  if (readProductDetailCache(key)) return;

  if (!inflight.has(key)) {
    inflight.set(
      key,
      fetchAndCacheProduct(key).finally(() => {
        inflight.delete(key);
      })
    );
  }
}
