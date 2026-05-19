import { formatProductPrice } from "@/utils/formatPrice";
import type { Product } from "@/types/product";
import productContent from "@/lib/productContent";

const copy = productContent.purchase;

export type CheckoutLineAttributes = { key: string; value: string }[];

export type StartProductCheckoutOptions = {
  product: Product;
  variantId: string;
  catalogVariantId?: string;
  customPrice: number;
  attributes?: CheckoutLineAttributes;
  redirect?: boolean;
  checkoutFlow?: "customer-session" | "storefront-cart";
};

export type StartProductCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string; needsLogin?: boolean };

function redirectToLogin() {
  localStorage.setItem(
    "redirectAfterLogin",
    `${window.location.pathname}${window.location.search}`
  );
  window.location.href = "/login";
}

export async function startProductCheckout(
  options: StartProductCheckoutOptions
): Promise<StartProductCheckoutResult> {
  const {
    product,
    variantId,
    catalogVariantId,
    customPrice,
    attributes = [],
    redirect = true,
    checkoutFlow = "customer-session",
  } = options;

  const productSlug = (product.slug ?? product.handle ?? "").trim();
  const isStorefrontCart = checkoutFlow === "storefront-cart";

  try {
    const authResponse = await fetch("/api/auth/check", { credentials: "include" });
    const authData = await authResponse.json();
    if (!authData.isAuthenticated) {
      return { ok: false, error: copy.authCheckError, needsLogin: true };
    }
  } catch {
    return { ok: false, error: copy.authCheckError };
  }

  if (isStorefrontCart) {
    const hasGid = variantId.startsWith("gid://shopify/ProductVariant/");
    if (!hasGid && (!productSlug || !catalogVariantId)) {
      return { ok: false, error: copy.shopifyLinkError };
    }
  }

  const lineAttributes: CheckoutLineAttributes = [
    ...attributes,
    { key: "Design", value: product.name },
    {
      key: "Estimated Custom Price",
      value: formatProductPrice(customPrice),
    },
  ];

  try {
    const response = await fetch(
      isStorefrontCart ? "/api/checkout/cart" : "/api/checkout",
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isStorefrontCart
            ? {
                variantId,
                productSlug,
                catalogVariantId: catalogVariantId ?? "",
                customPrice,
                productName: product.name,
                attributes: lineAttributes,
              }
            : {
                variantId,
                attributes: lineAttributes,
                productName: product.name,
                customPrice,
                useDraftOrder: product.customizable,
              }
        ),
      }
    );

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

    if (redirect) {
      window.location.href = data.checkoutUrl as string;
    } else {
      sessionStorage.setItem("pj_last_cart_url", data.checkoutUrl as string);
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

export function handleCheckoutAuthFailure(result: StartProductCheckoutResult) {
  if (result.needsLogin) {
    redirectToLogin();
  }
}
