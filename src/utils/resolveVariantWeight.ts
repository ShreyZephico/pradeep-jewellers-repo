/** Temporary default (grams) when Shopify/API weight is missing or 0. */
export const TEMP_VARIANT_WEIGHT_GRAMS = 5;

/**
 * Use real weight when the API provides a positive value; otherwise a temporary default.
 * Override via `NEXT_PUBLIC_TEMP_VARIANT_WEIGHT_GRAMS` in `.env`.
 */
export function resolveVariantWeight(grams?: number | null): number {
  const fromEnv = Number(process.env.NEXT_PUBLIC_TEMP_VARIANT_WEIGHT_GRAMS);
  const fallback =
    Number.isFinite(fromEnv) && fromEnv > 0
      ? fromEnv
      : TEMP_VARIANT_WEIGHT_GRAMS;

  const w = Number(grams);
  if (Number.isFinite(w) && w > 0) {
    return w;
  }

  return fallback;
}
