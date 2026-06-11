import { PLACEHOLDER_JEWELLERY } from "@/lib/placeholderImages";
import type { Product } from "@/types/product";

/** Shown when Shopify has no image or a broken local fallback path. */
export const PRODUCT_CARD_PLACEHOLDER = PLACEHOLDER_JEWELLERY;

/** Legacy demo paths from `src/data/products.ts` — not shipped in `public/`. */
export function isBrokenLocalProductImage(url: string | undefined): boolean {
  if (!url?.trim()) return true;
  return /^\/products\/ring-\d+\.png$/i.test(url.trim());
}

export function resolveProductCardImage(
  product: Pick<Product, "image" | "images">,
  imageFailed = false
): string {
  if (imageFailed) return PRODUCT_CARD_PLACEHOLDER;

  const candidates = [product.image, ...(product.images ?? [])].filter(
    (url): url is string => Boolean(url?.trim())
  );

  for (const url of candidates) {
    if (!isBrokenLocalProductImage(url)) {
      return url;
    }
  }

  return PRODUCT_CARD_PLACEHOLDER;
}
