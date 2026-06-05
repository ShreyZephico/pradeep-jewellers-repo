import type { Product } from "@/types/product";

export type ProductImageMetalSlug = "yellow_gold" | "white_gold" | "rose_gold";

const METAL_SLUG_ORDER: ProductImageMetalSlug[] = [
  "rose_gold",
  "white_gold",
  "yellow_gold",
];

/** Map Shopify metal label → filename token in CDN URLs. */
export function metalLabelToImageSlug(label: string): ProductImageMetalSlug | null {
  const normalized = label.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (/rose/.test(normalized)) {
    return "rose_gold";
  }
  if (/white|silver|platinum/.test(normalized)) {
    return "white_gold";
  }
  if (/yellow|gold/.test(normalized)) {
    return "yellow_gold";
  }
  return null;
}

/** Read metal token from image URL (e.g. `yellow_gold_abc.jpg`). */
export function inferImageMetalSlug(url: string): ProductImageMetalSlug | null {
  const lower = url.toLowerCase();
  for (const slug of METAL_SLUG_ORDER) {
    if (lower.includes(slug) || lower.includes(slug.replace(/_/g, "-"))) {
      return slug;
    }
  }
  return null;
}

export function mergeProductGalleryImages(product: Product): string[] {
  const list = (product.images ?? []).filter(
    (src): src is string => typeof src === "string" && src.trim().length > 0
  );
  const primary =
    typeof product.image === "string" && product.image.trim().length > 0
      ? [product.image]
      : [];
  return Array.from(new Set([...primary, ...list]));
}

/**
 * When multiple metal colours exist, show only images matching the selected metal.
 * With a single metal option, show the full gallery.
 */
export function filterGalleryImagesForMetal(
  images: string[],
  metalLabel: string,
  metalOptionCount: number
): string[] {
  if (!images.length) {
    return [];
  }

  if (metalOptionCount <= 1) {
    return images;
  }

  const targetSlug = metalLabelToImageSlug(metalLabel);
  if (!targetSlug) {
    return images;
  }

  const tagged = images.filter((url) => inferImageMetalSlug(url) != null);
  if (!tagged.length) {
    return images;
  }

  const matched = images.filter((url) => inferImageMetalSlug(url) === targetSlug);
  return matched.length > 0 ? matched : images;
}

export function getProductMetalOptionCount(product: Product): number {
  return product.metalOptions?.length ?? 0;
}

export function getGalleryImagesForMetalSelection(
  product: Product,
  metalLabel: string
): string[] {
  const merged = mergeProductGalleryImages(product);
  return filterGalleryImagesForMetal(
    merged,
    metalLabel,
    getProductMetalOptionCount(product)
  );
}
