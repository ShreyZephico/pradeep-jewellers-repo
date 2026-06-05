import type { ProductSizeOption } from "@/types/product";

/** Indian / UK ring size ↔ inner diameter (mm). */
export const RING_SIZE_CHART: ReadonlyArray<{ size: string; mm: number }> = [
  { size: "5", mm: 44.8 },
  { size: "6", mm: 45.9 },
  { size: "7", mm: 47.1 },
  { size: "8", mm: 48.1 },
  { size: "9", mm: 49.0 },
  { size: "10", mm: 50.0 },
  { size: "11", mm: 50.9 },
  { size: "12", mm: 51.8 },
  { size: "13", mm: 52.8 },
  { size: "14", mm: 54.0 },
  { size: "15", mm: 55.0 },
  { size: "16", mm: 55.9 },
  { size: "17", mm: 56.9 },
  { size: "18", mm: 57.8 },
  { size: "19", mm: 59.1 },
  { size: "20", mm: 60.0 },
  { size: "21", mm: 60.9 },
  { size: "22", mm: 61.9 },
  { size: "23", mm: 62.8 },
  { size: "24", mm: 63.8 },
  { size: "25", mm: 64.7 },
] as const;

export const STANDARD_RING_SIZES = RING_SIZE_CHART.map((entry) => entry.size);

/** Sizes shown in the product customize modal grid. */
export const RING_PICKER_SIZE_MIN = 5;
export const RING_PICKER_SIZE_MAX = 14;

/** Sizes shown in the shop sidebar when Rings category is selected. */
export const RING_FILTER_SIZE_MIN = 5;
export const RING_FILTER_SIZE_MAX = 15;

/** Default ring sizes shown before “View all” in the shop filter. */
export const RING_FILTER_PREVIEW_SIZES = ["9", "10", "11", "12"] as const;

const MM_MIN = 40;
const MM_MAX = 70;
const SIZE_MIN = 5;
const SIZE_MAX = 25;

export type RingSizeInputMode = "indian" | "mm";

export type RingSizeInputKind = "standard" | "mm" | "half" | "empty" | "invalid";

export type ParsedRingSizeInput =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "standard"; size: string; mm: number }
  | { kind: "half"; size: string; mm: number }
  | { kind: "mm"; mm: number; nearestSize: string | null; nearestMm: number | null };

export type RingSizeResolution = {
  inputKind: RingSizeInputKind;
  standardSize: string | null;
  mm: number | null;
  /** Cart / order line attribute */
  orderValue: string;
  /** Variant option matching (numeric size only when possible) */
  matchValue: string;
  hint: string | null;
};

export function isStandardRingSize(size: string): boolean {
  const value = size.trim();
  return STANDARD_RING_SIZES.includes(value);
}

export function isPickerRingSize(size: string): boolean {
  const value = size.trim();
  if (!/^\d{1,2}$/.test(value)) {
    return false;
  }
  const n = Number(value);
  return n >= RING_PICKER_SIZE_MIN && n <= RING_PICKER_SIZE_MAX;
}

export function getRingSizeMm(size: string): number | null {
  const entry = RING_SIZE_CHART.find((row) => row.size === size.trim());
  return entry?.mm ?? null;
}

export function formatRingSizeMm(mm: number): string {
  const rounded = Math.round(mm * 10) / 10;
  return `${rounded} mm`;
}

function mapChartToPickerOptions(
  min: number,
  max: number
): ProductSizeOption[] {
  return RING_SIZE_CHART.filter(
    (entry) => Number(entry.size) >= min && Number(entry.size) <= max
  ).map((entry) => ({
    size: entry.size,
    mm: formatRingSizeMm(entry.mm),
  }));
}

export function getRingSizePickerOptions(): ProductSizeOption[] {
  return mapChartToPickerOptions(RING_PICKER_SIZE_MIN, RING_PICKER_SIZE_MAX);
}

export function getRingFilterSizeOptions(): ProductSizeOption[] {
  return mapChartToPickerOptions(RING_FILTER_SIZE_MIN, RING_FILTER_SIZE_MAX);
}

export function getRingFilterPreviewOptions(): ProductSizeOption[] {
  const preview = new Set<string>(RING_FILTER_PREVIEW_SIZES);
  return getRingFilterSizeOptions().filter((option) => preview.has(option.size));
}

export function getRingFilterExtraOptions(): ProductSizeOption[] {
  const preview = new Set<string>(RING_FILTER_PREVIEW_SIZES);
  return getRingFilterSizeOptions().filter((option) => !preview.has(option.size));
}

export function formatRingFilterSizeLabel(option: ProductSizeOption): string {
  if (option.mm) {
    return `${option.size} · ${option.mm}`;
  }
  return option.size;
}

export function categoryShowsRingSizeFilter(category: string): boolean {
  return category === "all" || category === "ring";
}

export function categoryShowsRingPriceFilter(_category: string): boolean {
  return true;
}

/** Normalize Shopify / cart size strings to a chart size key (e.g. "11"). */
export function normalizeRingSizeFilterValue(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(/^(\d{1,2})/);
  if (!match) {
    return null;
  }
  const size = match[1];
  if (!STANDARD_RING_SIZES.includes(size)) {
    return null;
  }
  return size;
}

export function parseRingSizesQueryParam(
  raw: string | null | undefined
): string[] {
  if (!raw?.trim()) {
    return [];
  }
  const seen = new Set<string>();
  const sizes: string[] = [];
  for (const part of raw.split(",")) {
    const normalized = normalizeRingSizeFilterValue(part);
    if (
      !normalized ||
      seen.has(normalized) ||
      Number(normalized) < RING_FILTER_SIZE_MIN ||
      Number(normalized) > RING_FILTER_SIZE_MAX
    ) {
      continue;
    }
    seen.add(normalized);
    sizes.push(normalized);
  }
  return sizes.sort((a, b) => Number(a) - Number(b));
}

export function serializeRingSizesQueryParam(sizes: string[]): string {
  return parseRingSizesQueryParam(sizes.join(",")).join(",");
}

function parseNumericInput(raw: string): number | null {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/\bmm\b/g, "")
    .replace(/,/g, ".")
    .replace(/\s+/g, "")
    .trim();

  if (!cleaned) {
    return null;
  }

  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function isHalfStepSize(value: number): boolean {
  return value >= SIZE_MIN && value <= SIZE_MAX && Math.abs(value * 2 - Math.round(value * 2)) < 0.001;
}

/** Linear mm between two chart sizes (for half sizes e.g. 10.5). */
export function interpolateRingSizeMm(size: number): number {
  const lower = Math.floor(size);
  const upper = Math.ceil(size);
  const lowerEntry = RING_SIZE_CHART.find((row) => row.size === String(lower));
  const upperEntry = RING_SIZE_CHART.find((row) => row.size === String(upper));

  if (!lowerEntry) {
    return upperEntry?.mm ?? size;
  }
  if (!upperEntry || lower === upper) {
    return lowerEntry.mm;
  }

  const fraction = size - lower;
  return Math.round((lowerEntry.mm + (upperEntry.mm - lowerEntry.mm) * fraction) * 10) / 10;
}

export function findNearestRingSizeByMm(mm: number): {
  size: string;
  mm: number;
  delta: number;
} | null {
  if (!RING_SIZE_CHART.length) {
    return null;
  }

  let best = RING_SIZE_CHART[0];
  let bestDelta = Math.abs(mm - best.mm);

  for (const entry of RING_SIZE_CHART) {
    const delta = Math.abs(mm - entry.mm);
    if (delta < bestDelta) {
      best = entry;
      bestDelta = delta;
    }
  }

  return { size: best.size, mm: best.mm, delta: bestDelta };
}

function parseIndianRingSizeInput(numeric: number): ParsedRingSizeInput {
  const roundedInt = Math.round(numeric);
  const isWholeSize =
    Number.isInteger(numeric) ||
    (Math.abs(numeric - roundedInt) < 0.001 &&
      roundedInt >= SIZE_MIN &&
      roundedInt <= SIZE_MAX);

  if (isWholeSize && roundedInt >= SIZE_MIN && roundedInt <= SIZE_MAX) {
    const chartMm = getRingSizeMm(String(roundedInt));
    if (chartMm !== null) {
      return { kind: "standard", size: String(roundedInt), mm: chartMm };
    }
  }

  if (isHalfStepSize(numeric) && !Number.isInteger(numeric)) {
    return {
      kind: "half",
      size: String(numeric),
      mm: interpolateRingSizeMm(numeric),
    };
  }

  return { kind: "invalid" };
}

function parseMmRingSizeInput(numeric: number): ParsedRingSizeInput {
  if (numeric >= MM_MIN && numeric <= MM_MAX) {
    const nearest = findNearestRingSizeByMm(numeric);
    return {
      kind: "mm",
      mm: Math.round(numeric * 10) / 10,
      nearestSize: nearest?.size ?? null,
      nearestMm: nearest?.mm ?? null,
    };
  }

  return { kind: "invalid" };
}

export function parseRingSizeInput(
  raw: string,
  mode: RingSizeInputMode | "auto" = "auto"
): ParsedRingSizeInput {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { kind: "empty" };
  }

  const numeric = parseNumericInput(trimmed);
  if (numeric === null) {
    return { kind: "invalid" };
  }

  if (mode === "indian") {
    return parseIndianRingSizeInput(numeric);
  }

  if (mode === "mm") {
    return parseMmRingSizeInput(numeric);
  }

  const indian = parseIndianRingSizeInput(numeric);
  if (indian.kind !== "invalid") {
    return indian;
  }

  return parseMmRingSizeInput(numeric);
}

export function formatRingSizeOrderValue(
  standardSize: string | null,
  mm: number | null,
  fallback = ""
): string {
  const size = standardSize?.trim();
  if (size && mm != null) {
    return `${size} (${formatRingSizeMm(mm)})`;
  }
  if (size) {
    return size;
  }
  if (mm != null) {
    return formatRingSizeMm(mm);
  }
  return fallback.trim();
}

export function resolveRingSizeSelection(params: {
  customActive: boolean;
  customInput: string;
  selectedSize: string;
  customInputMode?: RingSizeInputMode;
}): RingSizeResolution {
  if (params.customActive) {
    const parsed = parseRingSizeInput(
      params.customInput,
      params.customInputMode ?? "auto"
    );

    if (parsed.kind === "empty") {
      return {
        inputKind: "empty",
        standardSize: null,
        mm: null,
        orderValue: "",
        matchValue: "",
        hint: null,
      };
    }

    if (parsed.kind === "invalid") {
      return {
        inputKind: "invalid",
        standardSize: null,
        mm: null,
        orderValue: params.customInput.trim(),
        matchValue: params.customInput.trim(),
        hint: null,
      };
    }

    if (parsed.kind === "standard" || parsed.kind === "half") {
      return {
        inputKind: parsed.kind,
        standardSize: parsed.size,
        mm: parsed.mm,
        orderValue: formatRingSizeOrderValue(parsed.size, parsed.mm),
        matchValue: parsed.size,
        hint: null,
      };
    }

    const nearestSize = parsed.nearestSize;
    const nearestMm = parsed.nearestMm;
    return {
      inputKind: "mm",
      standardSize: nearestSize,
      mm: parsed.mm,
      orderValue: formatRingSizeOrderValue(nearestSize, parsed.mm),
      matchValue: nearestSize ?? String(parsed.mm),
      hint:
        nearestSize && nearestMm != null
          ? `Matches size ${nearestSize} (${formatRingSizeMm(nearestMm)})`
          : null,
    };
  }

  const size = params.selectedSize.trim();
  if (!size) {
    return {
      inputKind: "empty",
      standardSize: null,
      mm: null,
      orderValue: "",
      matchValue: "",
      hint: null,
    };
  }

  const chartMm = getRingSizeMm(size);
  return {
    inputKind: "standard",
    standardSize: size,
    mm: chartMm,
    orderValue: formatRingSizeOrderValue(size, chartMm),
    matchValue: size,
    hint: null,
  };
}

/** Restore picker state from a saved cart / URL size string. */
export function parseStoredRingSize(value: string): {
  customActive: boolean;
  selectedSize: string;
  customInput: string;
  customInputMode: RingSizeInputMode;
} {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      customActive: false,
      selectedSize: "5",
      customInput: "",
      customInputMode: "indian",
    };
  }

  const parenMatch = trimmed.match(/^(\d{1,2})\s*\(/);
  const sizeFromParen = parenMatch?.[1];
  const gridSize = sizeFromParen ?? (isStandardRingSize(trimmed) ? trimmed : null);

  if (gridSize && isPickerRingSize(gridSize)) {
    return {
      customActive: false,
      selectedSize: gridSize,
      customInput: "",
      customInputMode: "indian",
    };
  }

  const parsed = parseRingSizeInput(trimmed, "auto");
  if (parsed.kind === "standard" && isPickerRingSize(parsed.size)) {
    return {
      customActive: false,
      selectedSize: parsed.size,
      customInput: "",
      customInputMode: "indian",
    };
  }

  if (parsed.kind === "standard" || parsed.kind === "half") {
    return {
      customActive: true,
      selectedSize: "",
      customInput: parsed.size,
      customInputMode: "indian",
    };
  }

  if (parsed.kind === "mm") {
    return {
      customActive: true,
      selectedSize: "",
      customInput: String(parsed.mm),
      customInputMode: "mm",
    };
  }

  return {
    customActive: true,
    selectedSize: "",
    customInput: trimmed,
    customInputMode: "indian",
  };
}
