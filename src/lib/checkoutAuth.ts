import type { NextResponse } from "next/server";

import {
  applyCustomerAccessTokenCookie,
  clearCustomerSessionCookies,
} from "@/lib/customerSessionCookies";
import {
  getShopifyStoreDomain,
  getShopifyStorefrontToken,
} from "@/lib/shopifyEnv";
import { getShopifyStorefrontApiVersion } from "@/lib/shopifyApiVersion";

export { getShopifyStoreDomain, getShopifyStorefrontToken } from "@/lib/shopifyEnv";

export type CheckoutAuth = {
  customerAccessToken: string;
  email: string | null;
  name: string | null;
  loginMethod: string | null;
};

export type VerifiedCustomer = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
};

export type ResolvedCustomerSession = {
  customer: VerifiedCustomer;
  accessToken: string;
  expiresAt: string | null;
  email: string | null;
  name: string | null;
  loginMethod: string | null;
};

function getCookieValue(
  cookieHeader: string | null,
  name: string
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function isMerchantOAuthToken(token: string): boolean {
  try {
    const parsed = JSON.parse(
      Buffer.from(token, "base64").toString("utf8")
    ) as { shop?: string; accessToken?: string };
    return Boolean(parsed.shop && parsed.accessToken);
  } catch {
    return false;
  }
}

function storefrontGraphqlUrl(): string | null {
  const domain = getShopifyStoreDomain();
  if (!domain) return null;
  return `https://${domain}/api/${getShopifyStorefrontApiVersion()}/graphql.json`;
}

async function storefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T | null> {
  const url = storefrontGraphqlUrl();
  const token = getShopifyStorefrontToken();
  if (!url || !token) return null;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = await response.json();
  if (!response.ok || json.errors?.length) {
    return null;
  }

  return json.data as T;
}

const VERIFY_CUSTOMER_QUERY = `
  query VerifyCustomer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      email
      firstName
      lastName
      displayName
    }
  }
`;

const RENEW_TOKEN_MUTATION = `
  mutation RenewCustomerAccessToken($customerAccessToken: String!) {
    customerAccessTokenRenew(customerAccessToken: $customerAccessToken) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function mapCustomer(
  customer: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  } | null | undefined
): VerifiedCustomer | null {
  if (!customer?.id) return null;
  return {
    id: customer.id,
    email: customer.email ?? null,
    firstName: customer.firstName ?? null,
    lastName: customer.lastName ?? null,
    displayName: customer.displayName ?? null,
  };
}

export function customerDisplayName(customer: VerifiedCustomer): string {
  const full = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    full ||
    customer.displayName?.trim() ||
    customer.email?.split("@")[0] ||
    "User"
  );
}

/** Read Shopify customer session from request cookies. */
export function getCheckoutAuthFromRequest(
  request: Request
): CheckoutAuth | null {
  const cookieHeader = request.headers.get("cookie");
  const token = getCookieValue(cookieHeader, "customerAccessToken")?.trim();
  if (!token || isMerchantOAuthToken(token)) return null;

  return {
    customerAccessToken: token,
    email: getCookieValue(cookieHeader, "customerEmail"),
    name: getCookieValue(cookieHeader, "customerName"),
    loginMethod: getCookieValue(cookieHeader, "loginMethod"),
  };
}

/** Returns verified customer profile when the cookie token is valid. */
export async function verifyCheckoutCustomer(
  customerAccessToken: string
): Promise<VerifiedCustomer | null> {
  const data = await storefrontFetch<{
    customer: VerifiedCustomer | null;
  }>(VERIFY_CUSTOMER_QUERY, { customerAccessToken });

  return mapCustomer(data?.customer);
}

async function renewCustomerAccessToken(
  customerAccessToken: string
): Promise<{ accessToken: string; expiresAt: string } | null> {
  const data = await storefrontFetch<{
    customerAccessTokenRenew: {
      customerAccessToken: { accessToken: string; expiresAt: string } | null;
      userErrors: { message: string }[];
    };
  }>(RENEW_TOKEN_MUTATION, { customerAccessToken });

  const renewed = data?.customerAccessTokenRenew?.customerAccessToken;
  if (!renewed?.accessToken || !renewed.expiresAt) {
    return null;
  }

  return renewed;
}

/**
 * Verify session; renew Shopify token when expired.
 * Returns null when the session is invalid.
 */
export async function resolveCustomerSession(
  request: Request
): Promise<ResolvedCustomerSession | null> {
  const auth = getCheckoutAuthFromRequest(request);
  if (!auth) return null;

  let accessToken = auth.customerAccessToken;
  let expiresAt: string | null = null;

  let customer = await verifyCheckoutCustomer(accessToken);

  if (!customer) {
    const renewed = await renewCustomerAccessToken(accessToken);
    if (!renewed) return null;

    accessToken = renewed.accessToken;
    expiresAt = renewed.expiresAt;
    customer = await verifyCheckoutCustomer(accessToken);
    if (!customer) return null;
  }

  return {
    customer,
    accessToken,
    expiresAt,
    email: customer.email ?? auth.email,
    name: customerDisplayName(customer) || auth.name,
    loginMethod: auth.loginMethod,
  };
}

/** Attach renewed token cookies or clear invalid session on the response. */
export function applyResolvedSessionToResponse(
  response: NextResponse,
  session: ResolvedCustomerSession | null
): void {
  if (!session) {
    clearCustomerSessionCookies(response);
    return;
  }

  if (session.expiresAt) {
    applyCustomerAccessTokenCookie(
      response,
      session.accessToken,
      session.expiresAt
    );
  }
}
