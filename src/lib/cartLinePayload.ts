import { PJ_BREAKDOWN_ATTR, PJ_IMAGE_URL_ATTR } from "@/lib/cartConstants";
import { breakdownAttributesFromPricing } from "@/lib/cartBreakdown";
import { normalizeCartImageUrl } from "@/lib/cartImageUrl";
import { buildCartLineAttributes } from "@/lib/shopifyCart";
import type { CheckoutAttribute } from "@/lib/shopify";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";
import { formatProductPrice } from "@/utils/formatPrice";

const PJ_BREAKDOWN_KEYS = new Set<string>(Object.values(PJ_BREAKDOWN_ATTR));

export type CartItemBody = {
  variantId?: string;
  productSlug?: string;
  catalogVariantId?: string;
  customPrice?: number;
  productName?: string;
  productImage?: string;
  attributes?: CheckoutAttribute[];
  quantity?: number;
  priceBreakdown?: VariantPriceBreakdown;
  weightGrams?: number;
  karatLabel?: string | null;
  optionAdjustments?: number;
};

export function buildLineAttributesForCart(
  body: CartItemBody
): CheckoutAttribute[] {
  const rawPrice = body.customPrice;
  const customPrice =
    typeof rawPrice === "number" && Number.isFinite(rawPrice)
      ? Math.max(0, Math.round(rawPrice))
      : 0;

  const productName =
    typeof body.productName === "string" && body.productName.trim()
      ? body.productName.trim()
      : "Product";

  const incoming = Array.isArray(body.attributes)
    ? (body.attributes as CheckoutAttribute[])
    : [];

  const productImage = normalizeCartImageUrl(body.productImage);

  const breakdownAttrs =
    body.priceBreakdown &&
    typeof body.weightGrams === "number" &&
    Number.isFinite(body.weightGrams)
      ? breakdownAttributesFromPricing({
          breakdown: body.priceBreakdown,
          weightGrams: body.weightGrams,
          karatLabel: body.karatLabel,
          optionAdjustments: body.optionAdjustments ?? 0,
        })
      : [];

  const base: CheckoutAttribute[] = [
    ...incoming.filter(
      (a) => a.key !== PJ_IMAGE_URL_ATTR && !PJ_BREAKDOWN_KEYS.has(a.key)
    ),
    ...breakdownAttrs,
    { key: "Design", value: productName },
    {
      key: "Estimated Custom Price",
      value: formatProductPrice(customPrice),
    },
    ...(productImage
      ? [{ key: PJ_IMAGE_URL_ATTR, value: productImage }]
      : []),
  ];

  return buildCartLineAttributes(base, customPrice);
}
