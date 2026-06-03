/** Fallback when Shopify / catalog making % is missing. */
export const DEFAULT_MAKING_CHARGE_PERCENT = 7;

export type MakingChargeSource = "shopify" | "catalog" | "default";

export type ResolvedMakingCharge = {
  percent: number;
  rate: number;
  source: MakingChargeSource;
};

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s-]+/g, "_");
}

function parsePercentValue(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(/%$/, ""));
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n;
}

/** True when Shopify type is “Per gram percentage” (or similar). */
export function isPerGramPercentageType(type: string | null | undefined): boolean {
  if (!type?.trim()) return true;
  const t = type.toLowerCase();
  return (
    (t.includes("per") && t.includes("gram") && t.includes("percent")) ||
    t.includes("per_gram") ||
    t === "percentage" ||
    t.includes("percent")
  );
}

export function resolveMakingChargePercent(
  percent: number | null | undefined,
  type: string | null | undefined,
  source: MakingChargeSource
): ResolvedMakingCharge | null {
  if (percent == null || !Number.isFinite(percent) || percent < 0) {
    return null;
  }
  if (!isPerGramPercentageType(type)) {
    return null;
  }
  return {
    percent,
    rate: percent / 100,
    source,
  };
}

export function resolveMakingChargeRate(
  percent: number | null | undefined,
  type?: string | null
): number {
  const resolved = resolveMakingChargePercent(percent, type, "default");
  if (resolved) return resolved.rate;
  return DEFAULT_MAKING_CHARGE_PERCENT / 100;
}

type MetafieldLike = {
  namespace?: string | null;
  key?: string | null;
  value?: string | null;
};

function pickMetafieldValue(
  fields: MetafieldLike[],
  keyMatchers: (normalizedKey: string) => boolean
): string | null {
  for (const field of fields) {
    const key = field.key?.trim();
    if (!key) continue;
    if (keyMatchers(normalizeKey(key))) {
      const value = field.value?.trim();
      if (value) return value;
    }
  }
  return null;
}

/** Parse making % from Shopify product metafields (Storefront or Admin shape). */
export function parseMakingChargeFromMetafields(
  fields: MetafieldLike[] | null | undefined
): ResolvedMakingCharge | null {
  if (!fields?.length) return null;

  const typeRaw = pickMetafieldValue(fields, (k) =>
    k.includes("making") && k.includes("type")
  );
  const chargeRaw = pickMetafieldValue(
    fields,
    (k) => k.includes("making") && k.includes("charge") && !k.includes("type")
  );

  const percent = parsePercentValue(chargeRaw);
  return resolveMakingChargePercent(percent, typeRaw, "shopify");
}

export function makingChargePercentFromCatalog(
  makingCharge: number | null | undefined
): ResolvedMakingCharge | null {
  const percent = parsePercentValue(
    makingCharge != null ? String(makingCharge) : null
  );
  return resolveMakingChargePercent(percent, "Per gram percentage", "catalog");
}
