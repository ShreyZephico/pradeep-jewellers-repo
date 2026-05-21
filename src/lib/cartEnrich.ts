import { PJ_IMAGE_URL_ATTR } from "@/lib/cartConstants";
import { normalizeCartImageUrl } from "@/lib/cartImageUrl";
import { fetchSingleCatalogProduct } from "@/lib/fetchSingleCatalogProduct";
import type { CartSnapshot } from "@/lib/shopifyCart";
import type { Product } from "@/types/product";

function imageFromAttributes(
  attributes: { key: string; value: string }[]
): string | null {
  const raw = attributes.find((a) => a.key === PJ_IMAGE_URL_ATTR)?.value;
  return normalizeCartImageUrl(raw);
}

function imageFromProduct(
  product: Product,
  merchandiseId: string
): string | null {
  const variant = product.variants?.find((v) => v.id === merchandiseId);
  return normalizeCartImageUrl(
    variant?.image ?? product.image ?? product.images?.[0] ?? null
  );
}

export async function enrichCartImages(
  cart: CartSnapshot
): Promise<CartSnapshot> {
  const needsEnrich = cart.lines.some(
    (line) => !normalizeCartImageUrl(line.imageUrl)
  );
  if (!needsEnrich) return cart;

  const productByHandle = new Map<string, Product | null>();

  const lines = await Promise.all(
    cart.lines.map(async (line) => {
      const existing = normalizeCartImageUrl(line.imageUrl);
      if (existing) return { ...line, imageUrl: existing };

      const fromAttr = imageFromAttributes(line.attributes);
      if (fromAttr) return { ...line, imageUrl: fromAttr };

      const handle = line.productHandle?.trim();
      if (!handle) return line;

      if (!productByHandle.has(handle)) {
        try {
          productByHandle.set(handle, await fetchSingleCatalogProduct(handle));
        } catch {
          productByHandle.set(handle, null);
        }
      }

      const product = productByHandle.get(handle);
      if (!product) return line;

      const url = imageFromProduct(product, line.merchandiseId);
      return url ? { ...line, imageUrl: url } : line;
    })
  );

  return { ...cart, lines };
}
