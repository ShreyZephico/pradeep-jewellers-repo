import type { ProductDiamondDetail, ProductOption } from "@/types/product";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringField(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return "";
}

function normalizeDiamondDetailEntry(record: Record<string, unknown>): ProductDiamondDetail | null {
  const carat = readStringField(record, ["carat", "Carat", "weight"]);
  const color = readStringField(record, ["color", "Color", "colour"]);
  const clarity = readStringField(record, [
    "clarity",
    "Clarity",
    "clarityGroup",
    "clarity_group",
    "grade",
    "quality",
  ]);
  const price = readStringField(record, ["price", "Price"]);
  const shape = readStringField(record, ["shape", "Shape"]);
  const quantity = readStringField(record, ["quantity", "Quantity", "qty"]);
  const diamondType = readStringField(record, [
    "diamondType",
    "diamond_type",
    "type",
    "Type",
  ]);

  if (!carat && !color && !clarity && !price && !shape && !diamondType && !quantity) {
    return null;
  }

  return { carat, color, clarity, price, shape, quantity, diamondType };
}

function tryParseJsonArray(raw: string): unknown[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (typeof parsed === "string") {
      const nested = JSON.parse(parsed);
      return Array.isArray(nested) ? nested : null;
    }
  } catch {
    return null;
  }
  return null;
}

/** Parse Shopify `custom.diamond_details` JSON metafield. */
export function parseDiamondDetailsMetafield(
  raw: string | null | undefined
): ProductDiamondDetail[] {
  if (!raw?.trim()) {
    return [];
  }

  const parsed = tryParseJsonArray(raw.trim());
  if (!parsed) {
    return [];
  }

  const details: ProductDiamondDetail[] = [];
  for (const entry of parsed) {
    if (!isRecord(entry)) {
      continue;
    }
    const normalized = normalizeDiamondDetailEntry(entry);
    if (normalized) {
      details.push(normalized);
    }
  }
  return details;
}

/** Short label for cart attributes / picker selection. */
export function formatDiamondDetailLabel(detail: ProductDiamondDetail): string {
  const color = detail.color?.trim();
  const clarity = detail.clarity?.trim();

  if (color && clarity) {
    return `${color}-${clarity}`;
  }
  if (color && detail.diamondType?.trim()) {
    return `${color} ${detail.diamondType.trim()}`;
  }
  if (color) {
    return color;
  }
  if (clarity) {
    return clarity;
  }
  if (detail.carat?.trim()) {
    return `${detail.carat.trim()} ct`;
  }
  return "";
}

export type DiamondDetailDisplayRow = {
  label: string;
  value: string;
};

export function buildDiamondDetailDisplayRows(
  detail: ProductDiamondDetail,
  labels: {
    carat: string;
    color: string;
    clarity: string;
    type: string;
    shape: string;
    quantity: string;
    price: string;
  },
  formatPrice: (amount: number) => string
): DiamondDetailDisplayRow[] {
  const rows: DiamondDetailDisplayRow[] = [];

  if (detail.carat?.trim()) {
    rows.push({
      label: labels.carat,
      value: `${detail.carat.trim()} ct`,
    });
  }
  if (detail.color?.trim()) {
    rows.push({ label: labels.color, value: detail.color.trim() });
  }
  if (detail.clarity?.trim()) {
    rows.push({ label: labels.clarity, value: detail.clarity.trim() });
  }
  if (detail.diamondType?.trim()) {
    rows.push({ label: labels.type, value: detail.diamondType.trim() });
  }
  if (detail.shape?.trim()) {
    rows.push({ label: labels.shape, value: detail.shape.trim() });
  }
  if (detail.quantity?.trim()) {
    rows.push({ label: labels.quantity, value: detail.quantity.trim() });
  }
  if (detail.price?.trim()) {
    const amount = Number(detail.price);
    rows.push({
      label: labels.price,
      value: Number.isFinite(amount) ? formatPrice(amount) : detail.price.trim(),
    });
  }

  return rows;
}

/** Build customize-picker options from diamond detail rows. */
export function diamondDetailsToPickerOptions(
  details: ProductDiamondDetail[]
): ProductOption[] {
  const options: ProductOption[] = [];
  const seen = new Set<string>();

  for (const detail of details) {
    const label = formatDiamondDetailLabel(detail);
    if (!label) {
      continue;
    }

    const key = label.toUpperCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const priceValue = detail.price ? Number(detail.price) : NaN;
    const noteParts = [
      detail.carat?.trim() ? `${detail.carat.trim()} ct` : "",
      detail.diamondType?.trim() ?? "",
    ].filter(Boolean);

    options.push({
      label,
      note: noteParts.length ? noteParts.join(" · ") : undefined,
      priceAdjustment: Number.isFinite(priceValue) ? priceValue : undefined,
    });
  }

  return options;
}

export function productHasDiamondDetails(
  details: ProductDiamondDetail[] | undefined
): boolean {
  return (details?.length ?? 0) > 0;
}
