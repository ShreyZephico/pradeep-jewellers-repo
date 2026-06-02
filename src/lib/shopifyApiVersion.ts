/** Single Storefront API version for all server routes. */
export function getShopifyStorefrontApiVersion(): string {
  return process.env.SHOPIFY_STOREFRONT_API_VERSION?.trim() || "2026-04";
}

export function getShopifyStorefrontGraphqlUrl(domain: string): string {
  const host = domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return `https://${host}/api/${getShopifyStorefrontApiVersion()}/graphql.json`;
}
