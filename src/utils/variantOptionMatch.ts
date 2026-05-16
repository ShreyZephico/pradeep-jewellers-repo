import type { ProductVariant } from "@/types/product";

export function normOptionValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
}

/** Loose match for catalog vs Shopify option strings (e.g. "14 KT" vs "14k", "7" vs "Size 7"). */
export function optionValuesRoughlyEqual(a: string, b: string): boolean {
  const na = normOptionValue(a);
  const nb = normOptionValue(b);
  if (!na || !nb) {
    return false;
  }
  if (na === nb) {
    return true;
  }
  if (na.includes(nb) || nb.includes(na)) {
    return true;
  }
  const stripMetal = (s: string) =>
    s
      .replace(/\bkt\b/g, "k")
      .replace(/\bkarat\b/g, "k")
      .replace(/[^a-z0-9]/g, "");
  const sa = stripMetal(na);
  const sb = stripMetal(nb);
  if (sa.length >= 4 && sb.length >= 4 && (sa.includes(sb) || sb.includes(sa))) {
    return true;
  }
  const digitsA = na.replace(/\D/g, "");
  const digitsB = nb.replace(/\D/g, "");
  if (
    digitsA.length > 0 &&
    digitsA === digitsB &&
    (na.length <= 6 || nb.length <= 6)
  ) {
    return true;
  }
  return false;
}

export function variantOptionValueSet(v: ProductVariant): Set<string> {
  return new Set(
    v.selectedOptions
      .filter((o) => o.value?.trim())
      .map((o) => normOptionValue(o.value))
  );
}

export function catalogValuesFitStorefront(
  wanted: Set<string>,
  have: Set<string>
): boolean {
  const haveArr = [...have];
  for (const w of wanted) {
    const ok = have.has(w) || haveArr.some((h) => optionValuesRoughlyEqual(w, h));
    if (!ok) {
      return false;
    }
  }
  return true;
}

export function intersectionScoreFuzzy(
  wanted: Set<string>,
  have: Set<string>
): number {
  const haveArr = [...have];
  let score = 0;
  for (const w of wanted) {
    if (have.has(w) || haveArr.some((h) => optionValuesRoughlyEqual(w, h))) {
      score++;
    }
  }
  return score;
}

/** Best Shopify variant for current picker values (karat match weighted highest). */
export function findBestMatchingVariant<
  T extends { selectedOptions: { name: string; value: string }[] },
>(
  variants: T[] | undefined,
  selected: {
    metal: string;
    carat: string;
    quality: string;
    size: string;
    karatLabel?: string | null;
  }
): T | undefined {
  if (!variants?.length) {
    return undefined;
  }

  const selectedValues = [selected.metal, selected.carat, selected.quality, selected.size]
    .filter(Boolean)
    .map((v) => normOptionValue(v));

  let best: T | undefined;
  let bestScore = -1;

  for (const variant of variants) {
    let score = 0;
    for (const value of selectedValues) {
      const hit = variant.selectedOptions.some((option) => {
        const ov = normOptionValue(option.value);
        return ov === value || optionValuesRoughlyEqual(value, option.value);
      });
      if (hit) {
        score += 1;
      }
    }

    if (selected.karatLabel) {
      const karatHit = variant.selectedOptions.some((option) =>
        optionValuesRoughlyEqual(selected.karatLabel!, option.value)
      );
      if (karatHit) {
        score += 20;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = variant;
    }
  }

  return best;
}
