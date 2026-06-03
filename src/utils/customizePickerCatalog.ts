import type { Product, ProductOption, ProductSizeOption } from "@/types/product";
import { isKaratLabel } from "@/utils/karat";
import {
  filterSizeOptionsForProduct,
  inferJewelryCategory,
} from "@/utils/productCustomizationLabels";

/** Standard ring sizes shown in the customize modal (5–12). */
export const STANDARD_RING_SIZES = [
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
] as const;

/** Always offer three diamond grades when the product has any diamond option. */
export const STANDARD_DIAMOND_QUALITIES: ProductOption[] = [
  { label: "IJ-SI" },
  { label: "GH-VS" },
  { label: "EF-VVS" },
];

export function isStandardRingSize(size: string): boolean {
  const value = size.trim();
  return (STANDARD_RING_SIZES as readonly string[]).includes(value);
}

function normalizeDiamondLabel(label: string): string {
  return label.trim().toUpperCase().replace(/\s+/g, "");
}

function metalPickerCount(product: Product): number {
  return product.metalOptions?.filter((option) => !isKaratLabel(option.label)).length ?? 0;
}

/** When to show IJ-SI / GH-VS / EF-VVS in the customize modal. */
export function productShouldOfferDiamondPicker(product: Product): boolean {
  if ((product.diamondQualities?.length ?? 0) > 0) {
    return true;
  }

  if (product.variants?.some((variant) => variant.diamondQuality?.trim())) {
    return true;
  }

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

  if (/diamond|solitaire|gemstone|vvs|stud/i.test(haystack)) {
    return true;
  }

  // Full ring customize flow (metal colours + sizes 5–12) always includes diamond grade.
  if (
    inferJewelryCategory(product) === "ring" &&
    metalPickerCount(product) > 0 &&
    STANDARD_RING_SIZES.length > 0
  ) {
    return true;
  }

  return false;
}

export function getDiamondPickerOptions(product: Product): ProductOption[] {
  if (!productShouldOfferDiamondPicker(product)) {
    return [];
  }

  const fromProduct = product.diamondQualities ?? [];
  const fromVariants = [
    ...new Set(
      (product.variants ?? [])
        .map((variant) => variant.diamondQuality?.trim())
        .filter((value): value is string => Boolean(value))
    ),
  ].map((label) => ({ label }));

  const catalogOptions = [...fromProduct];
  for (const option of fromVariants) {
    if (!catalogOptions.some((item) => normalizeDiamondLabel(item.label) === normalizeDiamondLabel(option.label))) {
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
  if (inferJewelryCategory(product) === "ring") {
    return STANDARD_RING_SIZES.map((size) => ({ size }));
  }

  return filterSizeOptionsForProduct(product, product.sizeOptions ?? []);
}
