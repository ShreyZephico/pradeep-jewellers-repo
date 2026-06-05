import productContent from "@/lib/productContent";
import type { Product } from "@/types/product";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";
import { isKaratLabel, parseKaratNumber, resolveKaratFromSelection } from "@/utils/karat";
import {
  formatRingSizeOrderValue,
  getRingSizeMm,
  isStandardRingSize,
  parseStoredRingSize,
  resolveRingSizeSelection,
} from "@/utils/ringSizeChart";
import { getProductHref } from "@/utils/productUrl";
import { findBestMatchingVariant } from "@/utils/variantOptionMatch";
import {
  getDiamondPickerOptions,
  getSizePickerOptions,
} from "@/utils/customizePickerCatalog";
import {
  filterSizeOptionsForProduct,
  getDefaultSizeSelection,
  getSizeAttributeKey,
  getSizeSpecLabel,
  getSizeValidationMessage,
  inferJewelryCategory,
} from "@/utils/productCustomizationLabels";

export type CustomizationSelections = {
  metal: string;
  carat: string;
  quality: string;
  size: string;
};

export type CustomizationField = "metal" | "carat" | "diamond" | "size";

export type CustomizationValidationResult = {
  message: string;
  field: CustomizationField;
};

export type ConfirmedCustomizationSnapshot = {
  selections: CustomizationSelections;
  estimatedPrice: number;
  priceBreakdown: VariantPriceBreakdown | null;
  weightGrams: number;
  karatLabel: string | null;
  optionAdjustments: number;
  variantId: string;
  catalogVariantId?: string;
};

export function karatPickerOptions(product: Product) {
  return product.caratOptions?.length
    ? product.caratOptions
    : product.metalOptions?.every((o) => isKaratLabel(o.label))
      ? product.metalOptions
      : [];
}

export function metalPickerOptions(product: Product) {
  return product.metalOptions?.filter((o) => !isKaratLabel(o.label)) ?? [];
}

export type ProductCustomizationPickers = {
  metal: ReturnType<typeof metalPickerOptions>;
  carat: ReturnType<typeof karatPickerOptions>;
  diamond: NonNullable<Product["diamondQualities"]>;
  sizes: NonNullable<Product["sizeOptions"]>;
  showMetal: boolean;
  showCarat: boolean;
  showDiamond: boolean;
  showSize: boolean;
};

/** Only pickers that exist in catalog/Shopify and need a customer choice (>1 value). */
export function getProductCustomizationPickers(product: Product): ProductCustomizationPickers {
  const metal = metalPickerOptions(product);
  const carat = karatPickerOptions(product);
  const diamond = getDiamondPickerOptions(product);
  const sizes = getSizePickerOptions(product);

  return {
    metal,
    carat,
    diamond,
    sizes,
    showMetal: metal.length > 1,
    showCarat: carat.length > 1,
    showDiamond: diamond.length > 1,
    showSize: sizes.length > 1,
  };
}

function pickByPattern<T>(
  items: T[],
  match: (item: T) => boolean
): T | undefined {
  return items.find(match) ?? items[0];
}

/** Default customization: first/preferred values for each option Shopify provides. */
export function getDefaultProductCustomization(product: Product): CustomizationSelections {
  const pickers = getProductCustomizationPickers(product);

  const metal =
    pickers.metal.length > 0
      ? (pickByPattern(pickers.metal, (o) => /yellow/i.test(o.label))?.label ??
        pickers.metal[0]?.label ??
        "")
      : "";
  const carat =
    pickers.carat.length > 0
      ? (pickByPattern(pickers.carat, (o) => /18\s*k/i.test(o.label))?.label ??
        pickers.carat[0]?.label ??
        "")
      : "";
  const quality =
    pickers.diamond.length > 0
      ? (pickByPattern(pickers.diamond, (o) => /ij[-\s]*si/i.test(o.label))?.label ??
        pickers.diamond[0]?.label ??
        "")
      : "";
  const size =
    pickers.sizes.length > 0 ? getDefaultSizeSelection(product, pickers.sizes) : "";

  return { metal, carat, quality, size };
}

export function buildCustomizationLineAttributes(
  product: Product,
  selected: CustomizationSelections
): { key: string; value: string }[] {
  const attributes: { key: string; value: string }[] = [];
  if (selected.metal.trim()) {
    attributes.push({ key: "Metal", value: selected.metal });
  }
  if (selected.carat.trim()) {
    attributes.push({ key: "Carat", value: selected.carat });
  }
  if (selected.quality.trim()) {
    attributes.push({ key: "Diamond Quality", value: selected.quality });
  }
  if (selected.size.trim()) {
    attributes.push({
      key: getSizeAttributeKey(product),
      value: selected.size.trim(),
    });
  }
  return attributes;
}

export function resolveCustomizationOptions(
  product: Product,
  selected: CustomizationSelections
) {
  const metalOption = product.metalOptions?.find((o) => o.label === selected.metal);
  const caratOption = product.caratOptions?.find((o) => o.label === selected.carat);
  const qualityOption = getDiamondPickerOptions(product).find(
    (o) => o.label === selected.quality
  );
  const sizeOption = getSizePickerOptions(product).find(
    (o) => o.size === selected.size
  );
  const karatLabel = resolveKaratFromSelection(selected.metal, selected.carat);
  const variant = findBestMatchingVariant(product.variants, {
    metal: selected.metal,
    carat: selected.carat,
    quality: selected.quality,
    size: selected.size,
    karatLabel,
  });
  const baseWeight =
    variant?.weight ??
    product.variants?.find((v) => v.weight && v.weight > 0)?.weight ??
    5;

  return {
    metalOption: metalOption ?? null,
    caratOption: caratOption ?? null,
    qualityOption: qualityOption ?? null,
    sizeOption: sizeOption ?? null,
    karatLabel,
    variant,
    baseWeight,
  };
}

export function buildSpecRowsFromSelections(
  product: Product,
  selected: CustomizationSelections
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const metals = metalPickerOptions(product);
  const karats = karatPickerOptions(product);

  if (metals.length && selected.metal.trim()) {
    rows.push({ label: "Metal", value: selected.metal });
  }
  if (karats.length && selected.carat.trim()) {
    rows.push({ label: "Carat", value: selected.carat });
  } else if (
    selected.metal.trim() &&
    isKaratLabel(selected.metal) &&
    !rows.some((r) => r.label === "Carat")
  ) {
    rows.push({ label: "Carat", value: selected.metal });
  }
  const pickers = getProductCustomizationPickers(product);

  if (pickers.diamond.length && selected.quality.trim()) {
    rows.push({ label: "Diamond quality", value: selected.quality });
  }
  if (pickers.sizes.length && selected.size.trim()) {
    rows.push({ label: getSizeSpecLabel(product), value: selected.size });
  }

  if (rows.length > 0) {
    return rows;
  }

  return (
    product.variants?.[0]?.selectedOptions?.map((o) => ({
      label: o.name,
      value: o.value,
    })) ?? []
  );
}

/** True when Shopify/catalog exposes at least one option the customer must choose. */
export type CustomizationSummarySegmentKey = "size" | "metal" | "diamond";

export type CustomizationSummarySegment = {
  key: CustomizationSummarySegmentKey;
  label: string;
  value: string;
};

function shortenMetalColorLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed || isKaratLabel(trimmed)) {
    return "";
  }
  const named = trimmed.match(/^(yellow|white|rose)\s+gold$/i);
  if (named) {
    const word = named[1];
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
  const withoutGold = trimmed.replace(/\s*gold\s*/gi, " ").replace(/\s+/g, " ").trim();
  return withoutGold || trimmed;
}

export function formatCustomizationMetalSummary(
  selection: CustomizationSelections
): string {
  const karatRaw = resolveKaratFromSelection(selection.metal, selection.carat);
  const karatPart = karatRaw ? `${parseKaratNumber(karatRaw)} KT` : "";

  const colorPart = shortenMetalColorLabel(
    isKaratLabel(selection.metal) ? "" : selection.metal
  );

  const combined = [karatPart, colorPart].filter(Boolean).join(" ");
  if (combined) {
    return combined;
  }

  const fallback = selection.metal.trim() || selection.carat.trim();
  return fallback || "—";
}

export function formatCustomizationSizeSummary(
  product: Product,
  size: string
): string {
  const trimmed = size.trim();
  if (!trimmed) {
    return "—";
  }

  if (/\(\s*[\d.]+\s*mm\s*\)/i.test(trimmed)) {
    return trimmed;
  }

  if (inferJewelryCategory(product) === "ring") {
    const parsed = parseStoredRingSize(trimmed);
    const resolved = resolveRingSizeSelection({
      customActive: parsed.customActive,
      customInput: parsed.customInput,
      selectedSize: parsed.selectedSize,
      customInputMode: parsed.customInputMode,
    });
    if (resolved.orderValue.trim()) {
      return resolved.orderValue;
    }
    if (isStandardRingSize(trimmed)) {
      const mm = getRingSizeMm(trimmed);
      return formatRingSizeOrderValue(trimmed, mm);
    }
  }

  return trimmed;
}

export function getCustomizationSummarySegments(
  product: Product,
  selection: CustomizationSelections,
  labels: {
    size: string;
    metal: string;
    diamond: string;
  }
): CustomizationSummarySegment[] {
  const pickers = getProductCustomizationPickers(product);
  const segments: CustomizationSummarySegment[] = [];

  if (pickers.showSize) {
    segments.push({
      key: "size",
      label: labels.size,
      value: formatCustomizationSizeSummary(product, selection.size),
    });
  }

  if (pickers.showMetal || pickers.showCarat) {
    segments.push({
      key: "metal",
      label: labels.metal,
      value: formatCustomizationMetalSummary(selection),
    });
  }

  if (pickers.showDiamond) {
    segments.push({
      key: "diamond",
      label: labels.diamond,
      value: selection.quality.trim() || "—",
    });
  }

  return segments;
}

export function productHasCustomizationOptions(product: Product): boolean {
  const pickers = getProductCustomizationPickers(product);
  return (
    pickers.showMetal ||
    pickers.showCarat ||
    pickers.showDiamond ||
    pickers.showSize
  );
}

export function getProductCustomizeHref(product: Product): string {
  return `${getProductHref(product)}?customize=1`;
}

/** Returns a field-specific error when required customization choices are missing. */
export function getCustomizationValidationError(
  product: Product,
  selected: CustomizationSelections
): CustomizationValidationResult | null {
  const copy = productContent.purchase;

  const pickers = getProductCustomizationPickers(product);

  if (pickers.showMetal && !selected.metal.trim()) {
    return { message: copy.errorMetal, field: "metal" };
  }

  const karatChosen =
    selected.carat.trim() ||
    (selected.metal.trim() && isKaratLabel(selected.metal));

  if (pickers.showCarat && !karatChosen) {
    return { message: copy.errorCarat, field: "carat" };
  }

  if (pickers.showDiamond && !selected.quality.trim()) {
    return { message: copy.errorDiamond, field: "diamond" };
  }

  if (pickers.showSize && !selected.size.trim()) {
    return { message: getSizeValidationMessage(product), field: "size" };
  }

  return null;
}
