import type { Product } from "@/types/product";

export type CuratedTabId = "new-arrivals" | "bestsellers" | "on-sale" | string;

function tagMatches(product: Product, pattern: RegExp): boolean {
  return (product.tags ?? []).some((tag) => pattern.test(tag));
}

export function isOnSaleProduct(product: Product): boolean {
  const compare = product.compareAtPrice ?? 0;
  return compare > product.price;
}

export function isBestsellerProduct(product: Product): boolean {
  if (product.badge?.toUpperCase().includes("BESTSELLER")) {
    return true;
  }
  return tagMatches(product, /bestseller|best-seller|best_seller/i);
}

export function isNewArrivalProduct(product: Product): boolean {
  if (product.badge?.toUpperCase() === "NEW") {
    return true;
  }
  return tagMatches(product, /\bnew\b|new-arrival|new_arrival/i);
}

export function filterProductsForCuratedTab(
  products: Product[],
  tabId: CuratedTabId,
  limit: number
): Product[] {
  let pool: Product[];

  switch (tabId) {
    case "on-sale":
      pool = products.filter(isOnSaleProduct);
      break;
    case "bestsellers":
      pool = products.filter(isBestsellerProduct);
      break;
    case "new-arrivals":
      pool = products.filter(isNewArrivalProduct);
      break;
    default:
      pool = products;
  }

  if (pool.length < limit) {
    const seen = new Set(pool.map((p) => p.id));
    for (const product of products) {
      if (pool.length >= limit) break;
      if (!seen.has(product.id)) {
        pool.push(product);
        seen.add(product.id);
      }
    }
  }

  return pool.slice(0, limit);
}

export function productTypeLabel(product: Product): string {
  return product.productType?.trim() || "Fine Jewellery";
}

export function productCardBadge(product: Product): string | undefined {
  if (isOnSaleProduct(product)) {
    return "SALE";
  }
  return product.badge;
}

export function formatMakingChargeLabel(product: Product): string | null {
  const percent = product.makingChargePercent;
  if (percent == null || percent <= 0) {
    return null;
  }
  return `${percent}%`;
}
