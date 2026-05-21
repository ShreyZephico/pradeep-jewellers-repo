import { PJ_BREAKDOWN_ATTR } from "@/lib/cartConstants";
import type { CheckoutAttribute } from "@/lib/shopify";
import type { ClientCartLine } from "@/types/cart";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";

export type CartLineBreakdownData = {
  weightGrams: number;
  karatLabel: string | null;
  breakdown: VariantPriceBreakdown;
  optionAdjustments: number;
  unitPrice: number;
};

export type CartOrderBreakdownTotals = {
  goldValue: number;
  makingCharge: number;
  gst: number;
  optionAdjustments: number;
  subtotal: number;
};

function attrValue(
  attributes: { key: string; value: string }[],
  key: string
): string | undefined {
  return attributes.find((a) => a.key === key)?.value.trim();
}

function parseIntAttr(
  attributes: { key: string; value: string }[],
  key: string
): number | null {
  const raw = attrValue(attributes, key);
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function breakdownAttributesFromPricing(input: {
  breakdown: VariantPriceBreakdown;
  weightGrams: number;
  karatLabel?: string | null;
  optionAdjustments?: number;
}): CheckoutAttribute[] {
  const { breakdown, weightGrams, karatLabel, optionAdjustments = 0 } = input;
  const attrs: CheckoutAttribute[] = [
    { key: PJ_BREAKDOWN_ATTR.weight, value: String(weightGrams) },
    { key: PJ_BREAKDOWN_ATTR.karat, value: (karatLabel ?? `${breakdown.karat}K`).trim() },
    { key: PJ_BREAKDOWN_ATTR.perGramRate, value: String(breakdown.perGramRate) },
    { key: PJ_BREAKDOWN_ATTR.actualGold, value: String(breakdown.actualGoldPrice) },
    { key: PJ_BREAKDOWN_ATTR.makingCharge, value: String(breakdown.makingCharge) },
    { key: PJ_BREAKDOWN_ATTR.subtotal, value: String(breakdown.subtotal) },
    { key: PJ_BREAKDOWN_ATTR.gst, value: String(breakdown.gst) },
  ];
  if (optionAdjustments !== 0) {
    attrs.push({
      key: PJ_BREAKDOWN_ATTR.optionAdj,
      value: String(Math.round(optionAdjustments)),
    });
  }
  return attrs;
}

export function parseBreakdownFromLine(
  line: ClientCartLine
): CartLineBreakdownData | null {
  const weight = parseIntAttr(line.attributes, PJ_BREAKDOWN_ATTR.weight);
  const perGramRate = parseIntAttr(line.attributes, PJ_BREAKDOWN_ATTR.perGramRate);
  const actualGold = parseIntAttr(line.attributes, PJ_BREAKDOWN_ATTR.actualGold);
  const makingCharge = parseIntAttr(line.attributes, PJ_BREAKDOWN_ATTR.makingCharge);
  const subtotal = parseIntAttr(line.attributes, PJ_BREAKDOWN_ATTR.subtotal);
  const gst = parseIntAttr(line.attributes, PJ_BREAKDOWN_ATTR.gst);

  if (
    weight == null ||
    perGramRate == null ||
    actualGold == null ||
    makingCharge == null ||
    subtotal == null ||
    gst == null
  ) {
    return null;
  }

  const karatRaw = attrValue(line.attributes, PJ_BREAKDOWN_ATTR.karat) ?? "";
  const karatMatch = karatRaw.match(/(\d+)/);
  const karat = karatMatch ? parseInt(karatMatch[1], 10) : 18;

  const optionAdj =
    parseIntAttr(line.attributes, PJ_BREAKDOWN_ATTR.optionAdj) ?? 0;

  const unitFromPrice = line.customPriceInr > 0 ? line.customPriceInr : subtotal + gst + optionAdj;

  return {
    weightGrams: weight,
    karatLabel: karatRaw || null,
    optionAdjustments: optionAdj,
    unitPrice: unitFromPrice,
    breakdown: {
      purity: Math.round((karat / 24) * 100),
      karat,
      base24KGoldPrice: 0,
      adjustedGoldPrice: perGramRate,
      perGramRate,
      actualGoldPrice: actualGold,
      makingCharge,
      subtotal,
      gst,
      finalPrice: subtotal + gst,
    },
  };
}

export function aggregateOrderBreakdown(
  lines: ClientCartLine[],
  lineBreakdowns: Map<string, CartLineBreakdownData>
): CartOrderBreakdownTotals | null {
  if (lineBreakdowns.size === 0) return null;

  let goldValue = 0;
  let makingCharge = 0;
  let gst = 0;
  let optionAdjustments = 0;

  for (const line of lines) {
    const data = lineBreakdowns.get(line.id);
    if (!data) continue;
    const qty = line.quantity;
    goldValue += data.breakdown.actualGoldPrice * qty;
    makingCharge += data.breakdown.makingCharge * qty;
    gst += data.breakdown.gst * qty;
    optionAdjustments += data.optionAdjustments * qty;
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotalInr, 0);

  return {
    goldValue,
    makingCharge,
    gst,
    optionAdjustments,
    subtotal,
  };
}

export function getCaratFromLineAttributes(
  attributes: { key: string; value: string }[]
): string | null {
  return (
    attrValue(attributes, "Carat") ??
    attrValue(attributes, "Karat") ??
    null
  );
}
