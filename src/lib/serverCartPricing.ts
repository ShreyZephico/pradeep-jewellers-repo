import { PJ_BREAKDOWN_ATTR } from "@/lib/cartConstants";
import { parseBreakdownFromLine } from "@/lib/cartBreakdown";
import { fetchSingleCatalogProduct } from "@/lib/fetchSingleCatalogProduct";
import { resolveMerchandiseId, type ResolveMerchandiseInput } from "@/lib/cartResolve";
import type { CheckoutAttribute } from "@/lib/shopify";
import type { CartLine } from "@/lib/shopifyCart";
import calculateVariantPrice from "@/utils/calculateVariantPrice";
import { resolveVariantWeight } from "@/utils/resolveVariantWeight";

/** Legacy tolerance — client estimate may drift slightly from live gold; server price wins. */
export const PRICE_TOLERANCE_INR = 2;

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
  weightGrams?: number;
  karatLabel?: string | null;
  optionAdjustments?: number;
  attributes?: CheckoutAttribute[];
  productSlug?: string;
};

function attrValue(attributes: CheckoutAttribute[] | undefined, key: string): string | undefined {
  return attributes?.find((a) => a.key === key)?.value.trim();
}

function parseIntAttr(attributes: CheckoutAttribute[] | undefined, key: string): number | null {
  const raw = attrValue(attributes, key);
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveWeight(input: ServerCartPriceInput): number | null {
  if (typeof input.weightGrams === "number" && Number.isFinite(input.weightGrams)) {
    return resolveVariantWeight(input.weightGrams);
  }
  const fromAttr = parseIntAttr(input.attributes, PJ_BREAKDOWN_ATTR.weight);
  return fromAttr != null ? resolveVariantWeight(fromAttr) : null;
}

function resolveKarat(input: ServerCartPriceInput): string | null {
  if (typeof input.karatLabel === "string" && input.karatLabel.trim()) {
    return input.karatLabel.trim();
  }
  return (
    attrValue(input.attributes, PJ_BREAKDOWN_ATTR.karat) ??
    attrValue(input.attributes, "Carat") ??
    attrValue(input.attributes, "Karat") ??
    null
  );
}

function resolveOptionAdjustments(input: ServerCartPriceInput): number {
  if (typeof input.optionAdjustments === "number" && Number.isFinite(input.optionAdjustments)) {
    return Math.round(input.optionAdjustments);
  }
  return parseIntAttr(input.attributes, PJ_BREAKDOWN_ATTR.optionAdj) ?? 0;
}

async function resolveMakingChargePercentForProduct(
  productSlug: string | undefined
): Promise<number | null | undefined> {
  const slug = typeof productSlug === "string" ? productSlug.trim() : "";
  if (!slug) return undefined;
  const product = await fetchSingleCatalogProduct(slug);
  return product?.makingChargePercent ?? null;
}

async function resolveWeightFromCatalog(
  input: ResolveMerchandiseInput & { productSlug?: string }
): Promise<number | null> {
  const slug =
    typeof input.productSlug === "string" ? input.productSlug.trim() : "";
  if (!slug) return null;

  const product = await fetchSingleCatalogProduct(slug);
  if (!product) return null;

  const catalogId =
    typeof input.catalogVariantId === "string"
      ? input.catalogVariantId.trim()
      : "";
  const variant = product.variants?.find(
    (v) =>
      v.catalogVariantId === catalogId ||
      v.id === catalogId ||
      (input.variantId &&
        (v.id === input.variantId || v.catalogVariantId === input.variantId))
  );

  const grams =
    variant?.weight ??
    product.variants?.find((v) => v.weight && v.weight > 0)?.weight;
  if (typeof grams !== "number" || !Number.isFinite(grams)) return null;
  return resolveVariantWeight(grams);
}

async function catalogVariantUnitPrice(
  input: ResolveMerchandiseInput & { productSlug?: string }
): Promise<number | null> {
  const slug =
    typeof input.productSlug === "string" ? input.productSlug.trim() : "";
  if (!slug) return null;

  const product = await fetchSingleCatalogProduct(slug);
  if (!product) return null;

  const catalogId =
    typeof input.catalogVariantId === "string"
      ? input.catalogVariantId.trim()
      : "";
  const variant = product.variants?.find(
    (v) =>
      v.catalogVariantId === catalogId ||
      v.id === catalogId ||
      (input.variantId && (v.id === input.variantId || v.catalogVariantId === input.variantId))
  );

  const price = variant?.price ?? product.price;
  if (typeof price === "number" && Number.isFinite(price) && price > 0) {
    return Math.round(price);
  }
  return null;
}

/** Authoritative INR unit price for cart / checkout (never trust client `customPrice` alone). */
/** Use breakdown snapshot stored on the cart line (avoids live gold drift at checkout). */
function trustedPriceFromStoredBreakdown(
  attributes: CheckoutAttribute[] | undefined
): number | null {
  const weight = parseIntAttr(attributes, PJ_BREAKDOWN_ATTR.weight);
  const subtotal = parseIntAttr(attributes, PJ_BREAKDOWN_ATTR.subtotal);
  const gst = parseIntAttr(attributes, PJ_BREAKDOWN_ATTR.gst);
  if (weight == null || subtotal == null || gst == null) return null;

  const optionAdj = parseIntAttr(attributes, PJ_BREAKDOWN_ATTR.optionAdj) ?? 0;
  return Math.max(0, Math.round(subtotal + gst + optionAdj));
}

export async function resolveTrustedCartUnitPrice(
  input: ServerCartPriceInput
): Promise<number> {
  const stored = trustedPriceFromStoredBreakdown(input.attributes);
  if (stored != null) {
    return stored;
  }

  let weight = resolveWeight(input);
  if (weight == null) {
    weight = await resolveWeightFromCatalog(input);
  }
  const karat = resolveKarat(input);
  const optionAdj = resolveOptionAdjustments(input);

  if (weight != null && weight > 0) {
    const makingChargePercent = await resolveMakingChargePercentForProduct(
      input.productSlug
    );
    const pricing = await calculateVariantPrice({
      weight,
      carat: karat,
      makingChargePercent,
    });
    return Math.max(0, Math.round(pricing.finalPrice + optionAdj));
  }

  const catalogPrice = await catalogVariantUnitPrice(input);
  if (catalogPrice != null) {
    return Math.max(0, Math.round(catalogPrice + optionAdj));
  }

  throw new Error("Unable to calculate price for this item.");
}

/**
 * Server `trustedPrice` is always used for cart/checkout.
 * Do not block purchases when the UI estimate is slightly stale (live gold rates).
 */
export function assertClientPriceMatches(
  _clientPrice: number | undefined,
  _trustedPrice: number
): void {
  /* no-op */
}

/** Resolve merchandise GID + trusted unit price for add-to-cart / buy-now. */
export async function resolveCartLinePricing(input: ServerCartPriceInput): Promise<{
  merchandiseId: string;
  trustedPrice: number;
}> {
  const merchandiseId = await resolveMerchandiseId(input);
  const trustedPrice = await resolveTrustedCartUnitPrice({
    ...input,
    variantId: merchandiseId,
  });
  assertClientPriceMatches(input.customPrice, trustedPrice);
  return { merchandiseId, trustedPrice };
}

/** Re-validate an existing Shopify cart line before draft checkout. */
export async function revalidateCartLineUnitPrice(line: CartLine): Promise<number> {
  const parsed = parseBreakdownFromLine({
    id: line.id,
    quantity: line.quantity,
    merchandiseId: line.merchandiseId,
    title: line.title,
    productHandle: line.productHandle,
    imageUrl: line.imageUrl,
    customPriceInr: line.customPriceInr,
    lineTotalInr: line.customPriceInr * line.quantity,
    attributes: line.attributes,
  });
  if (parsed) {
    const trusted = Math.max(
      0,
      Math.round(parsed.breakdown.finalPrice + parsed.optionAdjustments)
    );
    assertClientPriceMatches(line.customPriceInr, trusted);
    return trusted;
  }

  const trusted = await resolveTrustedCartUnitPrice({
    variantId: line.merchandiseId,
    productSlug: line.productHandle,
    catalogVariantId: line.merchandiseId,
    attributes: line.attributes,
    customPrice: line.customPriceInr,
  });
  assertClientPriceMatches(line.customPriceInr, trusted);
  return trusted;
}
