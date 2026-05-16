/** True if the label looks like a gold karat (e.g. 18K, 22 KT, 24 Karat). */
export function isKaratLabel(value: string): boolean {
  const v = value.trim();
  if (!v) {
    return false;
  }
  return (
    /\d+\s*k(t)?\b/i.test(v) ||
    /\b(14|18|22|24)\s*karat\b/i.test(v) ||
    /\b(14|18|22|24)\s*k\b/i.test(v)
  );
}

/** Numeric karat from labels like 18K, 22 KT, 18kt, 24 Karat (defaults to 24). */
export function parseKaratNumber(carat: string | null | undefined): number {
  const v = carat?.trim();
  if (!v) {
    return 24;
  }
  const explicit = v.match(/\b(14|18|22|24)\b/i) ?? v.match(/(14|18|22|24)/);
  if (explicit) {
    return Number(explicit[1]);
  }
  const digits = v.replace(/\D/g, "");
  const n = Number(digits);
  if (n >= 14 && n <= 24) {
    return n;
  }
  return 24;
}

/** Pick the active karat string from metal/carat selections (18K, 22K, etc.). */
export function resolveKaratFromSelection(
  selectedMetal: string,
  selectedCarat: string
): string | null {
  if (selectedCarat.trim() && isKaratLabel(selectedCarat)) {
    return selectedCarat.trim();
  }
  if (selectedMetal.trim() && isKaratLabel(selectedMetal)) {
    return selectedMetal.trim();
  }
  if (selectedCarat.trim()) {
    return selectedCarat.trim();
  }
  return null;
}

/** Shopify option is a karat/purity picker when its values are mostly karat labels. */
export function isKaratOption(option: { name: string; values: string[] }): boolean {
  const values = option.values.filter(Boolean);
  if (values.length === 0) {
    return false;
  }
  const karatCount = values.filter((v) => isKaratLabel(v)).length;
  return karatCount >= Math.ceil(values.length / 2);
}
