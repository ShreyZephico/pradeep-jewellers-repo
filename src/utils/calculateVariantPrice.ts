import { getGoldPricingForKarat } from "./goldPrice";
import { parseKaratNumber } from "./karat";
import { resolveMakingChargeRate } from "./makingCharge";

/** GST on gold + making (+ diamond when present). */
export const JEWELLERY_GST_RATE = 0.03;

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

export type JewelleryOptionAmounts = {
  diamondAmount: number;
  goldExtras: number;
  otherExtras: number;
};

export type JewelleryPriceTotals = {
  goldTotal: number;
  diamondAmount: number;
  makingCharge: number;
  otherExtras: number;
  /** Gold + making + diamond (before GST). */
  taxableSubtotal: number;
  gst: number;
  grandTotal: number;
};

type OptionLineLike = {
  label: string;
  amount: number;
};

function roundInr(value: number): number {
  return Math.round(value);
}

/** Split customize option lines into diamond / metal-carat / other amounts. */
export function splitJewelleryOptionAmounts(
  lines: OptionLineLike[]
): JewelleryOptionAmounts {
  let diamondAmount = 0;
  let goldExtras = 0;
  let otherExtras = 0;

  for (const line of lines) {
    if (!line.amount) continue;
    const lower = line.label.toLowerCase();
    if (lower.startsWith("diamond")) {
      diamondAmount += line.amount;
      continue;
    }
    if (lower.startsWith("metal") || lower.startsWith("carat")) {
      goldExtras += line.amount;
      continue;
    }
    otherExtras += line.amount;
  }

  return {
    diamondAmount: roundInr(diamondAmount),
    goldExtras: roundInr(goldExtras),
    otherExtras: roundInr(otherExtras),
  };
}

/**
 * Authoritative jewellery total: sum gold (+ metal/carat extras), diamond, and making;
 * apply 3% GST on that sum; add non-taxable extras (e.g. size) after tax.
 * When diamond is 0, GST is on gold + making only.
 */
export function computeJewelleryPriceTotals(
  breakdown: Pick<VariantPriceBreakdown, "actualGoldPrice" | "makingCharge">,
  options: Partial<JewelleryOptionAmounts> = {}
): JewelleryPriceTotals {
  const diamondAmount = roundInr(options.diamondAmount ?? 0);
  const goldExtras = roundInr(options.goldExtras ?? 0);
  const otherExtras = roundInr(options.otherExtras ?? 0);
  const goldTotal = roundInr(breakdown.actualGoldPrice + goldExtras);
  const makingCharge = roundInr(breakdown.makingCharge);

  const taxableSubtotal = goldTotal + makingCharge + diamondAmount;
  const gst = roundInr(taxableSubtotal * JEWELLERY_GST_RATE);
  const grandTotal = taxableSubtotal + otherExtras + gst;

  return {
    goldTotal,
    diamondAmount,
    makingCharge,
    otherExtras,
    taxableSubtotal,
    gst,
    grandTotal,
  };
}

export function computeJewelleryPriceFromOptionLines(
  breakdown: Pick<VariantPriceBreakdown, "actualGoldPrice" | "makingCharge">,
  optionLines: OptionLineLike[]
): JewelleryPriceTotals {
  return computeJewelleryPriceTotals(
    breakdown,
    splitJewelleryOptionAmounts(optionLines)
  );
}

/**
 * Single authoritative jewellery price calculation (gold + making from live rates).
 * GST fields reflect gold + making only; use computeJewelleryPriceTotals for diamond.
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

  const actualGoldPrice = roundInr(weight * perGramRate);
  const makingRate = resolveMakingChargeRate(makingChargePercent, makingChargeType);
  const makingCharge = roundInr(actualGoldPrice * makingRate);
  const totals = computeJewelleryPriceTotals(
    { actualGoldPrice, makingCharge },
    { diamondAmount: 0, goldExtras: 0, otherExtras: 0 }
  );

  return {
    purity: purityPercentage,
    karat: resolvedKarat,
    base24KGoldPrice,
    adjustedGoldPrice,
    perGramRate,
    actualGoldPrice,
    makingCharge,
    subtotal: totals.taxableSubtotal,
    gst: totals.gst,
    finalPrice: totals.grandTotal,
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
