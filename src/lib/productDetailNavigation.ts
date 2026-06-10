import {
  readProductDetailCache,
  writeProductDetailCache,
} from "@/lib/productDetailCache";
import { prefetchProductDetail } from "@/lib/productDetailPrefetch";
import {
  readListProductSnapshot,
  rememberListProduct,
} from "@/lib/productListSnapshot";
import type { Product } from "@/types/product";
import { getProductSlug } from "@/utils/productUrl";

/** Instant seed from shop/home cards — call on pointer down before navigation. */
export function seedProductDetailFromList(product: Product): void {
  const slug = getProductSlug(product);
  if (!slug) return;
  rememberListProduct(product);
  writeProductDetailCache(slug, product);
  prefetchProductDetail(slug);
}

export function resolveProductDetailSeed(
  slug: string,
  initialProduct?: Product | null
): Product | null {
  if (initialProduct) return initialProduct;
  if (typeof window === "undefined") return null;
  return (
    readProductDetailCache(slug) ??
    readListProductSnapshot(slug) ??
    null
  );
}

export function productLinkWarmHandlers(product: Product) {
  const seed = () => seedProductDetailFromList(product);
  return {
    prefetch: true as const,
    onPointerDown: seed,
    onClick: seed,
    onMouseEnter: seed,
    onFocus: seed,
  };
}
