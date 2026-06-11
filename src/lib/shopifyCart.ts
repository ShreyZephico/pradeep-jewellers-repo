import { PJ_CUSTOM_PRICE_ATTR, PJ_IMAGE_URL_ATTR } from "@/lib/cartConstants";
import { normalizeCartImageUrl } from "@/lib/cartImageUrl";
import { getShopifyStorefrontApiVersion } from "@/lib/shopifyApiVersion";
import type { CheckoutAttribute } from "@/lib/shopify";

function normalizeStoreDomain(raw?: string): string {
  if (!raw?.trim()) return "";
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

function getStorefrontCredentials() {
  const domain = normalizeStoreDomain(
    process.env.NEXT_SHOPIFY_STORE ?? process.env.SHOPIFY_STORE_DOMAIN
  );
  const apiVersion = getShopifyStorefrontApiVersion();
  const publicToken = process.env.NEXT_SHOPIFY_STOREFRONT_TOKEN?.trim();
  const serverToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();
  const token =
    (publicToken && !publicToken.startsWith("shpat_") ? publicToken : undefined) ??
    serverToken ??
    publicToken ??
    "";
  return { domain, token, apiVersion };
}

async function storefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const { domain, token, apiVersion } = getStorefrontCredentials();
  if (!domain || !token) {
    throw new Error("Missing Shopify Storefront credentials.");
  }

  const response = await fetch(`https://${domain}/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });

  const json = await response.json();
  if (!response.ok || json.errors) {
    throw new Error(
      json.errors?.[0]?.message ?? `Shopify Storefront API returned ${response.status}`
    );
  }

  return json.data as T;
}

const cartFields = `
  id
  checkoutUrl
  totalQuantity
  lines(first: 50) {
    edges {
      node {
        id
        quantity
        attributes { key value }
        merchandise {
          ... on ProductVariant {
            id
            title
            image { url altText }
            product {
              title
              handle
              featuredImage { url altText }
              images(first: 1) {
                edges {
                  node { url altText }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const CART_QUERY = `query Cart($cartId: ID!) { cart(id: $cartId) { ${cartFields} } }`;
const CART_CREATE_MUTATION = `mutation CartCreate($input: CartInput!) { cartCreate(input: $input) { cart { ${cartFields} } userErrors { field message } } }`;
const CART_LINES_ADD_MUTATION = `mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${cartFields} } userErrors { field message } } }`;
const CART_LINES_UPDATE_MUTATION = `mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${cartFields} } userErrors { field message } } }`;
const CART_LINES_REMOVE_MUTATION = `mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${cartFields} } userErrors { field message } } }`;

type ShopifyCartNode = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: {
    edges: {
      node: {
        id: string;
        quantity: number;
        attributes: { key: string; value: string }[];
        merchandise: {
          id: string;
          title: string;
          image: { url: string; altText: string | null } | null;
          product: {
            title: string;
            handle: string;
            featuredImage: { url: string; altText: string | null } | null;
            images?: {
              edges: { node: { url: string; altText: string | null } }[];
            };
          };
        };
      };
    }[];
  };
};

export type CartLine = {
  id: string;
  quantity: number;
  merchandiseId: string;
  title: string;
  productHandle: string;
  imageUrl: string | null;
  customPriceInr: number;
  attributes: CheckoutAttribute[];
};

export type CartSnapshot = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: CartLine[];
  subtotalInr: number;
};

function getAttributeValue(
  attributes: CheckoutAttribute[],
  key: string
): string | undefined {
  return attributes.find((a) => a.key === key)?.value.trim();
}

export function parseCustomPriceInr(attributes: CheckoutAttribute[]): number {
  const raw = getAttributeValue(attributes, PJ_CUSTOM_PRICE_ATTR);
  if (raw) {
    const parsed = parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const estimated = getAttributeValue(attributes, "Estimated Custom Price");
  if (estimated) {
    const parsed = parseInt(estimated.replace(/[^\d]/g, ""), 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

function mapCart(node: ShopifyCartNode): CartSnapshot {
  const lines: CartLine[] = node.lines.edges.map(({ node: line }) => {
    const attributes = line.attributes.map((a) => ({
      key: a.key,
      value: a.value,
    }));
    return {
      id: line.id,
      quantity: line.quantity,
      merchandiseId: line.merchandise.id,
      title: line.merchandise.product.title || line.merchandise.title,
      productHandle: line.merchandise.product.handle,
      imageUrl:
        normalizeCartImageUrl(
          line.merchandise.image?.url ??
            line.merchandise.product.featuredImage?.url ??
            line.merchandise.product.images?.edges[0]?.node.url ??
            getAttributeValue(attributes, PJ_IMAGE_URL_ATTR) ??
            null
        ),
      customPriceInr: parseCustomPriceInr(attributes),
      attributes,
    };
  });

  return {
    id: node.id,
    checkoutUrl: node.checkoutUrl,
    totalQuantity: node.totalQuantity,
    lines,
    subtotalInr: lines.reduce(
      (sum, line) => sum + line.customPriceInr * line.quantity,
      0
    ),
  };
}

function firstUserError(
  userErrors: { field: string[] | null; message: string }[] | undefined
) {
  const error = userErrors?.[0];
  if (error) throw new Error(error.message);
}

export async function fetchCart(cartId: string): Promise<CartSnapshot | null> {
  const data = await storefrontFetch<{ cart: ShopifyCartNode | null }>(
    CART_QUERY,
    { cartId }
  );
  return data.cart ? mapCart(data.cart) : null;
}

export type AddCartLineInput = {
  merchandiseId: string;
  quantity?: number;
  attributes?: CheckoutAttribute[];
  customerAccessToken?: string;
};

export async function createCartWithLine(
  line: AddCartLineInput
): Promise<CartSnapshot> {
  const lineAttributes = (line.attributes ?? [])
    .filter((a) => a.key.trim() && a.value.trim())
    .map((a) => ({ key: a.key, value: a.value }));

  const input: Record<string, unknown> = {
    lines: [
      {
        merchandiseId: line.merchandiseId,
        quantity: Math.max(1, line.quantity ?? 1),
        ...(lineAttributes.length > 0 ? { attributes: lineAttributes } : {}),
      },
    ],
  };

  if (line.customerAccessToken?.trim()) {
    input.buyerIdentity = {
      customerAccessToken: line.customerAccessToken.trim(),
    };
  }

  const data = await storefrontFetch<{
    cartCreate: {
      cart: ShopifyCartNode | null;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(CART_CREATE_MUTATION, { input });

  firstUserError(data.cartCreate.userErrors);
  if (!data.cartCreate.cart) {
    throw new Error("Shopify did not return a cart.");
  }
  return mapCart(data.cartCreate.cart);
}

export async function addCartLines(
  cartId: string,
  lines: AddCartLineInput[]
): Promise<CartSnapshot> {
  const mapped = lines.map((line) => {
    const lineAttributes = (line.attributes ?? [])
      .filter((a) => a.key.trim() && a.value.trim())
      .map((a) => ({ key: a.key, value: a.value }));
    return {
      merchandiseId: line.merchandiseId,
      quantity: Math.max(1, line.quantity ?? 1),
      ...(lineAttributes.length > 0 ? { attributes: lineAttributes } : {}),
    };
  });

  const data = await storefrontFetch<{
    cartLinesAdd: {
      cart: ShopifyCartNode | null;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(CART_LINES_ADD_MUTATION, { cartId, lines: mapped });

  firstUserError(data.cartLinesAdd.userErrors);
  if (!data.cartLinesAdd.cart) {
    throw new Error("Shopify did not return an updated cart.");
  }
  return mapCart(data.cartLinesAdd.cart);
}

export async function updateCartLineQuantity(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<CartSnapshot> {
  const data = await storefrontFetch<{
    cartLinesUpdate: {
      cart: ShopifyCartNode | null;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(CART_LINES_UPDATE_MUTATION, {
    cartId,
    lines: [{ id: lineId, quantity: Math.max(0, quantity) }],
  });

  firstUserError(data.cartLinesUpdate.userErrors);
  if (!data.cartLinesUpdate.cart) {
    throw new Error("Shopify did not return an updated cart.");
  }
  return mapCart(data.cartLinesUpdate.cart);
}

/** Remove every line from a Storefront cart (used after paid checkout). */
export async function emptyShopifyCart(cartId: string): Promise<CartSnapshot | null> {
  const cart = await fetchCart(cartId);
  if (!cart?.lines.length) {
    return cart;
  }
  return removeCartLines(
    cartId,
    cart.lines.map((line) => line.id)
  );
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[]
): Promise<CartSnapshot> {
  const data = await storefrontFetch<{
    cartLinesRemove: {
      cart: ShopifyCartNode | null;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(CART_LINES_REMOVE_MUTATION, { cartId, lineIds });

  firstUserError(data.cartLinesRemove.userErrors);
  if (!data.cartLinesRemove.cart) {
    throw new Error("Shopify did not return an updated cart.");
  }
  return mapCart(data.cartLinesRemove.cart);
}

export function buildCartLineAttributes(
  attributes: CheckoutAttribute[],
  customPriceInr: number
): CheckoutAttribute[] {
  const cleaned = attributes.filter((a) => a.key.trim() && a.value.trim());
  const withoutHidden = cleaned.filter((a) => a.key !== PJ_CUSTOM_PRICE_ATTR);
  return [
    ...withoutHidden,
    {
      key: PJ_CUSTOM_PRICE_ATTR,
      value: String(Math.max(0, Math.round(customPriceInr))),
    },
  ];
}

const VARIANT_AVAILABILITY_QUERY = `
  query VariantAvailability($id: ID!) {
    node(id: $id) {
      ... on ProductVariant {
        availableForSale
      }
    }
  }
`;

export type VariantAvailability = {
  availableForSale: boolean;
  quantityAvailable: number | null;
};

export async function checkVariantAvailability(
  variantGid: string
): Promise<VariantAvailability> {
  try {
    const data = await storefrontFetch<{
      node: {
        availableForSale?: boolean;
        quantityAvailable?: number | null;
      } | null;
    }>(VARIANT_AVAILABILITY_QUERY, { id: variantGid });

    const node = data.node;
    return {
      availableForSale: node?.availableForSale !== false,
      quantityAvailable: null,
    };
  } catch {
    return { availableForSale: true, quantityAvailable: null };
  }
}

const CART_BUYER_IDENTITY_UPDATE = `
  mutation CartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart { id }
      userErrors { field message }
    }
  }
`;

export async function updateCartBuyerIdentity(
  cartId: string,
  customerAccessToken: string
): Promise<void> {
  const data = await storefrontFetch<{
    cartBuyerIdentityUpdate: {
      cart: { id: string } | null;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(CART_BUYER_IDENTITY_UPDATE, {
    cartId,
    buyerIdentity: { customerAccessToken: customerAccessToken.trim() },
  });

  firstUserError(data.cartBuyerIdentityUpdate.userErrors);
}
