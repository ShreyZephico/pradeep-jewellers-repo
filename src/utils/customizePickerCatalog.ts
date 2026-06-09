import type { Product, ProductOption, ProductSizeOption } from "@/types/product";
import { diamondDetailsToPickerOptions } from "@/utils/diamondDetails";
import { isKaratLabel } from "@/utils/karat";
import {
  filterSizeOptionsForProduct,
  inferJewelryCategory,
} from "@/utils/productCustomizationLabels";
import { getBangleSizePickerOptions } from "@/utils/bangleSizeChart";
import {
  getRingSizePickerOptions,
  isStandardRingSize,
  STANDARD_RING_SIZES,
} from "@/utils/ringSizeChart";

export { isStandardRingSize, STANDARD_RING_SIZES };

function normalizeOptionLabel(label: string): string {
  return label.trim().toUpperCase().replace(/\s+/g, "");
}

function mergeUniqueOptions(options: ProductOption[]): ProductOption[] {
  const merged: ProductOption[] = [];
  const seen = new Set<string>();

  for (const option of options) {
    const label = option.label?.trim();
    if (!label) {
      continue;
    }
    const key = normalizeOptionLabel(label);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push({ ...option, label });
  }

  return merged;
}

function uniqueVariantDiamondQualities(product: Product): string[] {
  return [
    ...new Set(
      (product.variants ?? [])
        .map((variant) => variant.diamondQuality?.trim())
        .filter((value): value is string => Boolean(value))
    ),
  ];
}

function diamondQualitiesFromVariants(product: Product): ProductOption[] {
  return uniqueVariantDiamondQualities(product).map((label) => ({ label }));
}

export function getProductVariantCount(product: Product): number {
  return product.variantCount ?? product.variants?.length ?? 0;
}

/** Diamond picker values from Shopify options, variant data, or diamond_details metafield only. */
export function getDiamondPickerOptions(product: Product): ProductOption[] {
  const fromShopifyOption = (product.diamondQualities ?? []).filter((option) =>
    option.label?.trim()
  );
  const fromMetafield = diamondDetailsToPickerOptions(product.diamondDetails ?? []);
  const fromVariants = diamondQualitiesFromVariants(product);

  return mergeUniqueOptions([...fromShopifyOption, ...fromVariants, ...fromMetafield]);
}

/** Rings and bangles use the built-in size charts; other types use Shopify/catalog sizes. */
export function getSizePickerOptions(product: Product): ProductSizeOption[] {
  const category = inferJewelryCategory(product);

  if (category === "ring") {
    return getRingSizePickerOptions();
  }

  if (category === "bracelet") {
    return getBangleSizePickerOptions();
  }

  return filterSizeOptionsForProduct(product, product.sizeOptions ?? []);
}

/** True when Shopify exposes more than one value on any option axis. */
export function productHasMultipleShopifyOptions(product: Product): boolean {
  const diamondCount = getDiamondPickerOptions(product).length;
  return [
    product.metalOptions,
    product.caratOptions,
    product.sizeOptions,
  ].some((options) => (options?.length ?? 0) > 1) || diamondCount > 1;
}

export function metalPickerCount(product: Product): number {
  return product.metalOptions?.filter((option) => !isKaratLabel(option.label)).length ?? 0;
}

/** @deprecated Kept for callers that checked inferred diamond UI; use getDiamondPickerOptions instead. */
export function productShouldOfferDiamondPicker(product: Product): boolean {
  return getDiamondPickerOptions(product).length > 0;
}
