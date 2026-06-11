import { NextResponse } from "next/server";

import { fetchSingleCatalogProduct } from "@/lib/fetchSingleCatalogProduct";
import {
  getCheckoutAuthFromRequest,
  verifyCheckoutCustomer,
} from "@/lib/checkoutAuth";
import {
  createDraftCheckout,
  createStorefrontCartCheckout,
  type CheckoutAttribute,
} from "@/lib/shopify";

type Body = {
  variantId?: string;
  /** Product slug or Shopify handle — used to re-resolve a Storefront GID when the client still has a UUID. */
  productSlug?: string;
  /** Stable Supabase variant id from `catalogVariantId` on the variant row. */
  catalogVariantId?: string;
  /** Catalog line price for optional draft checkout; requires SHOPIFY_ADMIN_ACCESS_TOKEN. Otherwise storefront cart uses Shopify variant price. */
  customPrice?: number;
  productName?: string;
  attributes?: CheckoutAttribute[];
};
function isShopifyVariantGid(id: string): boolean {
  return id.startsWith("gid://shopify/ProductVariant/");
}

async function resolveMerchandiseId(body: Body): Promise<string> {
  const raw = typeof body.variantId === "string" ? body.variantId.trim() : "";
  if (isShopifyVariantGid(raw)) {
    return raw;
  }

  const slug =
    typeof body.productSlug === "string" ? body.productSlug.trim() : "";
  const catalogId =
    typeof body.catalogVariantId === "string"
      ? body.catalogVariantId.trim()
      : "";

  if (!slug || !catalogId) {
    throw new Error(
      "Missing product link for checkout. Reload the page, or set shopify_handle / slug to match your Shopify product handle."
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
    "Could not resolve a Shopify variant for checkout. Check that slug matches the Shopify product handle and options align with Shopify."
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const merchandiseId = await resolveMerchandiseId(body);

    const rawPrice = body.customPrice;
    const customPrice =
      typeof rawPrice === "number" && Number.isFinite(rawPrice)
        ? Math.max(0, Math.round(rawPrice))
        : 0;

    const attributes = Array.isArray(body.attributes)
      ? (body.attributes as CheckoutAttribute[])
      : [];

    const auth = getCheckoutAuthFromRequest(request);
    if (!auth?.customerAccessToken) {
      return NextResponse.json(
        { error: "Please login before checkout." },
        { status: 401 }
      );
    }

    const customer = await verifyCheckoutCustomer(auth.customerAccessToken);
    if (!customer) {
      return NextResponse.json(
        { error: "Your login expired. Please login again." },
        { status: 401 }
      );
    }

    const customerAccessToken = auth.customerAccessToken;
    const customerEmail = customer.email ?? auth.email ?? undefined;

    const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    if (customPrice > 0 && adminToken) {
      const productName =
        typeof body.productName === "string" && body.productName.trim()
          ? body.productName.trim()
          : "Product";

      const checkoutUrl = await createDraftCheckout({
        productName,
        variantId: merchandiseId,
        price: customPrice,
        attributes,
        customerEmail,
      });

      return NextResponse.json({
        success: true,
        checkoutUrl,
        authenticated: Boolean(customerAccessToken),
        customerEmail: customerEmail ?? null,
      });
    }

    const checkoutUrl = await createStorefrontCartCheckout({
      variantId: merchandiseId,
      customerAccessToken,
      attributes,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl,
      authenticated: Boolean(customerAccessToken),
      customerEmail: customerEmail ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
