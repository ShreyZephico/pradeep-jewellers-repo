import type { Product } from "@/types/product";
import { getProductSlug } from "@/utils/productUrl";

const snapshot = new Map<string, Product>();

export function rememberListProduct(product: Product): void {
  const slug = getProductSlug(product);
  if (!slug) return;
  snapshot.set(slug, product);
}

export function rememberListProducts(products: Product[]): void {
  for (const product of products) {
    rememberListProduct(product);
  }
}

export function readListProductSnapshot(slug: string): Product | null {
  return snapshot.get(slug) ?? null;
}
