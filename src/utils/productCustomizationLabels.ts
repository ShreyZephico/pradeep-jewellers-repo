import productContent, { formatProductCopy } from "@/lib/productContent";
import type { Product, ProductSizeOption } from "@/types/product";

export type JewelryCategory =
  | "ring"
  | "necklace"
  | "earrings"
  | "bracelet"
  | "pendant"
  | "other";

/** Legacy cart / checkout keys still read for older line items. */
export const SIZE_ATTRIBUTE_KEYS = [
  "Ring Size",
  "Necklace Length",
  "Chain Length",
  "Size",
  "Length",
] as const;

export function inferJewelryCategory(product: Product): JewelryCategory {
  const haystack = [
    product.productType,
    product.name,
    product.slug,
    product.handle,
    ...(product.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/necklace|chain|choker|mangalsutra|haar/.test(haystack)) {
    return "necklace";
  }
  if (/earring|stud|jhumka|hoop|drop ear/.test(haystack)) {
    return "earrings";
  }
  if (/bracelet|bangle|kada|cuff/.test(haystack)) {
    return "bracelet";
  }
  if (/pendant|locket|tanmaniya/.test(haystack)) {
    return "pendant";
  }
  if (/ring|band|solitaire/.test(haystack)) {
    return "ring";
  }
  return "other";
}

/** Cart / checkout attribute key for the size picker value. */
export function getSizeAttributeKey(product: Product): string {
  const fromShopify = product.sizeOptionName?.trim();
  if (fromShopify) {
    return fromShopify;
  }

  switch (inferJewelryCategory(product)) {
    case "ring":
      return "Ring Size";
    case "necklace":
      return "Necklace Length";
    default:
      return "Size";
  }
}

/** Specifications table + UI section title for size. */
export function getSizeSpecLabel(product: Product): string {
  const fromShopify = product.sizeOptionName?.trim();
  if (fromShopify) {
    return fromShopify;
  }

  const copy = productContent.purchase;
  switch (inferJewelryCategory(product)) {
    case "ring":
      return copy.sizeOptionRing;
    case "necklace":
      return copy.sizeOptionNecklace;
    default:
      return copy.sizeOptionDefault;
  }
}

/** PRICE BREAKUP line template for size adjustments. */
export function getSizeBreakdownTemplate(product: Product): string {
  return formatProductCopy(productContent.priceBreakdown.sizeOption, {
    sizeLabel: getSizeSpecLabel(product),
  });
}

export function readSizeFromAttributes(
  attributes: { key: string; value: string }[],
  product?: Product
): string | undefined {
  if (product) {
    const key = getSizeAttributeKey(product);
    const direct = attributes.find((a) => a.key === key)?.value?.trim();
    if (direct) {
      return direct;
    }
  }

  for (const key of SIZE_ATTRIBUTE_KEYS) {
    const value = attributes.find((a) => a.key === key)?.value?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

function pickByPattern<T>(
  items: T[],
  match: (item: T) => boolean
): T | undefined {
  return items.find(match) ?? items[0];
}

/** Category-aware default size (rings → 5; necklaces → common chain length; else first). */
export function getDefaultSizeSelection(
  product: Product,
  sizes: ProductSizeOption[]
): string {
  if (!sizes.length) {
    return "";
  }

  const category = inferJewelryCategory(product);

  if (category === "ring") {
    return (
      pickByPattern(sizes, (o) => o.size === "5")?.size ??
      pickByPattern(sizes, () => true)?.size ??
      ""
    );
  }

  if (category === "necklace") {
    return (
      pickByPattern(sizes, (o) => /^(16|18)(\s*(in|inch|"))?$/i.test(o.size.trim()))
        ?.size ??
      pickByPattern(sizes, (o) => /16|18/.test(o.size))?.size ??
      pickByPattern(sizes, () => true)?.size ??
      ""
    );
  }

  return pickByPattern(sizes, () => true)?.size ?? "";
}

export function getSizeValidationMessage(product: Product): string {
  return formatProductCopy(productContent.purchase.errorSize, {
    sizeLabel: getSizeSpecLabel(product).toLowerCase(),
  });
}

/** Shopify / catalog option names that represent a size or length picker. */
export function isSizeLikeOptionName(name: string): boolean {
  const n = name.trim().toLowerCase();
  return (
    n.includes("size") ||
    n.includes("length") ||
    n.includes("chain") ||
    n.includes("circumference")
  );
}

function isLikelyRingSizeValue(size: string): boolean {
  const trimmed = size.trim();
  if (!/^\d{1,2}$/.test(trimmed)) {
    return false;
  }
  const n = Number(trimmed);
  return n >= 3 && n <= 15;
}

/** Drop ring-size values on necklaces when Shopify has no real chain lengths. */
export function filterSizeOptionsForProduct(
  product: Product,
  sizes: ProductSizeOption[]
): ProductSizeOption[] {
  if (!sizes.length) {
    return [];
  }

  if (inferJewelryCategory(product) !== "necklace") {
    return sizes;
  }

  const chainLengths = sizes.filter((option) =>
    /in|inch|"|cm|mm|centimeter/i.test(option.size)
  );
  if (chainLengths.length > 0) {
    return chainLengths;
  }

  if (sizes.every((option) => isLikelyRingSizeValue(option.size))) {
    return [];
  }

  return sizes;
}
