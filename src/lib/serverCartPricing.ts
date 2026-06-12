import {
  PJ_BREAKDOWN_ATTR,
  PJ_CUSTOM_PRICE_ATTR,
  PJ_IMAGE_URL_ATTR,
} from "@/lib/cartConstants";
import { fetchSingleCatalogProduct } from "@/lib/fetchSingleCatalogProduct";
import { resolveMerchandiseId, type ResolveMerchandiseInput } from "@/lib/cartResolve";
import type { CheckoutAttribute } from "@/lib/shopify";
import type { CartLine } from "@/lib/shopifyCart";
import calculateVariantPrice, {
  computeJewelleryPriceFromOptionLines,
  type VariantPriceBreakdown,
} from "@/utils/calculateVariantPrice";
import {
  applyCustomizationDefaults,
  getDefaultProductCustomization,
  resolveCustomizationOptions,
  type CustomizationSelections,
} from "@/utils/productCustomization";
import { readSizeFromAttributes } from "@/utils/productCustomizationLabels";
import {
  buildPriceBreakdownOptionLines,
  sumOptionLineAmounts,
  type PriceBreakdownOptionLine,
} from "@/utils/priceBreakdownOptions";
import { resolveVariantWeight } from "@/utils/resolveVariantWeight";

/** Client estimate may drift slightly from live gold; server price always wins. */
export const PRICE_TOLERANCE_INR = 2;

const PJ_CONTROLLED_KEYS = new Set<string>([
  PJ_CUSTOM_PRICE_ATTR,
  PJ_IMAGE_URL_ATTR,
  ...Object.values(PJ_BREAKDOWN_ATTR),
]);

export class PriceMismatchError extends Error {
  readonly trustedPrice: number;

  constructor(trustedPrice: number) {
    super("Price changed. Refresh the page and try again.");
    this.name = "PriceMismatchError";
    this.trustedPrice = trustedPrice;
  }
}

export type ServerCartPriceInput = ResolveMerchandiseInput & {
  customPrice?: number;
  /** Ignored for pricing — kept for backwards-compatible request bodies only. */
  weightGrams?: number;
  karatLabel?: string | null;
  optionAdjustments?: number;
  attributes?: CheckoutAttribute[];
  productSlug?: string;
};

export type AuthoritativeLinePricing = {
  trustedPrice: number;
  breakdown: VariantPriceBreakdown;
  weightGrams: number;
  karatLabel: string | null;
  optionLines: PriceBreakdownOptionLine[];
  optionAdjustments: number;
};

function attrValue(
  attributes: CheckoutAttribute[] | undefined,
  key: string
): string | undefined {
  return attributes?.find((a) => a.key === key)?.value.trim();
}

/** Strip hidden pricing keys — clients must not influence checkout totals. */
export function sanitizePublicCartAttributes(
  attributes: CheckoutAttribute[] | undefined
): CheckoutAttribute[] {
  if (!attributes?.length) return [];
  return attributes.filter((attribute) => {
    const key = attribute.key.trim();
    if (!key || !attribute.value.trim()) return false;
    if (PJ_CONTROLLED_KEYS.has(key)) return false;
    if (key.startsWith("_pj_")) return false;
    return true;
  });
}

function parseCustomizationSelections(
  attributes: CheckoutAttribute[],
  product: NonNullable<Awaited<ReturnType<typeof fetchSingleCatalogProduct>>>
): CustomizationSelections {
  const safeProduct = product;
  const fromAttributes: CustomizationSelections = {
    metal: attrValue(attributes, "Metal") ?? "",
    carat:
      attrValue(attributes, "Carat") ??
      attrValue(attributes, "Karat") ??
      "",
    quality: attrValue(attributes, "Diamond Quality") ?? "",
    size: readSizeFromAttributes(attributes, safeProduct) ?? "",
  };

  const hasPricingAttribute = [
    fromAttributes.metal,
    fromAttributes.carat,
    fromAttributes.quality,
    fromAttributes.size,
  ].some((value) => value.trim().length > 0);

  if (!hasPricingAttribute) {
    return applyCustomizationDefaults(
      getDefaultProductCustomization(product),
      product
    );
  }

  return applyCustomizationDefaults(fromAttributes, product);
}

function findVariantForMerchandise(
  product: NonNullable<Awaited<ReturnType<typeof fetchSingleCatalogProduct>>>,
  merchandiseId: string,
  catalogVariantId?: string
) {
  const catalogId =
    typeof catalogVariantId === "string" ? catalogVariantId.trim() : "";
  return product.variants?.find(
    (variant) =>
      variant.id === merchandiseId ||
      variant.catalogVariantId === merchandiseId ||
      (catalogId &&
        (variant.catalogVariantId === catalogId || variant.id === catalogId))
  );
}

/**
 * Authoritative INR price from Shopify catalog + public customization attributes only.
 * Never reads client `customPrice`, `priceBreakdown`, `weightGrams`, or `_pj_*` attrs.
 */
export async function resolveAuthoritativeLinePricing(
  input: ServerCartPriceInput & { variantId: string }
): Promise<AuthoritativeLinePricing> {
  const slug =
    typeof input.productSlug === "string" ? input.productSlug.trim() : "";
  if (!slug) {
    throw new Error("Unable to calculate price for this item.");
  }

  const product = await fetchSingleCatalogProduct(slug);
  if (!product) {
    throw new Error("Product not found.");
  }

  const publicAttributes = sanitizePublicCartAttributes(input.attributes);
  const selections = parseCustomizationSelections(publicAttributes, product);
  const resolved = resolveCustomizationOptions(product, selections);

  const merchandiseId = input.variantId.trim();
  const gidVariant = findVariantForMerchandise(
    product,
    merchandiseId,
    input.catalogVariantId
  );

  const weight = resolveVariantWeight(
    gidVariant?.weight ?? resolved.variant?.weight ?? resolved.baseWeight
  );
  const karatLabel = resolved.karatLabel;

  const optionLines = buildPriceBreakdownOptionLines({
    metal: resolved.metalOption,
    carat: resolved.caratOption,
    quality: resolved.qualityOption,
    size: resolved.sizeOption,
    product,
  });
  const optionAdjustments = sumOptionLineAmounts(optionLines);

  if (weight > 0) {
    const pricing = await calculateVariantPrice({
      weight,
      carat: karatLabel,
      makingChargePercent: product.makingChargePercent ?? null,
    });
    const totals = computeJewelleryPriceFromOptionLines(pricing, optionLines);

    return {
      trustedPrice: Math.max(0, totals.grandTotal),
      breakdown: pricing,
      weightGrams: weight,
      karatLabel,
      optionLines,
      optionAdjustments,
    };
  }

  const fallbackPrice = Math.round(
    gidVariant?.price ?? resolved.variant?.price ?? product.price
  );
  if (!Number.isFinite(fallbackPrice) || fallbackPrice <= 0) {
    throw new Error("Unable to calculate price for this item.");
  }

  const pricing = await calculateVariantPrice({
    weight: 1,
    carat: karatLabel,
    makingChargePercent: product.makingChargePercent ?? null,
  }).catch(() => null);

  if (pricing) {
    const totals = computeJewelleryPriceFromOptionLines(pricing, optionLines);
    return {
      trustedPrice: Math.max(0, totals.grandTotal),
      breakdown: pricing,
      weightGrams: weight,
      karatLabel,
      optionLines,
      optionAdjustments,
    };
  }

  return {
    trustedPrice: Math.max(0, fallbackPrice + optionAdjustments),
    breakdown: {
      purity: 0,
      karat: 18,
      base24KGoldPrice: 0,
      adjustedGoldPrice: 0,
      perGramRate: 0,
      actualGoldPrice: fallbackPrice,
      makingCharge: 0,
      subtotal: fallbackPrice,
      gst: 0,
      finalPrice: fallbackPrice + optionAdjustments,
    },
    weightGrams: weight,
    karatLabel,
    optionLines,
    optionAdjustments,
  };
}

export async function resolveTrustedCartUnitPrice(
  input: ServerCartPriceInput & { variantId: string }
): Promise<number> {
  const pricing = await resolveAuthoritativeLinePricing(input);
  return pricing.trustedPrice;
}

/** Reject checkout attempts where the browser sends a lower price than the server total. */
export function assertClientPriceMatches(
  clientPrice: number | undefined,
  trustedPrice: number
): void {
  if (typeof clientPrice !== "number" || !Number.isFinite(clientPrice)) {
    return;
  }
  if (Math.round(clientPrice) + PRICE_TOLERANCE_INR < trustedPrice) {
    throw new PriceMismatchError(trustedPrice);
  }
}

export async function resolveCartLinePricing(input: ServerCartPriceInput): Promise<{
  merchandiseId: string;
  trustedPrice: number;
  pricing: AuthoritativeLinePricing;
}> {
  const merchandiseId = await resolveMerchandiseId(input);
  const pricing = await resolveAuthoritativeLinePricing({
    ...input,
    variantId: merchandiseId,
  });
  assertClientPriceMatches(input.customPrice, pricing.trustedPrice);
  return {
    merchandiseId,
    trustedPrice: pricing.trustedPrice,
    pricing,
  };
}

/** Re-validate an existing Shopify cart line before draft checkout. */
export async function revalidateCartLineUnitPrice(line: CartLine): Promise<number> {
  const pricing = await resolveAuthoritativeLinePricing({
    variantId: line.merchandiseId,
    productSlug: line.productHandle,
    catalogVariantId: line.merchandiseId,
    attributes: line.attributes,
    customPrice: line.customPriceInr,
  });
  assertClientPriceMatches(line.customPriceInr, pricing.trustedPrice);
  return pricing.trustedPrice;
}
