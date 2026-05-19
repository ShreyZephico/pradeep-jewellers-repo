import { normalizeCartImageUrl } from "@/lib/cartImageUrl";
import type { Product } from "@/types/product";
import productContent from "@/lib/productContent";
import type { VariantPriceBreakdown } from "@/utils/calculateVariantPrice";

const copy = productContent.purchase;

export type CheckoutLineAttributes = { key: string; value: string }[];

export type CartPricingMeta = {
  priceBreakdown?: VariantPriceBreakdown;
  weightGrams?: number;
  karatLabel?: string | null;
  optionAdjustments?: number;
};

export type StartProductCheckoutOptions = CartPricingMeta & {
  product: Product;
  variantId: string;
  catalogVariantId?: string;
  customPrice: number;
  attributes?: CheckoutLineAttributes;
  redirect?: boolean;
};

export type StartProductCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string; needsLogin?: boolean };

export type AddToCartOptions = CartPricingMeta & {
  product: Product;
  variantId: string;
  catalogVariantId?: string;
  customPrice: number;
  attributes?: CheckoutLineAttributes;
  quantity?: number;
  /** Overrides catalog image when listing/card uses a different src. */
  productImage?: string;
};

export type AddToCartResult =
  | { ok: true }
  | { ok: false; error: string; needsLogin?: boolean };

function redirectToLogin() {
  localStorage.setItem(
    "redirectAfterLogin",
    `${window.location.pathname}${window.location.search}`
  );
  window.location.href = "/login";
}

async function ensureAuthenticated(): Promise<
  { ok: true } | { ok: false; error: string; needsLogin?: boolean }
> {
  try {
    const authResponse = await fetch("/api/auth/check", { credentials: "include" });
    const authData = await authResponse.json();
    if (!authData.isAuthenticated) {
      return { ok: false, error: copy.authCheckError, needsLogin: true };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: copy.authCheckError };
  }
}

function resolveProductImage(
  product: Product,
  variantId: string,
  catalogVariantId?: string
): string {
  const variant = product.variants?.find(
    (v) =>
      v.id === variantId ||
      v.catalogVariantId === variantId ||
      (catalogVariantId &&
        (v.catalogVariantId === catalogVariantId || v.id === catalogVariantId))
  );
  return (
    normalizeCartImageUrl(
      variant?.image ?? product.image ?? product.images?.[0] ?? ""
    ) ?? ""
  );
}

function buildPayload(options: AddToCartOptions | StartProductCheckoutOptions) {
  const productSlug = (options.product.slug ?? options.product.handle ?? "").trim();
  const hasGid = options.variantId.startsWith("gid://shopify/ProductVariant/");

  if (!hasGid && (!productSlug || !options.catalogVariantId)) {
    return { ok: false as const, error: copy.shopifyLinkError };
  }

  const productImage =
    normalizeCartImageUrl(
      "productImage" in options ? options.productImage : undefined
    ) ??
    resolveProductImage(
      options.product,
      options.variantId,
      options.catalogVariantId
    );

  return {
    ok: true as const,
    body: {
      variantId: options.variantId,
      productSlug,
      catalogVariantId: options.catalogVariantId ?? "",
      customPrice: options.customPrice,
      productName: options.product.name,
      productImage: productImage ?? "",
      attributes: options.attributes ?? [],
      quantity: "quantity" in options ? (options.quantity ?? 1) : 1,
      ...(options.priceBreakdown && options.weightGrams != null
        ? {
            priceBreakdown: options.priceBreakdown,
            weightGrams: options.weightGrams,
            karatLabel: options.karatLabel ?? null,
            optionAdjustments: options.optionAdjustments ?? 0,
          }
        : {}),
    },
  };
}

export async function addProductToCart(
  options: AddToCartOptions
): Promise<AddToCartResult> {
  const auth = await ensureAuthenticated();
  if (!auth.ok) return auth;

  const payload = buildPayload(options);
  if (!payload.ok) return payload;

  try {
    const response = await fetch("/api/cart", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload.body),
    });
    const data = await response.json();

    if (response.status === 401) {
      return { ok: false, error: copy.authCheckError, needsLogin: true };
    }
    if (!response.ok) {
      return {
        ok: false,
        error: typeof data.error === "string" ? data.error : copy.checkoutGenericError,
      };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : copy.checkoutGenericError,
    };
  }
}

export async function startProductCheckout(
  options: StartProductCheckoutOptions
): Promise<StartProductCheckoutResult> {
  const auth = await ensureAuthenticated();
  if (!auth.ok) return auth;

  const payload = buildPayload(options);
  if (!payload.ok) return payload;

  try {
    const response = await fetch("/api/cart/checkout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload.body, buyNow: true }),
    });
    const data = await response.json();

    if (response.status === 401) {
      return { ok: false, error: copy.authCheckError, needsLogin: true };
    }
    if (!response.ok || !data.checkoutUrl) {
      return {
        ok: false,
        error: typeof data.error === "string" ? data.error : copy.checkoutGenericError,
      };
    }
    if (options.redirect !== false) {
      window.location.href = data.checkoutUrl as string;
    }
    return { ok: true, checkoutUrl: data.checkoutUrl as string };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : copy.checkoutGenericError,
    };
  }
}

export function resolveDefaultVariant(product: Product) {
  const variant = product.variants?.[0];
  return {
    variantId: variant?.id ?? product.variantId ?? "",
    catalogVariantId: variant?.catalogVariantId ?? variant?.id,
    price: variant?.price ?? product.price,
  };
}

export function handleCheckoutAuthFailure(
  result: StartProductCheckoutResult | AddToCartResult
) {
  if (!result.ok && result.needsLogin) {
    redirectToLogin();
  }
}
