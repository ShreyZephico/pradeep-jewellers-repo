import { isKaratLabel, parseKaratNumber } from "@/utils/karat";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";
import type { PriceBreakdownOptionLine } from "@/utils/priceBreakdownOptions";

/** Reference making % for “was / now” display when live rate is lower. */
export const REFERENCE_MAKING_PERCENT = 15;

export function buildGoldBreakupLabel(
  karatLabel: string | null,
  metalLabel: string | null,
  karat: number
): string {
  const parsed = parseKaratNumber(karatLabel ?? `${karat}K`);
  const kt = `${parsed} Kt`;

  const metal = metalLabel?.trim() ?? "";
  if (!metal) {
    return `${kt} Gold`;
  }
  if (isKaratLabel(metal)) {
    const fromMetal = parseKaratNumber(metal);
    return `${fromMetal} Kt Gold`;
  }
  if (/gold/i.test(metal)) {
    return `${kt} ${metal}`;
  }
  return `${kt} ${metal}`;
}

export function extractDiamondQualityLabel(lineLabel: string): string {
  const match = lineLabel.match(/Diamond quality \((.+)\)/i);
  return match?.[1]?.trim() || lineLabel;
}

export function splitBreakupOptionLines(lines: PriceBreakdownOptionLine[]): {
  diamond: PriceBreakdownOptionLine | null;
  goldExtras: number;
  otherExtras: number;
} {
  let diamond: PriceBreakdownOptionLine | null = null;
  let goldExtras = 0;
  let otherExtras = 0;

  for (const line of lines) {
    if (!line.amount) continue;
    const lower = line.label.toLowerCase();
    if (lower.startsWith("diamond")) {
      if (!diamond) diamond = line;
      continue;
    }
    if (lower.startsWith("metal") || lower.startsWith("carat")) {
      goldExtras += line.amount;
      continue;
    }
    otherExtras += line.amount;
  }

  return { diamond, goldExtras, otherExtras };
}

export function getReferenceBreakupAmounts(
  breakdown: VariantPriceBreakdown,
  extras: { diamondAmount: number; otherExtras: number }
) {
  const referenceMaking = Math.round(
    breakdown.actualGoldPrice * (REFERENCE_MAKING_PERCENT / 100)
  );
  const referenceSubtotal = breakdown.actualGoldPrice + referenceMaking;
  const referenceGst = Math.round(referenceSubtotal * 0.03);
  const referenceGrand =
    referenceSubtotal +
    referenceGst +
    extras.diamondAmount +
    extras.otherExtras;

  return {
    referenceMaking,
    referenceGst,
    referenceGrand,
    showMakingCompare: referenceMaking > breakdown.makingCharge,
    showGstCompare: referenceGst > breakdown.gst,
  };
}
