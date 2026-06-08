import { getGoldPricingForKarat } from "./goldPrice";
import { parseKaratNumber } from "./karat";
import { resolveMakingChargeRate } from "./makingCharge";

export class GoldPriceUnavailableError extends Error {
  constructor() {
    super("No manual gold price in database");
    this.name = "GoldPriceUnavailableError";
  }
}

export type VariantPriceBreakdown = {
  purity: number;
  karat: number;
  base24KGoldPrice: number;
  adjustedGoldPrice: number;
  perGramRate: number;
  actualGoldPrice: number;
  makingCharge: number;
  subtotal: number;
  gst: number;
  finalPrice: number;
};

export type CalculateVariantPriceInput = {
  weight: number;
  carat?: string | null;
  /** Shopify product metafield % (e.g. 15). Falls back to 15% when omitted. */
  makingChargePercent?: number | null;
  /** Shopify making_charge_type metafield — validates per-gram percentage mode. */
  makingChargeType?: string | null;
};

/**
 * Single authoritative jewellery price calculation.
 * Gold rate per karat: dev.store_metal_prices (via getGoldPricingForKarat).
 * Making charge %: from Shopify catalog / metafields (makingChargePercent).
 */
export async function calculateVariantPrice({
  weight,
  carat,
  makingChargePercent,
  makingChargeType,
}: CalculateVariantPriceInput): Promise<VariantPriceBreakdown> {
  const karat = parseKaratNumber(carat);
  const goldPricing = await getGoldPricingForKarat(karat);
  if (goldPricing == null) {
    throw new GoldPriceUnavailableError();
  }

  const {
    purity: purityPercentage,
    karat: resolvedKarat,
    base24KGoldPrice,
    adjustedGoldPrice,
    perGramRate,
  } = goldPricing;

  const actualGoldPrice = weight * perGramRate;
  const makingRate = resolveMakingChargeRate(makingChargePercent, makingChargeType);
  const makingCharge = actualGoldPrice * makingRate;
  const subtotal = actualGoldPrice + makingCharge;
  const gst = subtotal * 0.03;
  const finalPrice = subtotal + gst;

  return {
    purity: purityPercentage,
    karat: resolvedKarat,
    base24KGoldPrice,
    adjustedGoldPrice,
    perGramRate,
    actualGoldPrice: Math.round(actualGoldPrice),
    makingCharge: Math.round(makingCharge),
    subtotal: Math.round(subtotal),
    gst: Math.round(gst),
    finalPrice: Math.round(finalPrice),
  };
}

/** Returns null when gold rates are missing instead of throwing. */
export async function tryCalculateVariantPrice(
  input: CalculateVariantPriceInput
): Promise<VariantPriceBreakdown | null> {
  try {
    return await calculateVariantPrice(input);
  } catch (error) {
    if (error instanceof GoldPriceUnavailableError) {
      return null;
    }
    throw error;
  }
}

export default calculateVariantPrice;
