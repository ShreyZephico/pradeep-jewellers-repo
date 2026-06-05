import { isKaratLabel, parseKaratNumber } from "@/utils/karat";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";
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
