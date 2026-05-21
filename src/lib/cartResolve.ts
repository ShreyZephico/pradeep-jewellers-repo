import { fetchSingleCatalogProduct } from "@/lib/fetchSingleCatalogProduct";

export function isShopifyVariantGid(id: string): boolean {
  return id.startsWith("gid://shopify/ProductVariant/");
}

export type ResolveMerchandiseInput = {
  variantId?: string;
  productSlug?: string;
  catalogVariantId?: string;
};

export async function resolveMerchandiseId(
  input: ResolveMerchandiseInput
): Promise<string> {
  const raw =
    typeof input.variantId === "string" ? input.variantId.trim() : "";
  if (isShopifyVariantGid(raw)) {
    return raw;
  }

  const slug =
    typeof input.productSlug === "string" ? input.productSlug.trim() : "";
  const catalogId =
    typeof input.catalogVariantId === "string"
      ? input.catalogVariantId.trim()
      : "";

  if (!slug || !catalogId) {
    throw new Error(
      "Missing product link for cart. Reload the page, or ensure slug matches your Shopify product handle."
    );
  }

  const product = await fetchSingleCatalogProduct(slug);
  const row = product?.variants?.find(
    (v) => v.catalogVariantId === catalogId || v.id === catalogId
  );

  if (row?.id && isShopifyVariantGid(row.id)) {
    return row.id;
  }

  throw new Error(
    "Could not resolve a Shopify variant for this item. Check that slug matches the Shopify product handle."
  );
}
