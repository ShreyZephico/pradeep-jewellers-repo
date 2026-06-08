import type { Product, ProductOption, ProductSizeOption } from "@/types/product";
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

/** Always offer three diamond grades when the product has real diamond variation. */
export const STANDARD_DIAMOND_QUALITIES: ProductOption[] = [
  { label: "IJ-SI" },
  { label: "GH-VS" },
  { label: "EF-VVS" },
];

function normalizeDiamondLabel(label: string): string {
  return label.trim().toUpperCase().replace(/\s+/g, "");
}

function metalPickerCount(product: Product): number {
  return product.metalOptions?.filter((option) => !isKaratLabel(option.label)).length ?? 0;
}

export function getProductVariantCount(product: Product): number {
  return product.variantCount ?? product.variants?.length ?? 0;
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

function productMarketingMentionsDiamond(product: Product): boolean {
  const haystack = [
    product.name,
    product.description,
    product.shortDescription,
    product.productType,
    ...(product.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /diamond|solitaire|gemstone|vvs|stud/i.test(haystack);
}

/** When to show IJ-SI / GH-VS / EF-VVS in the customize modal. */
export function productShouldOfferDiamondPicker(product: Product): boolean {
  const shopifyDiamondCount = product.diamondQualities?.length ?? 0;
  if (shopifyDiamondCount > 1) {
    return true;
  }

  const variantDiamonds = uniqueVariantDiamondQualities(product);
  if (variantDiamonds.length > 1) {
    return true;
  }

  const variantCount = getProductVariantCount(product);

  // Single-SKU products: never infer diamond grades from marketing copy alone.
  if (variantCount <= 1) {
    return false;
  }

  if (shopifyDiamondCount > 0 || variantDiamonds.length > 0) {
    return true;
  }

  // Multi-variant rings with metal colour choices use standard diamond grades.
  if (
    inferJewelryCategory(product) === "ring" &&
    metalPickerCount(product) > 1
  ) {
    return true;
  }

  if (productMarketingMentionsDiamond(product)) {
    return true;
  }

  return false;
}

export function getDiamondPickerOptions(product: Product): ProductOption[] {
  if (!productShouldOfferDiamondPicker(product)) {
    return [];
  }

  const fromProduct = product.diamondQualities ?? [];
  const fromVariants = uniqueVariantDiamondQualities(product).map((label) => ({
    label,
  }));

  const catalogOptions = [...fromProduct];
  for (const option of fromVariants) {
    if (
      !catalogOptions.some(
        (item) =>
          normalizeDiamondLabel(item.label) === normalizeDiamondLabel(option.label)
      )
    ) {
      catalogOptions.push(option);
    }
  }

  return STANDARD_DIAMOND_QUALITIES.map((standard) => {
    const match = catalogOptions.find(
      (option) =>
        normalizeDiamondLabel(option.label) === normalizeDiamondLabel(standard.label)
    );
    return match ? { ...match, label: standard.label } : { ...standard };
  });
}

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
  return [
    product.metalOptions,
    product.caratOptions,
    product.diamondQualities,
    product.sizeOptions,
  ].some((options) => (options?.length ?? 0) > 1);
}
