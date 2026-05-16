import type { Product } from "@/types/product";

function isShopifyGid(value: string): boolean {
  return value.startsWith("gid://shopify/");
}

/** URL path segment for the product detail route (no leading slash). */
export function getProductSlug(
  product: Pick<Product, "id" | "slug" | "handle">
): string {
  const fromHandle = product.handle?.trim();
  if (fromHandle && !isShopifyGid(fromHandle)) {
    return fromHandle;
  }

  const fromSlug = product.slug?.trim();
  if (fromSlug && !isShopifyGid(fromSlug)) {
    return fromSlug;
  }

  const id = String(product.id).trim();
  if (id && !isShopifyGid(id)) {
    return id;
  }

  return id;
}

export function getProductHref(product: Pick<Product, "id" | "slug" | "handle">): string {
  return `/products/${encodeURIComponent(getProductSlug(product))}`;
}
