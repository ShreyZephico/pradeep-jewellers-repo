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

type CalculateVariantPriceProps = {
  weight: number;
  carat?: string | null;
  /** Shopify metafield or catalog % (e.g. 15). Falls back to 15% when omitted. */
  makingChargePercent?: number | null;
};

async function calculateVariantPrice({
  weight,
  carat,
  makingChargePercent,
}: CalculateVariantPriceProps) {
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

  const makingRate = resolveMakingChargeRate(makingChargePercent);
  const makingCharge = actualGoldPrice * makingRate;

  const subtotal = actualGoldPrice + makingCharge;

  const gst = subtotal * 0.03;

  const finalPrice = subtotal + gst;

  const result: VariantPriceBreakdown = {
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

  return result;
}

export default calculateVariantPrice;
