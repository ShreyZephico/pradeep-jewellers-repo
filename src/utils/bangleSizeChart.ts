import type { ProductSizeOption } from "@/types/product";

/** Indian bangle size ↔ wrist circumference (inches). */
export const BANGLE_SIZE_CHART: ReadonlyArray<{
  size: string;
  inches: number;
}> = [
  { size: "2.2", inches: 6.68 },
  { size: "2.4", inches: 7.07 },
  { size: "2.6", inches: 7.46 },
  { size: "2.8", inches: 7.85 },
  { size: "2.10", inches: 8.24 },
  { size: "2.12", inches: 8.64 },
  { size: "2.14", inches: 9.03 },
  { size: "3", inches: 9.42 },
] as const;

export const STANDARD_BANGLE_SIZES = BANGLE_SIZE_CHART.map((entry) => entry.size);

export const DEFAULT_BANGLE_SIZE = "2.6";

export function isStandardBangleSize(size: string): boolean {
  return STANDARD_BANGLE_SIZES.includes(size.trim());
}

export function getBangleCircumferenceInches(size: string): number | null {
  const entry = BANGLE_SIZE_CHART.find((row) => row.size === size.trim());
  return entry?.inches ?? null;
}

export function formatBangleCircumferenceInches(inches: number): string {
  const rounded = Math.round(inches * 100) / 100;
  return `${rounded} in`;
}

export function formatBangleSizeOrderValue(
  size: string | null,
  inches: number | null,
  fallback = ""
): string {
  const trimmed = size?.trim();
  if (trimmed && inches != null) {
    return `${trimmed} (${formatBangleCircumferenceInches(inches)} circumference)`;
  }
  if (trimmed) {
    return trimmed;
  }
  if (inches != null) {
    return formatBangleCircumferenceInches(inches);
  }
  return fallback.trim();
}

export function getBangleSizePickerOptions(): ProductSizeOption[] {
  return BANGLE_SIZE_CHART.map((entry) => ({
    size: entry.size,
    mm: formatBangleCircumferenceInches(entry.inches),
  }));
}

export type BangleSizeResolution = {
  standardSize: string | null;
  inches: number | null;
  orderValue: string;
  matchValue: string;
};

export function resolveBangleSizeSelection(params: {
  selectedSize: string;
}): BangleSizeResolution {
  const size = params.selectedSize.trim();
  if (!size) {
    return {
      standardSize: null,
      inches: null,
      orderValue: "",
      matchValue: "",
    };
  }

  const chartInches = getBangleCircumferenceInches(size);
  return {
    standardSize: size,
    inches: chartInches,
    orderValue: formatBangleSizeOrderValue(size, chartInches),
    matchValue: size,
  };
}

/** Restore picker state from a saved cart / URL size string. */
export function parseStoredBangleSize(value: string): {
  selectedSize: string;
} {
  const trimmed = value.trim();
  if (!trimmed) {
    return { selectedSize: DEFAULT_BANGLE_SIZE };
  }

  const parenMatch = trimmed.match(/^([\d.]+)\s*\(/);
  const sizeFromParen = parenMatch?.[1];
  if (sizeFromParen && isStandardBangleSize(sizeFromParen)) {
    return { selectedSize: sizeFromParen };
  }

  if (isStandardBangleSize(trimmed)) {
    return { selectedSize: trimmed };
  }

  const numericMatch = trimmed.match(/^([\d.]+)/);
  if (numericMatch?.[1] && isStandardBangleSize(numericMatch[1])) {
    return { selectedSize: numericMatch[1] };
  }

  return { selectedSize: DEFAULT_BANGLE_SIZE };
}
