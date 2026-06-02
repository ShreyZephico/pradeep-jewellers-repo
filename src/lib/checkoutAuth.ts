export type CheckoutAuth = {
  customerAccessToken: string;
  email: string | null;
  name: string | null;
  loginMethod: string | null;
};

function getCookieValue(cookieHeader: string | null, name: string): string | null {
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

/** Read Shopify customer session + profile hints from request cookies. */
export function getCheckoutAuthFromRequest(request: Request): CheckoutAuth | null {
  const cookieHeader = request.headers.get("cookie");
  const token = getCookieValue(cookieHeader, "customerAccessToken")?.trim();
  if (!token) return null;

  // Shopify merchant OAuth stores a base64 JSON blob — not a Storefront customer token.
  try {
    const parsed = JSON.parse(
      Buffer.from(token, "base64").toString("utf8")
    ) as { shop?: string; accessToken?: string };
    if (parsed.shop && parsed.accessToken) {
      return null;
    }
  } catch {
    /* valid Storefront customer access token */
  }

  return {
    customerAccessToken: token,
    email: getCookieValue(cookieHeader, "customerEmail"),
    name: getCookieValue(cookieHeader, "customerName"),
    loginMethod: getCookieValue(cookieHeader, "loginMethod"),
  };
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

/** Returns verified customer profile when the cookie token is a valid Storefront session. */
export async function verifyCheckoutCustomer(
  customerAccessToken: string
): Promise<{
  id: string;
  email: string | null;
  displayName: string | null;
} | null> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const apiVersion =
    process.env.SHOPIFY_STOREFRONT_API_VERSION?.trim() || "2026-04";

  if (!domain || !storefrontToken) {
    return null;
  }

  const response = await fetch(
    `https://${domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "")}/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontToken,
      },
      body: JSON.stringify({
        query: VERIFY_CUSTOMER_QUERY,
        variables: { customerAccessToken },
      }),
    }
  );

  const data = await response.json();
  const customer = data.data?.customer;
  if (!customer?.id) return null;

  return {
    id: customer.id,
    email: customer.email ?? null,
    displayName: customer.displayName ?? null,
  };
}
