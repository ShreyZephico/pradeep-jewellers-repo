import type { Product } from "@/types/product";

/** Short material line for collection cards (e.g. "22K GOLD"). */
export function getProductMaterialLabel(product: Product): string {
  const haystack = [
    product.productType,
    product.badge,
    ...(product.tags ?? []),
    product.name,
    product.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/diamond|vvs|vs1|solitaire/.test(haystack)) {
    if (/18k|18 k|gold/.test(haystack)) return "18K • VVS DIAMOND";
    if (/22k|22 k/.test(haystack)) return "22K • DIAMOND";
    return "DIAMOND";
  }
  if (/22k|22 k|22kt/.test(haystack)) return "22K GOLD";
  if (/18k|18 k|18kt/.test(haystack)) return "18K GOLD";
  if (/14k|14 k/.test(haystack)) return "14K GOLD";
  if (/silver|sterling/.test(haystack)) return "STERLING SILVER";
  if (/platinum|pt\b/.test(haystack)) return "PLATINUM";
  if (/gemstone|ruby|emerald|sapphire|pearl/.test(haystack)) return "GEMSTONE";
  if (/gold/.test(haystack)) return "GOLD";
  return "FINE JEWELLERY";
}

/** Making charge label for card footer (e.g. "Making 8%"). */
export function getProductMakingLabel(product: Product): string | null {
  const variant = product.variants?.[0];
  if (variant?.makingCharge != null && variant.makingCharge > 0 && variant.price > 0) {
    const pct = Math.round((variant.makingCharge / variant.price) * 100);
    if (pct > 0 && pct < 100) {
      return `Making ${pct}%`;
    }
  }
  return null;
}

/** Card corner badge from product data. */
export function getProductCornerBadge(product: Product): string | null {
  if (product.badge?.trim()) {
    return product.badge.trim().toUpperCase();
  }
  const list = product.compareAtPrice ?? 0;
  if (list > product.price) {
    return "SALE";
  }
  return null;
}
