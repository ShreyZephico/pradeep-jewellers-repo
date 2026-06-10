import type { Product, ProductImage } from "@/types/product";

export type ProductImageMetalSlug = "yellow_gold" | "white_gold" | "rose_gold";

const METAL_SLUG_ORDER: ProductImageMetalSlug[] = [
  "rose_gold",
  "white_gold",
  "yellow_gold",
];

/** Map Shopify metal label → gallery slug. */
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

/** Normalize alt text for metal detection (rose_gold, Rose-gold, roseGold, etc.). */
export function normalizeImageAltForMetal(altText: string): string {
  const withoutSource = altText.split(/\s*\[jcs-source:/i)[0]?.trim() ?? altText.trim();
  return withoutSource
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Read metal from Shopify image alt text. */
export function inferImageMetalSlugFromAlt(
  altText: string | null | undefined
): ProductImageMetalSlug | null {
  if (!altText?.trim()) {
    return null;
  }

  const normalized = normalizeImageAltForMetal(altText);
  if (!normalized) {
    return null;
  }

  if (/\brose\s*gold\b/.test(normalized) || /\brose\b/.test(normalized)) {
    return "rose_gold";
  }
  if (
    /\bwhite\s*gold\b/.test(normalized) ||
    /\bwhite\b/.test(normalized) ||
    /\bplatinum\b/.test(normalized)
  ) {
    return "white_gold";
  }
  if (/\byellow\s*gold\b/.test(normalized) || /\byellow\b/.test(normalized)) {
    return "yellow_gold";
  }
  if (/\bgold\b/.test(normalized)) {
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

/** Prefer Shopify alt text; fall back to URL filename tokens. */
export function resolveImageMetalSlug(
  url: string,
  altText?: string | null
): ProductImageMetalSlug | null {
  return inferImageMetalSlugFromAlt(altText) ?? inferImageMetalSlug(url);
}

function buildAltByUrlMap(imageDetails?: ProductImage[]): Map<string, string | null> {
  const map = new Map<string, string | null>();
  for (const item of imageDetails ?? []) {
    if (!item.url?.trim()) continue;
    map.set(item.url, item.altText ?? null);
  }
  return map;
}

export function mergeProductGalleryImages(product: Product): string[] {
  if (product.imageDetails?.length) {
    const urls = product.imageDetails
      .map((item) => item.url)
      .filter((url): url is string => typeof url === "string" && url.trim().length > 0);
    if (urls.length > 0) {
      return Array.from(new Set(urls));
    }
  }

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
 * Uses Shopify `imageDetails[].altText` first, then URL tokens.
 */
export function filterGalleryImagesForMetal(
  images: string[],
  metalLabel: string,
  metalOptionCount: number,
  imageDetails?: ProductImage[]
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

  const altByUrl = buildAltByUrlMap(imageDetails);
  const slugForUrl = (url: string) =>
    resolveImageMetalSlug(url, altByUrl.get(url));

  const tagged = images.filter((url) => slugForUrl(url) != null);
  if (!tagged.length) {
    return images;
  }

  const matched = images.filter((url) => slugForUrl(url) === targetSlug);
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
    getProductMetalOptionCount(product),
    product.imageDetails
  );
}
