import { isKaratLabel, parseKaratNumber } from "@/utils/karat";
import { splitJewelleryOptionAmounts } from "@/utils/calculateVariantPrice";
import type { PriceBreakdownOptionLine } from "@/utils/priceBreakdownOptions";

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
  const amounts = splitJewelleryOptionAmounts(lines);
  let diamond: PriceBreakdownOptionLine | null = null;

  for (const line of lines) {
    if (!line.amount) continue;
    if (line.label.toLowerCase().startsWith("diamond")) {
      if (!diamond) diamond = line;
      break;
    }
  }

  return {
    diamond,
    goldExtras: amounts.goldExtras,
    otherExtras: amounts.otherExtras,
  };
}
